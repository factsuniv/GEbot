import React, { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { AdminPanel } from './components/AdminPanel';
import { AdminConfig, VoiceName } from './types';

// Default configuration
const DEFAULT_CONFIG: AdminConfig = {
  systemInstruction: "You are a friendly and knowledgeable AI assistant. Keep your responses concise and conversational. You are helpful and polite.",
  voiceName: VoiceName.Zephyr
};

const App: React.FC = () => {
  const [view, setView] = useState<'chat' | 'admin'>('chat');
  const [config, setConfig] = useState<AdminConfig>(DEFAULT_CONFIG);

  // Load config from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('gemini_voice_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
  }, []);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('gemini_voice_config', JSON.stringify(config));
  }, [config]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">
      {view === 'chat' ? (
        <ChatInterface 
          config={config} 
          onAdminClick={() => setView('admin')} 
        />
      ) : (
        <AdminPanel 
          config={config} 
          setConfig={setConfig} 
          onBack={() => setView('chat')} 
        />
      )}
    </div>
  );
};

export default App;
