
export const AudioRecorder = {
  mediaRecorder: null,
  audioChunks: [],
  stream: null,
  audioContext: null,
  analyser: null,
  exemplarAnimationId: null,

  getDevices: async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
       return { mics: [], speakers: [] };
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter(d => d.kind === 'audioinput');
    const speakers = devices.filter(d => d.kind === 'audiooutput');
    return { mics, speakers };
  },

  start: async (deviceId = null, onAmplitude = null, onMuteChange = null) => {
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
        let debugCounter = 0;
        
        console.log(`🎤 AudioCtx: ${audioCtx.state}, Stream Active: ${stream.active}, Tracks: ${stream.getAudioTracks().length}`);

        let lastUpdate = 0;
        const checkAmplitude = (timestamp) => {
             if (!AudioRecorder.mediaRecorder || AudioRecorder.mediaRecorder.state === 'inactive') return;
             
             if (timestamp - lastUpdate > 100) { // Throttle to ~10fps
                 analyser.getByteFrequencyData(dataArray);
                 
                 let sum = 0;
                 for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
                 const avg = sum / dataArray.length;
                 
                 const normalized = Math.min(1, (avg / 255) * 2.5);
                 onAmplitude(normalized);
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

  setMute: (mute) => {
      if (AudioRecorder.stream) {
          AudioRecorder.stream.getAudioTracks().forEach(track => {
              track.enabled = !mute;
          });
      }
  }
};
