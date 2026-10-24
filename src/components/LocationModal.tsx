import React from 'react';
import { X, Zap, ShieldAlert } from 'lucide-react';
import { CityLocation } from '../types';
import { audioSystem } from '../services/audioSystem';

interface LocationModalProps {
  location: CityLocation | null;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  location,
  onClose,
  onShowToast,
}) => {
  if (!location) return null;

  const handleEngageSubroutine = () => {
    audioSystem.playSubroutine();
    onShowToast(`SUB-ROUTINE EXECUTED // QUANTUM BUFFER RE-FRESHED ON ${location.name}`);
    onClose();
  };

  return (
    <div
      id="location-modal"
      className="absolute inset-0 z-40 bg-[#030712]/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-500 animate-fadeIn"
    >
      <div className="hud-panel max-w-2xl w-full p-6 sm:p-8 rounded-xl corner-brackets relative border border-[#00f0ff]/50 box-glow-cyan transform scale-100 transition-all duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge and Title */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="px-2.5 py-0.5 rounded bg-[#00f0ff]/20 border border-[#00f0ff] text-[#00f0ff] font-mono text-xs uppercase tracking-widest">
            {location.badge}
          </span>
          <span className="text-xs font-mono text-slate-400">
            // {location.subtitle}
          </span>
        </div>

        <h2 className="font-orbitron text-2xl sm:text-3xl font-black text-white glow-cyan uppercase tracking-wider mb-4">
          {location.name}
        </h2>

        {/* Description */}
        <p className="text-slate-300 font-rajdhani text-lg leading-relaxed mb-6">
          {location.desc}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 font-mono text-xs">
          <div className="p-3 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-slate-500 uppercase text-[10px]">{location.stat1Label}</div>
            <div className="text-[#00f0ff] font-bold text-sm mt-0.5">{location.stat1}</div>
          </div>
          <div className="p-3 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-slate-500 uppercase text-[10px]">{location.stat2Label}</div>
            <div className="text-[#ff007f] font-bold text-sm mt-0.5">{location.stat2}</div>
          </div>
          <div className="p-3 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-slate-500 uppercase text-[10px]">{location.stat3Label}</div>
            <div className="text-amber-400 font-bold text-sm mt-0.5">{location.stat3}</div>
          </div>
        </div>

        {/* Security Clearance Alert */}
        <div className="mb-6 p-2.5 rounded bg-slate-950/70 border border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-400">
          <ShieldAlert className="w-4 h-4 text-[#ff007f] flex-shrink-0" />
          <span>ACCESS PROTOCOL: <span className="text-white">{location.securityLevel}</span></span>
        </div>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <span className="text-[11px] font-mono text-slate-400">
            DISCOVERED BY DRONE TELEMETRY LINK
          </span>
          <button
            onClick={handleEngageSubroutine}
            className="w-full sm:w-auto px-6 py-2.5 rounded bg-[#00f0ff] text-[#030712] font-orbitron font-bold text-xs uppercase tracking-wider hover:bg-white transition box-glow-cyan flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>ENGAGE SUB-ROUTINE</span>
            <Zap className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
