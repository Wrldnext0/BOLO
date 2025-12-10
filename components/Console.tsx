import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ViewState, TranscriptionRecord, AppSettings } from '../types';
import Waveform from './Waveform';
import { processAudio } from '../services/boloService';

interface ConsoleProps {
  onTranscriptionComplete: (record: TranscriptionRecord) => void;
  setView: (view: ViewState) => void;
  settings: AppSettings;
}

const Console: React.FC<ConsoleProps> = ({ onTranscriptionComplete, setView, settings }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Visualizer State
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const animationFrameRef = useRef<number>();

  const chunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    };
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
          } 
      });
      streamRef.current = stream;

      // --- Advanced Audio Processing Pipeline ---
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // 1. High-Pass Filter: Remove low frequency rumble/noise
      const filter = audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 85; // Cut off below 85Hz

      // 2. Dynamics Compressor: "Adaptive Audio" - even out loud/quiet parts
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;

      // 3. Analyser for Visualization
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64; // Low resolution for bars
      analyserRef.current = analyser;

      // Connect Graph: Source -> Filter -> Compressor -> Analyser -> Destination
      const destination = audioContext.createMediaStreamDestination();
      
      source.connect(filter);
      filter.connect(compressor);
      compressor.connect(analyser);
      analyser.connect(destination);

      // --- Recorder Setup (Record the PROCESSED audio) ---
      const mediaRecorder = new MediaRecorder(destination.stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        // Stop Visualizer
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setAudioData(null);

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Clean up audio context
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }

        try {
          const result = await processAudio(audioBlob, settings);
          const newRecord: TranscriptionRecord = {
            id: Date.now().toString(),
            originalText: result.text,
            translatedText: result.englishTranslation,
            detectedLanguage: result.detectedLanguage,
            timestamp: Date.now(),
          };
          onTranscriptionComplete(newRecord);
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Failed to process audio.");
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start Visualizer Loop
      const updateVisualizer = () => {
          if (analyserRef.current) {
              const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(dataArray);
              setAudioData(dataArray);
          }
          animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();

    } catch (err) {
      console.error(err);
      setErrorMsg("Microphone access denied or not available.");
    }
  }, [onTranscriptionComplete, settings]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleToggleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full relative p-6 animate-fade-in ${settings.highContrast ? 'contrast-125' : ''}`}>
      {/* Central Prompt / Status */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 max-w-2xl">
        {isProcessing ? (
          <div className="space-y-4">
            <div className="text-luminous-cyan font-mono text-xl animate-pulse">Processing Audio...</div>
            <p className="text-slate-400 text-sm">Adaptive Audio Engine Active</p>
          </div>
        ) : (
          <>
            <h2 className={`font-bold tracking-tight transition-colors duration-500 ${isRecording ? 'text-white' : 'text-slate-500'} ${settings.fontSize === 'large' ? 'text-5xl md:text-7xl' : 'text-3xl md:text-5xl'}`}>
              {isRecording ? "Listening..." : "Tap to Bolo"}
            </h2>
            <div className={`text-slate-400 font-sans max-w-md ${settings.fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
               <p className="mb-2">
                 Current Mode: <span className="text-luminous-cyan">{settings.language}</span>
               </p>
               {/* Advanced Audio Badges */}
               <div className="flex flex-wrap justify-center gap-2 mt-4">
                   <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
                       NOISE_REDUCTION: ON
                   </span>
                    <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
                       ADAPTIVE_GAIN: ON
                   </span>
                   <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
                       MUSIC_FILTER: ON
                   </span>
               </div>
            </div>
          </>
        )}
        
        {errorMsg && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg text-sm">
                {errorMsg}
            </div>
        )}
      </div>

      {/* Microphone Hub */}
      <div className="relative mb-12 flex flex-col items-center justify-center w-full">
        {/* Visualizer wraps the button or floats above it */}
        <div className="h-24 flex items-end justify-center mb-4 w-full">
            <Waveform isActive={isRecording} data={audioData} />
        </div>

        <button
          onClick={handleToggleRecord}
          disabled={isProcessing}
          className={`
            relative z-10 group
            w-20 h-20 md:w-24 md:h-24 rounded-full
            flex items-center justify-center
            transition-all duration-300
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
            ${isRecording 
              ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
              : 'bg-electric-indigo shadow-[0_0_30px_rgba(99,102,241,0.5)] animate-glow'
            }
          `}
        >
          {/* Inner Icon */}
          {isRecording ? (
             <div className="w-8 h-8 bg-white rounded-md" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a6 6 0 00-6 6v1.5a6 6 0 006 6v-1.5a6 6 0 006-6v-1.5a6 6 0 00-6-6z" />
            </svg>
          )}
          
          {/* Ripple Effect Ring */}
          {!isRecording && !isProcessing && (
             <div className="absolute inset-0 rounded-full border border-electric-indigo opacity-50 animate-ping" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Console;