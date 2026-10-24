import React from 'react';
import { X, Terminal } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div
      id="help-modal"
      className="absolute inset-0 z-40 bg-[#030712]/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 select-none"
    >
      <div className="hud-panel max-w-lg w-full p-6 sm:p-7 rounded-xl corner-brackets relative border border-[#ff007f]/40 box-glow-magenta">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-[#ff007f] font-mono text-xs tracking-widest uppercase mb-2">
          <Terminal className="w-4 h-4 text-[#ff007f]" />
          <span>DRONE PILOT MANUAL</span>
        </div>

        <h3 className="font-orbitron font-bold text-xl text-white mb-4">
          CITY NAVIGATION & SHORTCUTS
        </h3>

        <div className="space-y-2.5 font-mono text-xs text-slate-300 mb-6">
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[#00f0ff] font-bold">W / A / S / D</span>
            <span>Forward / Left / Backward / Right</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[#00f0ff] font-bold">Q / E or SCROLL</span>
            <span>Elevation (Altitude Down / Up)</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[#00f0ff] font-bold">MOUSE DRAG / TOUCH</span>
            <span>Rotate 360° Camera View</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[#00f0ff] font-bold">SHIFT KEY</span>
            <span>Engage Afterburner Turbo Speed</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[#00f0ff] font-bold">R KEY</span>
            <span>Reset Gimbal & Camera Orientation</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[#ff007f] font-bold">CLICK LOCATIONS</span>
            <span>Dock & Inspect City Districts</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-amber-400 font-bold">AUDIO OSCILLOSCOPE</span>
            <span>Real-time Waveform Beam & Synthesizer</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded bg-[#ff007f] text-white font-orbitron font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-[#030712] transition cursor-pointer"
        >
          CONFIRM & RETURN TO FLIGHT
        </button>
      </div>
    </div>
  );
};
