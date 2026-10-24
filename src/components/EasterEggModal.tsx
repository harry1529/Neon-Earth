import React from 'react';
import { X, Sparkles, Radio, Key } from 'lucide-react';
import { EasterEgg } from '../types';
import { audioSystem } from '../services/audioSystem';

interface EasterEggModalProps {
  easterEgg: EasterEgg | null;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const EasterEggModal: React.FC<EasterEggModalProps> = ({
  easterEgg,
  onClose,
  onShowToast,
}) => {
  if (!easterEgg) return null;

  const handleActivateBonus = () => {
    audioSystem.playSecretChord();
    onShowToast(`EASTER EGG ACTIVATED // ${easterEgg.bonusEffect}`);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#030712]/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
      <div className="hud-panel max-w-lg w-full p-6 sm:p-7 rounded-xl corner-brackets relative border border-amber-500/50 box-glow-amber">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs tracking-widest uppercase mb-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>CLASSIFIED ANOMALY DETECTED</span>
        </div>

        <h3 className="font-orbitron font-bold text-xl text-white mb-3">
          {easterEgg.name}
        </h3>

        <div className="p-3 mb-4 rounded bg-slate-950/70 border border-slate-800 text-xs font-mono text-[#00f0ff]">
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>TRANSMISSION DECRYPTED:</span>
          </div>
          <div className="text-slate-300 font-rajdhani text-base leading-relaxed">
            {easterEgg.lore}
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs mb-5">
          <span className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>BONUS PROTOCOL:</span>
          </span>
          <span className="font-bold">{easterEgg.bonusEffect}</span>
        </div>

        <button
          onClick={handleActivateBonus}
          className="w-full py-3 rounded bg-amber-500 text-[#030712] font-orbitron font-bold text-xs uppercase tracking-widest hover:bg-white transition cursor-pointer"
        >
          CLAIM & SYNC NEURAL LINK
        </button>
      </div>
    </div>
  );
};
