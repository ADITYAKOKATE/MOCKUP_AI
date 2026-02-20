import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, MessageSquare, ToggleLeft, ToggleRight, Radio, Settings } from 'lucide-react';
import ExpressiveAvatar from './ExpressiveAvatar';
import { useAssistant } from '../../hooks/useAssistant';

const VoiceWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('live'); // 'live' | 'push'
  const [showSettings, setShowSettings] = useState(false);

  const { 
      isListening, 
      isSpeaking, 
      isMuted,
      isSystemMuted,
      toggleMute,
      currentEmotion, 
      audioAmplitude, 
      userAudioAmplitude,
      loading,
      startRecording, 
      stopRecording,
      devices,
      selectedMicId,
      setSelectedMicId,
      selectedSpeakerId,
      setSelectedSpeakerId
  } = useAssistant();

  // Auto-open if robot starts speaking or listening
  useEffect(() => {
      if (isListening || isSpeaking) setIsOpen(true);
  }, [isListening, isSpeaking]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Avatar Container (Expanded) */}
      {isOpen && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-80 transition-all animate-in slide-in-from-bottom-5 mb-2">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-2 border-b border-slate-100 dark:border-slate-700 pb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              AI Tutor
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${mode === 'live' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {mode === 'live' ? 'Live Mode' : 'Push to Talk'}
              </span>
            </span>
            <div className="flex gap-1">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 ${showSettings ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                >
                  <Settings size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={16} />
                </button>
            </div>
          </div>
          
          {showSettings ? (
            <div className="h-48 flex flex-col gap-3 p-2 overflow-y-auto mb-3 text-xs">
                <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Microphone</label>
                    <select 
                        value={selectedMicId} 
                        onChange={(e) => setSelectedMicId(e.target.value)}
                        className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600"
                    >
                        {devices.mics.map(d => (
                            <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0,5)}`}</option>
                        ))}
                        <option value="default">Default Microphone</option>
                    </select>
                </div>
                <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Speaker</label>
                    <select 
                        value={selectedSpeakerId} 
                        onChange={(e) => setSelectedSpeakerId(e.target.value)}
                        className="w-full p-2 rounded border dark:bg-slate-700 dark:border-slate-600"
                    >
                        {devices.speakers.map(d => (
                            <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${d.deviceId.slice(0,5)}`}</option>
                        ))}
                         {devices.speakers.length === 0 && <option>Default Output</option>}
                    </select>
                </div>
                <div className="text-slate-400 italic mt-2">
                    Check browser permissions if devices are missing.
                </div>
            </div>
          ) : (
             /* Avatar Area */
            <div className="h-48 flex items-center justify-center bg-indigo-50 dark:bg-slate-900 rounded-xl mb-3 relative overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,transparent)]"></div>
                
                {/* User Audio Visualizer (Overlay when listening) */}
                {isListening && (
                    <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none">
                        <div 
                            className="bg-indigo-500 rounded-full blur-xl transition-all duration-75"
                            style={{ 
                                width: `${Math.max(50, userAudioAmplitude * 400)}px`, 
                                height: `${Math.max(50, userAudioAmplitude * 400)}px` 
                            }}
                        ></div>
                    </div>
                )}

                <div className="w-40 h-40 z-10 transition-transform duration-300" style={{ transform: isListening ? 'scale(0.8) translateY(-10px)' : 'scale(1)' }}>
                    <ExpressiveAvatar 
                        emotion={currentEmotion} 
                        speaking={isSpeaking} 
                        amplitude={audioAmplitude} 
                    />
                </div>
                
                {/* Status Badge */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full shadow-sm text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    {isListening && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
                    {isListening ? "Listening..." : isSpeaking ? "Speaking..." : loading ? "Thinking..." : "Idle"}
                </div>
            </div>
          )}
          
          {/* System Mute Warning */}
          {isSystemMuted && (
              <div className="absolute top-10 left-4 right-4 bg-red-100 border border-red-200 text-red-700 p-2 rounded-lg text-xs z-50 shadow-md">
                 <strong>Microphone Muted by System</strong><br/>
                 Use your keyboard shortcut or OS settings to unmute.
              </div>
          )}

          {/* Waveform Visualizer */}
          {showSettings === false && (
              <div className="h-12 flex items-end justify-center gap-1 mb-2 px-4 opacity-80">
                  {isListening ? (
                    Array.from({ length: 20 }).map((_, i) => {
                        // Create a symmetric wave effect from the center
                        const center = 10;
                        const dist = Math.abs(i - center);
                        const baseHeight = Math.max(20, 100 - (dist * 8)); // Taller in center
                        // Modulate with amplitude and some randomness
                        const dynamicHeight = Math.min(100, Math.max(15, userAudioAmplitude * 200 * (1.2 - dist/15) + Math.random() * 20));
                        
                        return (
                          <div 
                              key={i}
                              className="w-1.5 bg-indigo-500 rounded-full transition-all duration-75"
                              style={{ 
                                  height: `${dynamicHeight}%`,
                                  opacity: 0.5 + (userAudioAmplitude * 0.5)
                              }}
                          ></div>
                        );
                    })
                  ) : (
                      // Idle Line
                      <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                          <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-800 px-2">Ready to speak</span>
                      </div>
                  )}
              </div>
          )}
          
          {/* Mode Toggle */}
          {!showSettings && (
          <div className="flex justify-center mb-4">
              <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-lg flex text-xs font-medium">
                  <button 
                    onClick={() => setMode('live')}
                    className={`px-3 py-1.5 rounded-md transition-all ${mode === 'live' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      Live Mode
                  </button>
                  <button 
                    onClick={() => setMode('push')}
                    className={`px-3 py-1.5 rounded-md transition-all ${mode === 'push' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      Push to Talk
                  </button>
              </div>
          </div>
          )}
          
          {/* Controls */}
          {!showSettings && (
          <div className="flex gap-2">
            {mode === 'live' ? (
                // Live Mode: Toggle Button
                <>
                    <button
                    onClick={startRecording}
                    disabled={isListening || loading}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-sm ${
                        isListening 
                        ? 'hidden' // Hide start button when listening
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                    }`}
                    >
                    <Mic size={18} />
                    Start Listening
                    </button>
                    
                    {isListening && (
                        <>
                            <button
                                onClick={toggleMute}
                                className={`flex-1 py-3 px-4 rounded-xl text-white shadow-sm flex items-center justify-center gap-2 font-bold transition-all ${
                                    isMuted 
                                    ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' 
                                    : 'bg-slate-500 hover:bg-slate-600 shadow-slate-200'
                                }`}
                            >
                                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                                {isMuted ? "Unmute" : "Mute"}
                            </button>

                            <button
                                onClick={stopRecording}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white hover:bg-red-600 shadow-red-200 animate-pulse flex items-center justify-center gap-2 font-bold"
                            >
                                <MicOff size={18} />
                                Stop
                            </button>
                        </>
                    )}
                </>
            ) : (
                // Push to Talk Mode: Hold Button
                <button
                    onPointerDown={(e) => {
                        if (e.button !== 0 && e.pointerType === 'mouse') return; // Only left click for mouse
                        if (!isListening && !loading) startRecording();
                    }}
                    onPointerUp={(e) => {
                        if (isListening) stopRecording();
                    }}
                    onPointerLeave={(e) => {
                        if (isListening) stopRecording();
                    }}
                    disabled={loading}
                    style={{ touchAction: 'none' }} // Critical for preventing scroll & enabling strict touch handling
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-sm select-none active:scale-95 ${
                        isListening 
                        ? 'bg-red-500 text-white border-red-600 shadow-inner scale-95' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                    }`}
                >
                    <Radio size={18} className={isListening ? "animate-pulse" : ""} />
                    {isListening ? 'Listening...' : 'Hold to Speak'}
                </button>
            )}
          </div>
          )}
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center group"
        >
          <MessageSquare size={24} className="group-hover:hidden" />
          <div className="hidden group-hover:block text-xs font-bold">CHAT</div> 
        </button>
      )}
    </div>
  );
};

export default VoiceWidget;
