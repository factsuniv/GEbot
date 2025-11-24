import React, { useEffect, useRef } from 'react';
import { useLiveSession } from '../hooks/useLiveSession';
import { AdminConfig } from '../types';
import { Visualizer } from './Visualizer';

interface ChatInterfaceProps {
  config: AdminConfig;
  onAdminClick: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ config, onAdminClick }) => {
  const { 
    connect, 
    disconnect, 
    isConnected, 
    isSpeaking, 
    volume, 
    transcripts, 
    error 
  } = useLiveSession(config);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white selection:bg-indigo-500/30">
      
      {/* Background Visualizer (Full Screen) */}
      <Visualizer volume={volume} isActive={isConnected} isSpeaking={isSpeaking} />

      {/* Foreground UI Layer */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 pointer-events-none">
        
        {/* Top Navigation / Dynamic Island Area */}
        <div className="flex justify-center pt-2 pointer-events-auto animate-fade-in-up">
            <div className="glass px-5 py-2.5 rounded-full flex items-center gap-4 shadow-2xl shadow-black/50 transition-all hover:bg-white/10">
                <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${isConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-zinc-500'}`} />
                <span className="text-sm font-medium tracking-wide text-zinc-200">Gemini Live</span>
                <div className="w-px h-3 bg-white/10" />
                <button 
                    onClick={onAdminClick} 
                    className="text-zinc-400 hover:text-white transition-colors p-1 -m-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </button>
            </div>
        </div>

        {/* Middle Area - Error Toasts */}
        <div className="flex-1 flex flex-col items-center justify-center pointer-events-none">
            {error && (
                <div className="glass bg-red-500/10 border-red-500/20 px-5 py-3 rounded-2xl max-w-xs text-center animate-fade-in-up backdrop-blur-md">
                    <p className="text-red-200 text-sm font-medium">{error}</p>
                </div>
            )}
            
            {!isConnected && !error && (
                <div className="text-center space-y-2 opacity-0 animate-[fade-in-up_1s_ease-out_1s_forwards]">
                   <p className="text-zinc-500 text-sm font-medium tracking-wide">Tap below to start</p>
                </div>
            )}
        </div>

        {/* Bottom Area - Transcript & Controls */}
        <div className="flex flex-col gap-8 items-center pointer-events-auto w-full max-w-lg mx-auto pb-10">
            
            {/* Transcript Overlay (Fading Stream) */}
            <div 
                ref={scrollRef}
                className="w-full max-h-[25vh] overflow-y-auto no-scrollbar flex flex-col gap-3 mask-gradient-to-t px-4"
            >
                {transcripts.length > 0 ? (
                    transcripts.map((item, idx) => (
                        <div 
                            key={idx} 
                            className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}
                        >
                            <div className={`max-w-[85%] px-5 py-2.5 text-[15px] leading-relaxed backdrop-blur-md rounded-2xl shadow-sm ${
                                item.sender === 'user' 
                                    ? 'bg-white/10 text-white' 
                                    : 'bg-zinc-900/40 text-zinc-100 border border-white/5'
                            }`}>
                                {item.text}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-4" /> // Spacer
                )}
            </div>

            {/* Main Action Button */}
            <div className="flex items-center justify-center">
                <button
                    onClick={isConnected ? disconnect : connect}
                    className={`
                        group relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                        ${isConnected 
                            ? 'bg-red-500/10 hover:bg-red-500/20 active:scale-90' 
                            : 'bg-white hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)]'}
                    `}
                >
                    {/* Ripple/Glow effect */}
                    <div className={`
                        absolute inset-0 rounded-full opacity-0 transition-opacity duration-500
                        ${isConnected ? 'animate-ping opacity-20 bg-red-500' : ''}
                    `} />
                    
                    {isConnected ? (
                        <div className="w-8 h-8 rounded-lg bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-300 group-hover:scale-90" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black ml-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};