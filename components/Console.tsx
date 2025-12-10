import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ViewState, TranscriptionRecord, AppSettings } from '../types';
import Waveform from './Waveform';
import { processAudio } from '../services/boloService';

interface ConsoleProps {
  onTranscriptionComplete: (record: TranscriptionRecord) => void;
  setView: (view: ViewState) => void;
  settings: AppSettings;
}

const SILENCE_THRESHOLD_MS = 4000; // Reduced to 4s for snappier response
const SPEECH_THRESHOLD_VOLUME = 8; // Lowered to 8 to catch softer voices
const INITIAL_SILENCE_TIMEOUT_MS = 10000; // 10s to stop if no speech detected at start

const Console: React.FC<ConsoleProps> = ({ onTranscriptionComplete, setView, settings }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Persistent Refs
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // State Logic Refs
  const manualStopRef = useRef<boolean>(false); // Track if user clicked stop
  const lastSpeechTimestampRef = useRef<number>(0);
  const hasSpokenSinceStartRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number>();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        shutdownAudio();
    };
  }, []);

  const shutdownAudio = () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
      }
  };

  // Initialize Audio Resources (Called once)
  const initAudio = async () => {
      if (streamRef.current?.active) return true;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512; 
        analyser.smoothingTimeConstant = 0.2; // Faster reaction
        analyserRef.current = analyser;
        source.connect(analyser);

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        // Setup Recorder Handlers
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            // Processing Phase
            setIsProcessing(true);
            setStatusMessage('Processing...');
            
            const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
            chunksRef.current = []; // Reset for next

            // Logic: Did we actually hear anything?
            const shouldProcess = settings.handsFreeMode ? hasSpokenSinceStartRef.current : true;

            if (shouldProcess && audioBlob.size > 0) {
                try {
                    const result = await processAudio(audioBlob, settings);
                    
                    // Filter empty results AND specific SILENCE token
                    const cleanedText = result.text ? result.text.trim() : "";
                    if (cleanedText.length > 0 && cleanedText !== "SILENCE") {
                        const newRecord: TranscriptionRecord = {
                            id: Date.now().toString(),
                            originalText: cleanedText,
                            detectedLanguage: result.detectedLanguage,
                            translatedText: result.englishTranslation,
                            timestamp: Date.now(),
                        };
                        onTranscriptionComplete(newRecord);
                    } else {
                        console.log("Ignored: Noise/Music/Silence detected");
                    }
                } catch (err) {
                    console.error("Processing failed", err);
                    if (!settings.handsFreeMode) {
                        setErrorMsg("Could not process audio.");
                    }
                }
            } else {
                console.log("Skipping processing: No speech detected or empty audio.");
            }

            setIsProcessing(false);
            setStatusMessage('');
            
            // Loop Logic: Only restart if Hands-Free is ON AND it wasn't a manual stop
            if (settings.handsFreeMode && !manualStopRef.current) {
                // Short delay before restart to clear buffers/state
                setTimeout(() => {
                    startRecorderSession();
                }, 100);
            } else {
                setIsRecording(false);
            }
        };

        return true;
      } catch (e) {
          console.error(e);
          setErrorMsg("Microphone access failed.");
          return false;
      }
  };

  const startRecorderSession = () => {
      if (!mediaRecorderRef.current) return;
      
      // Reset VAD stats
      hasSpokenSinceStartRef.current = false;
      lastSpeechTimestampRef.current = Date.now();
      startTimeRef.current = Date.now();
      manualStopRef.current = false; // Reset manual stop flag
      chunksRef.current = [];
      
      try {
        if (mediaRecorderRef.current.state === 'inactive') {
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setStatusMessage(settings.handsFreeMode ? 'Listening (Hands-Free)...' : 'Listening...');
            // Ensure visualizer loop is running
            if (!animationFrameRef.current) updateLoop();
        }
      } catch (e) {
          console.error("Failed to start recorder", e);
      }
  };

  const stopRecorderSession = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          // onstop will trigger processing
      }
  };

  const handleToggleRecord = async () => {
    setErrorMsg(null);
    if (isRecording) {
        // User clicked STOP manually
        manualStopRef.current = true;
        stopRecorderSession();
    } else {
        // Start
        const success = await initAudio();
        if (success) {
            manualStopRef.current = false;
            startRecorderSession();
            updateLoop();
        }
    }
  };

  // VAD & Visualizer Loop
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);

  const updateLoop = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      setAudioData(dataArray);

      // VAD Logic
      let sum = 0;
      for(let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avgVol = sum / dataArray.length;

      // Rule: Timer strictly resets every time user speaks
      // Threshold lowered to 8 for better sensitivity
      if (avgVol > SPEECH_THRESHOLD_VOLUME) {
          lastSpeechTimestampRef.current = Date.now();
          if (!hasSpokenSinceStartRef.current) {
              hasSpokenSinceStartRef.current = true;
          }
          setStatusMessage('Speech Detected...');
      }

      // Hands-Free VAD Logic
      if (isRecording && settings.handsFreeMode) {
          const now = Date.now();
          
          if (hasSpokenSinceStartRef.current) {
              // 1. Post-Speech Silence Timeout
              const silenceDuration = now - lastSpeechTimestampRef.current;
              if (silenceDuration > SILENCE_THRESHOLD_MS) {
                  setStatusMessage('Processing...');
                  stopRecorderSession();
                  return; 
              }
          } else {
              // 2. Initial Silence Timeout (User walked away or mic broken)
              const sessionDuration = now - startTimeRef.current;
              if (sessionDuration > INITIAL_SILENCE_TIMEOUT_MS) {
                  setStatusMessage('No speech detected. Stopping.');
                  // Treat as auto-stop, but since no speech, onstop will skip processing
                  // Should we restart? No, if they are silent for 10s at start, pause.
                  manualStopRef.current = true; // Stop the loop
                  stopRecorderSession();
                  return;
              }
          }
      }

      animationFrameRef.current = requestAnimationFrame(updateLoop);
  };

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full relative p-6 animate-fade-in`}>
      {/* Central Prompt / Status */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 max-w-2xl">
        {isProcessing ? (
          <div className="space-y-4">
            <div className="text-luminous-cyan font-mono text-xl animate-pulse">Processing...</div>
            <p className="text-slate-400 text-sm">Preparing Text...</p>
          </div>
        ) : (
          <>
            <h2 className={`font-bold tracking-tight transition-colors duration-500 ${isRecording ? 'text-white' : 'text-slate-500'} text-3xl md:text-5xl`}>
              {isRecording ? "Bolo Active" : "Tap to Bolo"}
            </h2>
            <div className={`text-slate-400 font-sans max-w-md text-base`}>
               {isRecording ? (
                   <p className="text-electric-indigo font-mono animate-pulse">{statusMessage}</p>
               ) : (
                   <p className="mb-2">
                     Current Mode: <span className="text-luminous-cyan">{settings.language}</span>
                     {settings.handsFreeMode && (
                        <span className="block text-green-400 mt-2 font-bold text-xs border border-green-500/30 bg-green-900/20 py-1 rounded px-2">
                            HANDS-FREE ON
                        </span>
                     )}
                   </p>
               )}
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
          {isRecording ? (
             <div className="w-8 h-8 bg-white rounded-md" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a6 6 0 00-6 6v1.5a6 6 0 006 6v-1.5a6 6 0 006-6v-1.5a6 6 0 00-6-6z" />
            </svg>
          )}
          
          {!isRecording && !isProcessing && (
             <div className="absolute inset-0 rounded-full border border-electric-indigo opacity-50 animate-ping" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Console;