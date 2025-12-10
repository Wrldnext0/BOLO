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
            
            {/* Language Section */}
            <section className="bg-white/5 border border-glass-border rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-medium text-luminous-cyan mb-4 flex items-center gap-2">
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
                    Select "Auto-Detect" for mixed language conversations (Code-switching). Force a language if you need stricter recognition.
                </p>
            </section>

            {/* Accessibility Section */}
            <section className="bg-white/5 border border-glass-border rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-medium text-luminous-cyan mb-4 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Accessibility
                </h3>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-white font-medium">High Contrast Mode</span>
                            <span className="text-xs text-slate-500">Increases text visibility and reduces transparency</span>
                        </div>
                        <button
                            onClick={() => toggleSetting('highContrast', !settings.highContrast)}
                            className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${
                                settings.highContrast ? 'bg-luminous-cyan' : 'bg-slate-700'
                            }`}
                        >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                                settings.highContrast ? 'left-7' : 'left-1'
                            }`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-white font-medium">Large Text Size</span>
                            <span className="text-xs text-slate-500">Increases font size for transcriptions</span>
                        </div>
                         <button
                            onClick={() => toggleSetting('fontSize', settings.fontSize === 'normal' ? 'large' : 'normal')}
                            className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${
                                settings.fontSize === 'large' ? 'bg-luminous-cyan' : 'bg-slate-700'
                            }`}
                        >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                                settings.fontSize === 'large' ? 'left-7' : 'left-1'
                            }`} />
                        </button>
                    </div>
                </div>
            </section>

             {/* Export Section (Mock) */}
             <section className="bg-white/5 border border-glass-border rounded-xl p-6 backdrop-blur-sm opacity-70">
                <h3 className="text-lg font-medium text-slate-400 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                    Default Export Format (Coming Soon)
                </h3>
                <div className="flex gap-3">
                    <div className="px-4 py-2 rounded bg-slate-800 border border-white/5 text-slate-500 text-sm cursor-not-allowed">.TXT</div>
                    <div className="px-4 py-2 rounded bg-slate-800 border border-white/5 text-slate-500 text-sm cursor-not-allowed">.DOCX</div>
                    <div className="px-4 py-2 rounded bg-slate-800 border border-white/5 text-slate-500 text-sm cursor-not-allowed">PDF</div>
                </div>
             </section>
        </div>
    </div>
  );
};

export default Settings;