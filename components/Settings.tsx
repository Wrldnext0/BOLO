import React from 'react';
import { AppSettings, SupportedLanguage } from '../types';

interface SettingsProps {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, updateSettings }) => {
  
  const toggleSetting = (key: keyof AppSettings, value: any) => {
    updateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="h-full w-full max-w-4xl mx-auto p-6 md:p-8 animate-fade-in flex flex-col">
        <div className="mb-8 border-b border-white/10 pb-4">
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-electric-indigo">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Command Center
            </h2>
            <p className="text-slate-400 mt-1 font-mono text-sm">Configure Bolo Engine Parameters</p>
        </div>

        <div className="space-y-6 overflow-y-auto pb-20">
            
            {/* Hands-Free Mode Section */}
            <section className={`border rounded-xl p-6 backdrop-blur-sm transition-colors duration-300 ${settings.handsFreeMode ? 'bg-electric-indigo/10 border-electric-indigo' : 'bg-white/5 border-white/10'}`}>
                 <div className="flex items-start justify-between">
                     <div>
                        <h3 className={`text-xl font-bold mb-2 flex items-center gap-2 ${settings.handsFreeMode ? 'text-white' : 'text-slate-300'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a6 6 0 00-6 6v1.5a6 6 0 006 6v-1.5a6 6 0 006-6v-1.5a6 6 0 00-6-6z" />
                            </svg>
                            Auto-Paste to Cursor (Hands-Free)
                        </h3>
                        <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
                            When enabled, Bolo will run continuously in the background. 
                            <br/><br/>
                            <span className="text-luminous-cyan font-mono">Workflow:</span>
                            <ul className="list-disc ml-5 mt-1 space-y-1">
                                <li>App listens for speech automatically.</li>
                                <li>Waits for <span className="font-bold text-white">5 seconds of silence</span>.</li>
                                <li>Automatically processes and copies text to clipboard.</li>
                            </ul>
                        </p>
                     </div>
                     <button
                        onClick={() => toggleSetting('handsFreeMode', !settings.handsFreeMode)}
                        className={`mt-2 w-16 h-8 rounded-full relative transition-colors duration-200 ${
                            settings.handsFreeMode ? 'bg-electric-indigo shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-700'
                        }`}
                    >
                        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                            settings.handsFreeMode ? 'left-9' : 'left-1'
                        }`} />
                    </button>
                 </div>
            </section>

            {/* Language Section */}
            <section className="bg-white/5 border border-glass-border rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S12 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S12 3 12 3m0-18a9 9 0 019 9c0 4.97-4.03 9-9 9m9-9H3" /></svg>
                    Language Preference
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.values(SupportedLanguage).map((lang) => (
                        <button
                            key={lang}
                            onClick={() => toggleSetting('language', lang)}
                            className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200 ${
                                settings.language === lang
                                ? 'bg-electric-indigo/20 border-electric-indigo text-white shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                                : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/5'
                            }`}
                        >
                            <span>{lang}</span>
                            {settings.language === lang && (
                                <span className="w-2 h-2 rounded-full bg-electric-indigo shadow-[0_0_5px_currentColor]"></span>
                            )}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-slate-500 mt-4">
                    Select "Auto-Detect" for mixed language conversations (Code-switching).
                </p>
            </section>
        </div>
    </div>
  );
};

export default Settings;