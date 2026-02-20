import React, { useState, useEffect, useRef } from 'react';
import RobotAvatar from '../../components/Assistant/RobotAvatar';
import { Send, Mic, User, Bot, Loader2, StopCircle, Plus, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AudioRecorder } from '../../utils/audioRecorder';
import { useAssistant } from '../../hooks/useAssistant';

const ChatPage = () => {
  const { user } = useAuth();
  const {
      messages,
      loading,
      isListening,
      isSpeaking,
      currentEmotion,
      audioAmplitude,
      startRecording,
      stopRecording,
      sendText
  } = useAssistant();
  
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState('');
  
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
                   const mapped = history.map((msg, i) => ({
                       id: msg._id || i,
                       role: msg.role,
                       text: msg.content
                   }));
                   setChatHistory(mapped);
               } else {
                   setChatHistory([]); // strictly no mock data
               }
           })
           .catch(err => {
               console.error(err);
               setChatHistory([]);
           });
    }
  }, [user]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendText(text);
    // Optimistically update history sidebar
    setChatHistory(prev => [{ role: 'user', text: text }, ...prev]);
  };

  return (
    // Replaced absolute offset with w-full h-full to cleanly fill Layout content area without borders
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 overflow-hidden">
        
        {/* Inner Sidebar: Chat History */}
        <div className="hidden lg:flex w-[320px] bg-white rounded-2xl flex-col overflow-hidden shadow-sm border border-gray-200">
            <div className="p-5">
                <button 
                  onClick={() => {/* Only aesthetic clear for hackathon */ window.location.reload() }}
                  className="w-full bg-[#4F46E5] hover:bg-indigo-700 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200/50"
                >
                    <Plus size={18} />
                    New Conversation
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-1 py-2 space-y-4">
                <div>
                     <span className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Recent Activity</span>
                     <div className="mt-3 space-y-1">
                         {chatHistory.filter(m => m.role === 'user').slice(-8).reverse().map((msg, idx) => (
                             <button 
                                key={idx} 
                                onClick={() => {/* Optional: load specific history context */}}
                                className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-50 flex items-start gap-3 transition-colors group"
                             >
                                 <MessageSquare size={16} className="text-gray-300 shrink-0 mt-0.5 group-hover:text-indigo-400 transition-colors" />
                                 <p className="text-[13px] text-gray-500 truncate font-medium group-hover:text-indigo-600 transition-colors">{msg.text}</p>
                             </button>
                         ))}
                         {chatHistory.filter(m => m.role === 'user').length === 0 && (
                             <p className="text-xs text-gray-400 text-center py-4">No recent chats</p>
                         )}
                     </div>
                </div>
            </div>
            
            {/* Luna Status inside sidebar bottom */}
            <div className="p-4 mt-auto bg-white border-t border-gray-100">
                <div className="flex items-center gap-3">
                     {/* Properly scaled down minimal avatar container */}
                     <div className="w-10 h-10 rounded-xl border border-indigo-100/50 flex items-center justify-center overflow-hidden shrink-0 relative shadow-sm blur-[0.3px]">
                         {/* Scale down and center correctly against its own anchor block */}
                         <div className="absolute inset-[-10px] flex items-center justify-center scale-50">
                            <RobotAvatar 
                                emotion={currentEmotion} 
                                speaking={isSpeaking} 
                                amplitude={audioAmplitude} 
                            />
                         </div>
                     </div>
                     <div>
                         <p className="text-[14px] font-bold text-gray-800">Luna AI</p>
                         <p className="text-[12px] text-emerald-500 font-bold flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online & Listening</p>
                     </div>
                </div>
            </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 bg-white rounded-2xl flex flex-col overflow-hidden shadow-sm border border-gray-200">

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#FAFAFA]">
              {messages.length === 0 && (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center opacity-70">
                      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 border border-indigo-100 shadow-sm">
                          <Bot size={32} className="text-indigo-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-600">Start a conversation with Luna</p>
                      <p className="text-sm text-gray-400 max-w-sm mt-2">She's your personal Exam Mentor ready to help you prepare.</p>
                  </div>
              )}
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
                >
                  <div className={`flex items-end max-w-[70%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Tiny Avatar Base */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-white ${msg.role === 'user' ? 'bg-[#2563EB]' : 'bg-[#8B5CF6] z-10'}`}>
                      {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                    </div>
                    
                    {/* Message Bubble - Styled accurately like screenshot */}
                    <div className={`px-6 py-4 rounded-2xl shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#2563EB] text-white rounded-br-sm' 
                        : 'bg-white text-gray-700 border border-gray-100 rounded-bl-sm font-medium'
                    }`}>
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start w-full">
                   <div className="flex items-end max-w-[70%] gap-3 flex-row">
                      <div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center shadow-sm border-2 border-white z-10">
                          <Loader2 size={14} className="text-white animate-spin" />
                      </div>
                      <div className="bg-white px-6 py-4 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
                          <span className="text-sm font-medium text-gray-400 flex items-center gap-2">Generating response<span className="animate-pulse">...</span></span>
                      </div>
                   </div>
                </div>
              )}
              <div ref={chatEndRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="flex-none p-4 md:px-8 md:py-5 border-t border-gray-100 bg-white">
              <div className="max-w-4xl mx-auto flex gap-3 h-14 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Luna a question..."
                  className="flex-1 h-full px-5 rounded-2xl bg-gray-50 border border-gray-100 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-gray-700 placeholder-gray-400 outline-none"
                  disabled={loading || isListening}
                />
                <button
                  onClick={() => isListening ? stopRecording() : startRecording(false)}
                  className={`h-full aspect-square rounded-2xl transition-all flex items-center justify-center ${
                    isListening 
                    ? 'bg-red-500 text-white shadow-md shadow-red-200 animate-pulse' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  }`}
                >
                  {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="h-full aspect-square bg-[#8B5CF6] hover:bg-purple-600 disabled:opacity-50 disabled:hover:bg-[#8B5CF6] text-white rounded-2xl transition-all shadow-md shadow-purple-200 flex items-center justify-center"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
            
        </div>
    </div>
  );
};

export default ChatPage;
