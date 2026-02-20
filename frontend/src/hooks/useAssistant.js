import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { AudioRecorder } from '../utils/audioRecorder';
import { useAuth } from '../context/AuthContext';

export const useAssistant = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentEmotion, setCurrentEmotion] = useState('neutral');
    const [audioAmplitude, setAudioAmplitude] = useState(0);
    const [userAudioAmplitude, setUserAudioAmplitude] = useState(0);
    const [devices, setDevices] = useState({ mics: [], speakers: [] });
    const [selectedMicId, setSelectedMicId] = useState('');
    const [selectedSpeakerId, setSelectedSpeakerId] = useState('');

    const audioContextRefr = useRef(null);
    const currentAudioSource = useRef(null);

    useEffect(() => {
        // Load devices on mount
        AudioRecorder.getDevices().then(devs => {
            setDevices(devs);
            if(devs.mics.length > 0) setSelectedMicId('default'); // Default to system default
            if(devs.speakers.length > 0) setSelectedSpeakerId('default');
        });
        
        // Handle device changes (plug/unplug)
        navigator.mediaDevices?.addEventListener('devicechange', () => {
             AudioRecorder.getDevices().then(setDevices);
        });
    }, []);

    const audioQueueRef = useRef([]);
    const isPlayingRef = useRef(false);

    // Function to play the next buffer in the queue
    const playNextBuffer = async () => {
        if (audioQueueRef.current.length === 0) {
            isPlayingRef.current = false;
            if (streamCompleteRef.current) {
                setIsSpeaking(false);
                setCurrentEmotion('neutral');
            }
            return;
        }

        isPlayingRef.current = true;
        const audioBuffer = audioQueueRef.current.shift();

        try {
            if (!audioContextRefr.current) {
                audioContextRefr.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const audioCtx = audioContextRefr.current;
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;

            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 32;
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            
            if (audioCtx.setSinkId && selectedSpeakerId) {
                try { await audioCtx.setSinkId(selectedSpeakerId); } catch(e) {}
            }

            currentAudioSource.current = source;
            source.start(0);
            setIsSpeaking(true);

            // Visualization check
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            let lastUpdate = 0;
            const updateAmplitude = (timestamp) => {
                if (!isPlayingRef.current) return;
                
                if (timestamp - lastUpdate > 100) {
                    analyser.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                    const avg = sum / dataArray.length;
                    setAudioAmplitude(avg / 255);
                    lastUpdate = timestamp;
                }
                
                requestAnimationFrame(updateAmplitude);
            };
            requestAnimationFrame(updateAmplitude);

            source.onended = () => {
                playNextBuffer(); // Immediately play next
            };

        } catch (err) {
            console.error("Audio Playback Error:", err);
            isPlayingRef.current = false;
            playNextBuffer();
        }
    };

    const playResponseAudio = async (base64Audio) => {
        try {
            if (!audioContextRefr.current) {
                audioContextRefr.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const audioCtx = audioContextRefr.current;
            
            // Decode immediately
            const binaryString = window.atob(base64Audio);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);
            
            // Add decoded buffer to queue
            audioQueueRef.current.push(audioBuffer);
            
            // If not currently playing, start
            if (!isPlayingRef.current) {
                playNextBuffer();
            }
        } catch (err) {
            console.error("Error decoding audio chunk:", err);
        }
    };

    // Stop everything when not speaking/reset
    useEffect(() => {
        if (!isSpeaking && audioQueueRef.current.length === 0) {
            setAudioAmplitude(0);
            setCurrentEmotion('neutral');
        }
    }, [isSpeaking]);

    const streamCompleteRef = useRef(false);

    const processResponse = async (text, audioBase64 = null) => {
        setLoading(true);
        setCurrentEmotion('thinking');
        streamCompleteRef.current = false;
        
        // Add placeholder message for Assistant
        const assistantMsgId = Date.now();
        setMessages(prev => [...prev, { 
            id: assistantMsgId, 
            role: 'assistant', 
            text: "", // Start empty
            emotion: 'thinking' 
        }]);

        try {
            console.log("🚀 [Frontend] Sending Chat Request...");
            const response = await fetch(`${api.API_PYTHON_URL}/assistant/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user?._id || "anon",
                    message: text,
                    audio_base64: audioBase64
                })
            });

            if (!response.ok) throw new Error("Stream Request Failed");

            console.log("📡 [Frontend] Stream Connected. waiting for tokens...");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let aiText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log("✅ [Frontend] Stream Completed.");
                    streamCompleteRef.current = true;
                    // Double check if audio is already done
                     if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
                        setIsSpeaking(false);
                        setCurrentEmotion('neutral');
                    }
                    break;
                }
                
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                
                const lines = buffer.split("\n");
                // Keep the last partial line in the buffer
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.trim() === "") continue;
                    try {
                        const event = JSON.parse(line);
                        
                        if (event.type === "token") {
                            if (aiText === "") console.log("⚡ [Frontend] First Token Received");
                            aiText += event.text;
                            setMessages(prev => prev.map(msg => 
                                msg.id === assistantMsgId ? { ...msg, text: aiText } : msg
                            ));
                            setLoading(false); // First token received -> stop loading
                            setIsSpeaking(true); // Start "speaking" animation slightly early
                        } else if (event.type === "transcription") {
                            console.log("📝 [Frontend] STT Transcription:", event.text);
                        } else if (event.type === "meta") {
                            console.log("ℹ️ [Frontend] Meta Update:", event.emotion, event.command);
                            setCurrentEmotion(event.emotion);
                            if (event.command) console.log("EXECUTE:", event.command);
                            setMessages(prev => prev.map(msg => 
                                msg.id === assistantMsgId ? { ...msg, emotion: event.emotion } : msg
                            ));
                        } else if (event.type === "audio") {
                            console.log("🔊 [Frontend] Audio Chunk Received.");
                            // Play audio when fully received
                            playResponseAudio(event.data);
                        } else if (event.type === "error") {
                            console.error("❌ [Frontend] Stream Error Event:", event.text);
                            setMessages(prev => prev.map(msg => 
                                msg.id === assistantMsgId ? { ...msg, text: "Error processing request." } : msg
                            ));
                        }
                    } catch (err) {
                        console.error("⚠️ [Frontend] JSON Parse Error on line:", line, err);
                    }
                }
            }

        } catch (err) {
            console.error("❌ [Frontend] Request Failed:", err);
            setMessages(prev => [...prev.filter(m => m.id !== assistantMsgId), { id: Date.now(), role: 'assistant', text: "Sorry, connection failed.", emotion: 'sad' }]);
            setCurrentEmotion('sad');
        } finally {
            setLoading(false);
            // Don't stop "speaking" immediately, audio might still play
        }
    };

    const startTimeRef = useRef(0);

    const [isSystemMuted, setIsSystemMuted] = useState(false);

    const startRecording = async () => {
        try {
            setIsSystemMuted(false);
            await AudioRecorder.start(selectedMicId, (amplitude) => {
                setUserAudioAmplitude(amplitude);
            }, (muted) => {
                setIsSystemMuted(muted);
            });
            startTimeRef.current = Date.now();
            setIsListening(true);
        } catch (err) {
            alert("Could not access microphone");
            console.error(err);
        }
    };

    const stopRecording = async () => {
        const duration = Date.now() - startTimeRef.current;
        const MIN_DURATION = 1000; // 1 second
        
        if (duration < MIN_DURATION) {
            const waitTime = MIN_DURATION - duration;
            console.log(`🎤 Audio too short (${duration}ms), waiting ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        setIsListening(false);
        setUserAudioAmplitude(0); // Reset amplitude
        setLoading(true);
        setCurrentEmotion('thinking');
        try {
            const audioBase64 = await AudioRecorder.stop();
            await processResponse(null, audioBase64);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };
    
    const sendText = async (text) => {
        if(!text.trim()) return;
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', text }]);
        await processResponse(text, null);
    };

    const [isMuted, setIsMuted] = useState(false);

    const toggleMute = () => {
        setIsMuted(prev => {
           const newState = !prev;
           AudioRecorder.setMute(newState);
           return newState;
        });
    };

    return {
        messages,
        loading,
        isListening,
        isMuted,            // Export
        isSystemMuted,      // Export
        toggleMute,         // Export
        isSpeaking,
        currentEmotion,
        audioAmplitude,
        userAudioAmplitude, // Export this
        devices,            // Export this
        selectedMicId,      // Export this
        setSelectedMicId,   // Export this
        selectedSpeakerId,  // Export this
        setSelectedSpeakerId, // Export this
        startRecording,
        stopRecording,
        sendText
    };
};
