import React, { useState } from 'react';
import { ViewState, TranscriptionRecord } from '../types';
import { translateText } from '../services/boloService';

interface EditorProps {
  data: TranscriptionRecord;
  setView: (view: ViewState) => void;
  onSave: (updatedRecord: TranscriptionRecord) => void;
}

const Editor: React.FC<EditorProps> = ({ data, setView, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentText, setCurrentText] = useState(data.originalText);
  const [currentTranslation, setCurrentTranslation] = useState(data.translatedText || "");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const displayedText = showTranslation ? currentTranslation : currentText;

  const handleTranslate = async () => {
    if (showTranslation) {
        setShowTranslation(false);
        return;
    }

    if (!currentTranslation && currentText) {
        setIsTranslating(true);
        const trans = await translateText(currentText);
        setCurrentTranslation(trans);
        setIsTranslating(false);
        // Update parent record implicitly for session
        onSave({ ...data, translatedText: trans });
    }
    setShowTranslation(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveAndClose = () => {
    onSave({ 
        ...data, 
        originalText: currentText,
        translatedText: currentTranslation 
    });
    setView(ViewState.HISTORY);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
        {/* Header Controls */}
        <div className="flex items-center justify-between mb-6">
            <button onClick={() => setView(ViewState.CONSOLE)} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back to Console
            </button>
            
            <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full border border-slate-700 bg-slate-900 text-xs font-mono text-luminous-cyan shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    Detected: {data.detectedLanguage || "Unknown"}
                </span>
            </div>
        </div>

        {/* Main Editor Pane */}
        <div className="flex-1 relative group bg-glass-bg backdrop-blur-md rounded-2xl border border-glass-border overflow-hidden flex flex-col shadow-2xl">
            {/* Toolbar */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-white/5">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowTranslation(false)}
                        className={`text-sm font-medium transition-colors ${!showTranslation ? 'text-luminous-cyan' : 'text-slate-400 hover:text-white'}`}
                    >
                        Original
                    </button>
                    <div className="h-4 w-[1px] bg-slate-700"></div>
                    <button 
                        onClick={handleTranslate}
                        className={`text-sm font-medium flex items-center gap-2 transition-colors ${showTranslation ? 'text-electric-indigo' : 'text-slate-400 hover:text-white'}`}
                    >
                        {isTranslating ? 'Translating...' : 'English Translation'}
                        {showTranslation && <div className="w-1.5 h-1.5 rounded-full bg-electric-indigo shadow-[0_0_5px_currentColor]"></div>}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setIsEditing(!isEditing)} className="p-2 hover:bg-white/10 rounded-lg text-slate-300 transition-colors" title="Edit Text">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto relative">
                {isTranslating ? (
                   <div className="flex items-center justify-center h-full text-electric-indigo animate-pulse">
                       Translating content...
                   </div>
                ) : (
                    <textarea
                        disabled={!isEditing}
                        value={displayedText}
                        onChange={(e) => showTranslation ? setCurrentTranslation(e.target.value) : setCurrentText(e.target.value)}
                        className={`w-full h-full bg-transparent resize-none focus:outline-none font-mono text-lg leading-relaxed ${showTranslation ? 'text-indigo-100' : 'text-ghost-white'} ${!isEditing ? 'cursor-default' : ''}`}
                        spellCheck={false}
                    />
                )}
            </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 flex items-center justify-center gap-4">
            <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all active:scale-95 border border-white/5"
            >
                {isCopied ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-400">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span>Copied</span>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
                        </svg>
                        <span>Copy Text</span>
                    </>
                )}
            </button>

            <button 
                onClick={handleSaveAndClose}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-electric-indigo to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
                <span>Save to History</span>
            </button>
        </div>
    </div>
  );
};

export default Editor;