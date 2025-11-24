import React, { useState } from 'react';
import { AdminConfig, VoiceName } from '../types';

interface AdminPanelProps {
  config: AdminConfig;
  setConfig: (config: AdminConfig) => void;
  onBack: () => void;
}

const TEMPLATES = [
    {
        name: "Helpful Assistant",
        prompt: "You are a friendly and knowledgeable AI assistant. Keep your responses concise and conversational. You are helpful and polite."
    },
    {
        name: "Medical Roleplay (Doctor)",
        prompt: "You are playing the role of a compassionate doctor conducting a patient interview. Use medical terminology correctly but explain things simply. Ask clarifying questions about symptoms. Be professional, empathetic, and strictly adhere to medical ethics. Do not diagnose real conditions, always advise seeing a real professional."
    },
    {
        name: "Customer Support",
        prompt: "You are a customer support agent for 'TechFlow'. You are patient, apologetic when things go wrong, and focused on solving technical issues efficiently."
    }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ config, setConfig, onBack }) => {
  const [estUsers, setEstUsers] = useState(1000);
  const [estMins, setEstMins] = useState(30);

  const handleChange = (field: keyof AdminConfig, value: string) => {
    setConfig({ ...config, [field]: value });
  };

  // Cost calculation constants
  const HUME_RATE = 0.108; // ~$0.108/min
  const GOOGLE_FLASH_RATE = 0.03; // ~$0.03/min (blended input/output est)

  const totalMinutes = estUsers * estMins;
  const humeCost = totalMinutes * HUME_RATE;
  const googleCost = totalMinutes * GOOGLE_FLASH_RATE;

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 animate-fade-in-up font-sans pb-20">
      
      {/* iOS-style Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-zinc-800 px-4 pt-12 pb-4 flex items-center justify-between">
         <button 
            onClick={onBack}
            className="text-[#0A84FF] flex items-center gap-1 text-[17px] active:opacity-60 transition-opacity pl-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back
          </button>
          <h2 className="text-[17px] font-semibold tracking-tight absolute left-1/2 -translate-x-1/2">Settings</h2>
          <div className="w-12"></div>
      </div>

      <div className="max-w-2xl mx-auto p-5 space-y-8">
        
        {/* Section: Voice */}
        <div className="space-y-2">
            <h3 className="text-[13px] font-medium text-zinc-500 uppercase tracking-wide ml-4">Voice Persona</h3>
            <div className="bg-[#1C1C1E] rounded-[18px] overflow-hidden">
                {Object.values(VoiceName).map((voice, idx, arr) => (
                    <button
                        key={voice}
                        onClick={() => handleChange('voiceName', voice)}
                        className={`
                            w-full flex items-center justify-between px-5 py-4 text-left transition-colors active:bg-[#2C2C2E]
                            ${idx !== arr.length - 1 ? 'border-b border-zinc-700/50' : ''}
                        `}
                    >
                        <span className="text-[17px] text-zinc-200">{voice}</span>
                        {config.voiceName === voice && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0A84FF]" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Section: System Instructions */}
        <div className="space-y-2">
            <h3 className="text-[13px] font-medium text-zinc-500 uppercase tracking-wide ml-4">System Instructions</h3>
            
            {/* Template Chips */}
            <div className="flex gap-2 overflow-x-auto pb-3 px-1 no-scrollbar">
                {TEMPLATES.map((t) => (
                    <button
                        key={t.name}
                        onClick={() => handleChange('systemInstruction', t.prompt)}
                        className="shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium bg-[#2C2C2E] text-zinc-300 active:bg-[#3A3A3C] transition-colors"
                    >
                        {t.name}
                    </button>
                ))}
            </div>

            <div className="bg-[#1C1C1E] rounded-[18px] p-4">
                <textarea
                    value={config.systemInstruction}
                    onChange={(e) => handleChange('systemInstruction', e.target.value)}
                    className="w-full h-48 bg-transparent text-[17px] leading-relaxed text-zinc-200 outline-none resize-none placeholder-zinc-600 font-normal"
                    placeholder="Enter instructions for the AI..."
                />
            </div>
            <p className="text-[13px] text-zinc-500 ml-4 leading-normal">
                These instructions determine how the AI behaves. Use the templates above for quick setups.
            </p>
        </div>

        {/* Section: Cost Estimator */}
        <div className="space-y-2">
             <h3 className="text-[13px] font-medium text-zinc-500 uppercase tracking-wide ml-4">Monthly Cost Estimator</h3>
             <div className="bg-[#1C1C1E] rounded-[18px] p-5 space-y-6">
                
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                    <div className="space-y-1">
                        <label className="text-[15px] text-zinc-400">Total Users</label>
                        <input 
                            type="number" 
                            value={estUsers}
                            onChange={(e) => setEstUsers(Number(e.target.value))}
                            className="block w-24 bg-transparent text-xl font-semibold text-white outline-none"
                        />
                    </div>
                    <div className="space-y-1 text-right">
                        <label className="text-[15px] text-zinc-400">Mins / User</label>
                        <input 
                            type="number" 
                            value={estMins}
                            onChange={(e) => setEstMins(Number(e.target.value))}
                            className="block w-24 bg-transparent text-xl font-semibold text-white outline-none text-right"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/50 rounded-xl p-3 flex flex-col justify-between h-24">
                         <span className="text-[13px] text-zinc-500 font-medium">Hume AI (Est)</span>
                         <span className="text-2xl font-bold text-zinc-400 line-through decoration-red-500/50 decoration-2">
                            ${humeCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                         </span>
                    </div>
                    <div className="bg-[#0A84FF]/10 rounded-xl p-3 flex flex-col justify-between h-24 border border-[#0A84FF]/30">
                         <span className="text-[13px] text-[#0A84FF] font-medium">Google Vertex</span>
                         <span className="text-2xl font-bold text-white">
                            ${googleCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                         </span>
                    </div>
                </div>

                <p className="text-[11px] text-zinc-600 text-center">
                    Estimates based on current public pricing for Gemini 1.5 Flash (Audio In/Out) vs Hume EVI Standard.
                </p>
             </div>
        </div>

        {/* Footer Info */}
        <div className="pt-8 flex flex-col items-center gap-2">
            <p className="text-[13px] text-zinc-600">Gemini Live Client v1.2</p>
            <p className="text-[11px] text-zinc-700">Powered by Google Vertex AI</p>
        </div>

      </div>
    </div>
  );
};
