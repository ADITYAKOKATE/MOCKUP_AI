
export const AudioRecorder = {
  mediaRecorder: null,
  audioChunks: [],
  stream: null,
  audioContext: null,
  analyser: null,
  exemplarAnimationId: null,

  audioContext: null,
  analyser: null,
  exemplarAnimationId: null,
  isSlicing: false,
  resolveSlice: null,

  getDevices: async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
       return { mics: [], speakers: [] };
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter(d => d.kind === 'audioinput');
    const speakers = devices.filter(d => d.kind === 'audiooutput');
    return { mics, speakers };
  },

  start: async (deviceId = null, onAmplitude = null, onMuteChange = null, onSilence = null, onVoiceStart = null, silenceThreshold = 0.03, silenceDuration = 1500) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Microphone not supported");
    }

    // Try to disable processing which can cause mute issues on Windows
    const constraints = { 
        audio: {
            deviceId: (deviceId && deviceId !== 'default') ? { exact: deviceId } : undefined,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
        }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    AudioRecorder.stream = stream;
    
    // Explicitly enable tracks and listen for hardware mute
    stream.getAudioTracks().forEach(track => {
        track.enabled = true;
        
        // Detection of persistent mute
        setTimeout(async () => {
            if (track.muted) {
                console.warn("🎤 Track still muted after 500ms. Attempting fallback...");
                track.stop();
                
                // Fallback: Try simplest constraints
                try {
                    const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.log("🎤 Fallback stream obtained");
                    AudioRecorder.stream = fallbackStream;
                    // Re-init recorder with fallback stream if needed (complex, but for now let's just swap stream)
                    // Note: MediaRecorder is already created with old stream. We might need to restart it.
                    // Ideally, we catch this before creating MediaRecorder.
                } catch(e) {
                    console.error("🎤 Fallback failed", e);
                }
            }
        }, 500);

        track.onmute = () => {
             console.warn("🎤 Source Muted (Hardware/OS/Browser)");
             if(onMuteChange) onMuteChange(true);
        };
        track.onunmute = () => {
             console.log("🎤 Source Unmuted");
             if(onMuteChange) onMuteChange(false);
        };
    });



    // Prefer webm/opus for broad compatibility and smaller size
    const options = { mimeType: 'audio/webm;codecs=opus' };
    
    try {
        AudioRecorder.mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
        // Fallback if the browser doesn't support the specific mimeType
        console.warn("MediaRecorder mimeType not supported, falling back to default");
        AudioRecorder.mediaRecorder = new MediaRecorder(stream);
    }
    
    AudioRecorder.audioChunks = [];

    AudioRecorder.mediaRecorder.addEventListener("dataavailable", event => {
      console.log(`🎤 Chunk received: ${event.data.size} bytes`);
      if (event.data.size > 0) {
        AudioRecorder.audioChunks.push(event.data);
      }
      
      // If we are actively slicing, resolve it now that data is flushed
      if (AudioRecorder.resolveSlice) {
          const chunks = [...AudioRecorder.audioChunks];
          AudioRecorder.audioChunks = []; // clear
          const mimeType = AudioRecorder.mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(chunks, { type: mimeType });
          
          if (audioBlob.size > 0) {
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    if (AudioRecorder.resolveSlice) AudioRecorder.resolveSlice(reader.result.split(',')[1]);
                    AudioRecorder.resolveSlice = null;
                    AudioRecorder.isSlicing = false;
                };
          } else {
                if (AudioRecorder.resolveSlice) AudioRecorder.resolveSlice(null);
                AudioRecorder.resolveSlice = null;
                AudioRecorder.isSlicing = false;
          }
      }
    });

    AudioRecorder.mediaRecorder.start();

    // Set up Audio Context for Amplitude Analysis
    if (onAmplitude) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        await audioCtx.resume(); 
        AudioRecorder.audioContext = audioCtx;
        
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256; // Larger FFT for better resolution
        analyser.smoothingTimeConstant = 0.5;
        
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        AudioRecorder.source = source; // 🔴 CRITICAL: Keep reference to prevent Garbage Collection
        AudioRecorder.analyser = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let lastUpdate = 0;
        
        // VAD State
        let silenceStartTime = null;
        let isCurrentlySpeaking = false;
        
        console.log(`🎤 AudioCtx: ${audioCtx.state}, Stream Active: ${stream.active}, Tracks: ${stream.getAudioTracks().length}`);

        const checkAmplitude = (timestamp) => {
             if (!AudioRecorder.mediaRecorder || AudioRecorder.mediaRecorder.state === 'inactive' || AudioRecorder.isSlicing) return;
             
             if (timestamp - lastUpdate > 100) { // Throttle to ~10fps
                 analyser.getByteFrequencyData(dataArray);
                 
                 let sum = 0;
                 for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
                 const avg = sum / dataArray.length;
                 
                 const normalized = Math.min(1, (avg / 255) * 2.5);
                 if (onAmplitude) onAmplitude(normalized);
                 
                 // --- Voice Activity Detection (VAD) ---
                 if (normalized > silenceThreshold) {
                     // User is speaking
                     silenceStartTime = null; // Reset silence timer
                     if (!isCurrentlySpeaking) {
                         isCurrentlySpeaking = true;
                         if (onVoiceStart) onVoiceStart();
                     }
                 } else {
                     // Silence detected
                     if (isCurrentlySpeaking) {
                         if (!silenceStartTime) {
                             silenceStartTime = timestamp;
                         } else if (timestamp - silenceStartTime >= silenceDuration) {
                             // Silence has been sustained long enough
                             isCurrentlySpeaking = false;
                             silenceStartTime = null;
                             if (onSilence) onSilence();
                         }
                     }
                 }
                 
                 lastUpdate = timestamp;
             }
             
             AudioRecorder.exemplarAnimationId = requestAnimationFrame(checkAmplitude);
        };
        requestAnimationFrame(checkAmplitude);
    }
  },

  stop: () => {
    return new Promise((resolve, reject) => {
      if (!AudioRecorder.mediaRecorder) return resolve(null);

      // Stop amplitude animation
      if (AudioRecorder.exemplarAnimationId) {
          cancelAnimationFrame(AudioRecorder.exemplarAnimationId);
      }
      
      // Close Audio Context
      if (AudioRecorder.audioContext) {
          AudioRecorder.audioContext.close();
          AudioRecorder.audioContext = null;
      }

      const mimeType = AudioRecorder.mediaRecorder.mimeType || 'audio/webm';

      AudioRecorder.mediaRecorder.addEventListener("stop", () => {
        console.log(`🎤 Stopped. Total chunks: ${AudioRecorder.audioChunks.length}`);
        const audioBlob = new Blob(AudioRecorder.audioChunks, { type: mimeType });
        console.log(`🎤 Final Blob size: ${audioBlob.size} bytes, Type: ${mimeType}`);
        
        // Stop all tracks
        if (AudioRecorder.stream) {
            AudioRecorder.stream.getTracks().forEach(track => track.stop());
            AudioRecorder.stream = null;
        }

        if (audioBlob.size === 0) {
            console.warn("🎤 Empty audio blob!");
            resolve(null);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result.split(',')[1];
          resolve(base64Audio);
        };
      });

      AudioRecorder.mediaRecorder.stop();
    });
  },
  
  // Requests the current chunk from the media recorder without stopping it
  sliceBuffer: () => {
      return new Promise((resolve) => {
          if (!AudioRecorder.mediaRecorder || AudioRecorder.mediaRecorder.state !== 'recording') {
              return resolve(null);
          }
          
          AudioRecorder.isSlicing = true; // Pause VAD processing
          AudioRecorder.resolveSlice = resolve;
          
          // Request data flush which reliably triggers "dataavailable"
          AudioRecorder.mediaRecorder.requestData();
      });
  },

  setMute: (mute) => {
      if (AudioRecorder.stream) {
          AudioRecorder.stream.getAudioTracks().forEach(track => {
              track.enabled = !mute;
          });
      }
  }
};
