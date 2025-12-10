import React from 'react';
import { ViewState, TranscriptionRecord } from '../types';

interface HistoryProps {
  records: TranscriptionRecord[];
  setView: (view: ViewState) => void;
  onSelect: (record: TranscriptionRecord) => void;
  onDelete: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ records, setView, onSelect, onDelete }) => {
  return (
    <div className="h-full w-full max-w-4xl mx-auto p-6 md:p-8 animate-fade-in flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">History</h2>
        <button 
            onClick={() => setView(ViewState.CONSOLE)}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors border border-white/10"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>

      {records.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No transcriptions yet.</p>
              <button onClick={() => setView(ViewState.CONSOLE)} className="mt-4 text-luminous-cyan hover:underline">Start Recording</button>
          </div>
      ) : (
          <div className="grid gap-4 overflow-y-auto pb-20">
              {records.map((rec) => (
                  <div key={rec.id} className="group relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-luminous-cyan/30 rounded-xl p-4 transition-all duration-200 cursor-pointer" onClick={() => onSelect(rec)}>
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-mono text-luminous-cyan px-2 py-0.5 rounded bg-cyan-900/20 border border-cyan-900/30">
                              {rec.detectedLanguage}
                          </span>
                          <span className="text-xs text-slate-500">
                              {new Date(rec.timestamp).toLocaleDateString()} • {new Date(rec.timestamp).toLocaleTimeString()}
                          </span>
                      </div>
                      <p className="text-slate-300 line-clamp-2 font-mono text-sm mb-2">{rec.originalText}</p>
                      {rec.translatedText && (
                          <p className="text-electric-indigo/80 line-clamp-1 text-xs italic">
                              "{rec.translatedText}"
                          </p>
                      )}
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(rec.id); }}
                        className="absolute top-4 right-4 p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                      </button>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default History;