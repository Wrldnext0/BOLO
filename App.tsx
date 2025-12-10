import React, { useState, useEffect } from 'react';
import { ViewState, TranscriptionRecord, AppSettings, SupportedLanguage } from './types';
import Console from './components/Console';
import Editor from './components/Editor';
import History from './components/History';
import Settings from './components/Settings';

const DEFAULT_SETTINGS: AppSettings = {
    language: SupportedLanguage.AUTO,
    highContrast: false,
    fontSize: 'normal',
    miniMode: false,
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.CONSOLE);
  const [history, setHistory] = useState<TranscriptionRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<TranscriptionRecord | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Load history and settings from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('bolo_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    const savedSettings = localStorage.getItem('bolo_settings');
    if (savedSettings) {
        try {
            setSettings(JSON.parse(savedSettings));
        } catch (e) {
            console.error("Failed to parse settings", e);
        }
    }
  }, []);

  // Save updates to storage
  useEffect(() => {
    localStorage.setItem('bolo_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('bolo_settings', JSON.stringify(settings));
  }, [settings]);


  const handleTranscriptionComplete = (record: TranscriptionRecord) => {
    setActiveRecord(record);
    // Add to history immediately
    setHistory(prev => [record, ...prev]);
    setCurrentView(ViewState.EDITOR);
  };

  const handleHistorySelect = (record: TranscriptionRecord) => {
    setActiveRecord(record);
    setCurrentView(ViewState.EDITOR);
  };

  const handleUpdateRecord = (updated: TranscriptionRecord) => {
    setHistory(prev => prev.map(item => item.id === updated.id ? updated : item));
    setActiveRecord(updated);
  };

  const handleDeleteRecord = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (activeRecord?.id === id) {
        setActiveRecord(null);
        setCurrentView(ViewState.HISTORY);
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-deep-space text-ghost-white font-sans selection:bg-luminous-cyan/30 ${settings.highContrast ? 'contrast-125 saturate-150' : ''} ${settings.fontSize === 'large' ? 'text-lg' : ''}`}>
      
      {/* Sidebar (Desktop/Windows) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="p-6">
           <h1 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-luminous-cyan to-electric-indigo">
             BOLO
           </h1>
           <span className="text-[10px] text-slate-500 tracking-widest uppercase">Holo-Lingo Engine</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
            <NavButton 
                active={currentView === ViewState.CONSOLE} 
                onClick={() => setCurrentView(ViewState.CONSOLE)}
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a6 6 0 00-6 6v1.5a6 6 0 006 6v-1.5a6 6 0 006-6v-1.5a6 6 0 00-6-6z" /></svg>}
                label="Console"
            />
            <NavButton 
                active={currentView === ViewState.HISTORY} 
                onClick={() => setCurrentView(ViewState.HISTORY)}
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                label="History"
            />
             <NavButton 
                active={currentView === ViewState.SETTINGS} 
                onClick={() => setCurrentView(ViewState.SETTINGS)}
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                label="Settings"
            />
        </nav>
        
        <div className="p-4 border-t border-white/5">
            <div className="p-3 bg-white/5 rounded-lg border border-white/5 backdrop-blur-md">
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span>
                    <span className="text-xs font-mono text-white">Bolo Online</span>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-deep-space to-deep-space">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-luminous-cyan to-electric-indigo">BOLO</h1>
            <div className="flex gap-4">
                <button onClick={() => setCurrentView(ViewState.SETTINGS)} className="text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.43.816 1.035.816 1.73 0 .695-.32 1.3-.816 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>
                </button>
                <button onClick={() => setCurrentView(ViewState.HISTORY)} className="text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
            </div>
        </div>

        {/* View Switcher */}
        <div className="flex-1 overflow-hidden relative">
            {currentView === ViewState.CONSOLE && (
                <Console 
                    onTranscriptionComplete={handleTranscriptionComplete} 
                    setView={setCurrentView}
                    settings={settings}
                />
            )}
            
            {currentView === ViewState.EDITOR && activeRecord && (
                <Editor 
                    data={activeRecord} 
                    setView={setCurrentView}
                    onSave={handleUpdateRecord}
                />
            )}

            {currentView === ViewState.HISTORY && (
                <History 
                    records={history} 
                    setView={setCurrentView} 
                    onSelect={handleHistorySelect}
                    onDelete={handleDeleteRecord}
                />
            )}

            {currentView === ViewState.SETTINGS && (
                <Settings 
                    settings={settings}
                    updateSettings={setSettings}
                />
            )}
        </div>

      </main>

    </div>
  );
};

// UI Components
const NavButton: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean}> = ({active, onClick, icon, label, disabled}) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            active 
            ? 'bg-gradient-to-r from-electric-indigo/20 to-luminous-cyan/10 border border-electric-indigo/30 text-white shadow-[0_0_10px_rgba(99,102,241,0.15)]' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {icon}
        {label}
    </button>
);

export default App;