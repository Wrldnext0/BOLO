import React from 'react';

interface WaveformProps {
  data: Uint8Array | null;
  isActive: boolean;
}

const Waveform: React.FC<WaveformProps> = ({ data, isActive }) => {
  // If no data or not active, render idle state
  const bars = new Array(16).fill(0);
  
  return (
    <div className="flex items-center justify-center gap-[2px] h-24 w-full max-w-[300px]">
      {bars.map((_, i) => {
        // Map frequency data to bar height
        let height = 5; // Default min height %
        
        if (isActive && data) {
           // We pick specific bins from the frequency data to represent the bars
           // data usually has 128 or more bins. We spread our 16 bars across the range.
           const index = Math.floor((i / bars.length) * (data.length / 2));
           const value = data[index] || 0;
           height = Math.max(5, (value / 255) * 100);
        } else {
            // Idle animation
            height = 5;
        }

        return (
            <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-75 ease-out ${
                isActive ? 'bg-luminous-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-slate-800'
            }`}
            style={{ height: `${height}%` }}
            />
        );
      })}
    </div>
  );
};

export default Waveform;