import React, { useState, useEffect, useRef } from 'react';
import RobotAvatar from '../../components/Assistant/RobotAvatar';
import VoiceWidget from '../../components/Assistant/VoiceWidget';
import { Send, Mic, User, Bot, Loader2, StopCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AudioRecorder } from '../../utils/audioRecorder';

const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: `Hello ${user?.name || "Student"}! I'm your AI Exam Mentor. How can I help you study today?`, emotion: 'happy' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  
  const chatEndRef = useRef(null);
  const audioContextRefr = useRef(null);
  const currentAudioSource = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load History
  useEffect(() => {
    if(user?._id) {
        api.assistantHistory(user._id)
           .then(history => {
               if(history && history.length > 0) {
                   // Map backend history format to frontend
                   const mapped = history.map((msg, i) => ({
                       id: msg._id || i,
                       role: msg.role,
                       text: msg.content
                   }));
                   // Keep initial greeting if history is empty, else replace
                   setMessages(mapped);
               }
           })
           .catch(err => console.error(err));
    }
  }, [user]);

  const playResponseAudio = async (base64Audio) => {
      if (!base64Audio) return;

      try {
          // Initialize Audio Context if needed
          if (!audioContextRefr.current) {
              audioContextRefr.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          
          const audioCtx = audioContextRefr.current;
          
          // Decode
          const binaryString = window.atob(base64Audio);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
          }
          
          const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);
          
          // Play
          if (currentAudioSource.current) {
              currentAudioSource.current.stop();
          }
          
          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          
          // Analyser for Lip Sync
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 32;
          source.connect(analyser);
          analyser.connect(audioCtx.destination);
          
          currentAudioSource.current = source;
          
          source.start(0);
          setIsSpeaking(true);
          
          // Animation Loop
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAmplitude = () => {
              if(!isSpeaking) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for(let i=0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length; // 0-255
              setAudioAmplitude(avg / 255); // 0-1
              
              if(isSpeaking) requestAnimationFrame(updateAmplitude);
          };
          updateAmplitude();
          
          source.onended = () => {
              setIsSpeaking(false);
              setAudioAmplitude(0);
              setCurrentEmotion('neutral');
          };
          
      } catch (err) {
          console.error("Audio Playback Error:", err);
          setIsSpeaking(false);
      }
  };

  const processResponse = async (text, audioBase64 = null) => {
    // Optimistic User UI update handled in handleSend
    
    setLoading(true);
    setCurrentEmotion('thinking');

    try {
        const response = await api.assistantChat(user?._id || "anon", text, audioBase64);
        
        // Add Assistant Message
        const aiMsg = {
            id: Date.now(),
            role: 'assistant',
            text: response.text,
            emotion: response.emotion
        };
        setMessages(prev => [...prev, aiMsg]);
        setCurrentEmotion(response.emotion);
        
        // Execute Commands (Placeholder for now)
        if (response.command) {
            console.log("EXECUTE COMMAND:", response.command);
            // Example: if(response.command.action === 'start_test') navigate('/tests');
        }

        // Play Audio
        if (response.audio) {
            playResponseAudio(response.audio);
        } else {
             setTimeout(() => setCurrentEmotion('neutral'), 3000);
        }

    } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', text: "Sorry, I had trouble processing that.", emotion: 'sad' }]);
        setCurrentEmotion('sad');
    } finally {
        setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: text }]);
    setInput('');
    
    await processResponse(text, null);
  };

  const handleVoiceStart = async () => {
      try {
          await AudioRecorder.start();
          setIsListening(true);
      } catch (err) {
          alert("Could not access microphone");
          console.error(err);
      }
  };
  
  const handleVoiceEnd = async () => {
      setIsListening(false);
      setLoading(true);
      setCurrentEmotion('thinking');
      try {
          const audioBase64 = await AudioRecorder.stop();
          // Send to backend
          await processResponse(null, audioBase64);
      } catch (err) {
          console.error(err);
          setLoading(false);
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900">
      
      {/* Header / Avatar Area */}
      <div className="flex-none h-64 bg-indigo-50 dark:bg-slate-800 flex flex-col items-center justify-center border-b border-indigo-100 dark:border-slate-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,transparent)] dark:bg-grid-slate-700/25"></div>
        <div className="z-10 w-full max-w-md">
           <RobotAvatar 
              emotion={currentEmotion} 
              speaking={isSpeaking} 
              amplitude={audioAmplitude} 
           />
        </div>
        <div className="z-10 text-center mt-2">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Exam Mentor AI</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                {isListening ? "Listening..." : isSpeaking ? "Speaking..." : loading ? "Thinking..." : "Online"}
            </p>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-end max-w-[80%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>
              
              <div className={`p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Loader2 size={16} className="text-white animate-spin" />
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-400">Thinking...</span>
                </div>
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-none p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-0 transition-all"
            disabled={loading || isListening}
          />
          <button
            onClick={isListening ? handleVoiceEnd : handleVoiceStart}
            className={`p-3 rounded-xl transition-colors ${
              isListening 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      
      {/* Floating Voice Widget */}
      {/* Voice Widget now global in Layout */}
      {/* <VoiceWidget ... /> removed to prevent duplication */}

    </div>
  );
};

export default ChatPage;
