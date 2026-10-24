import React from 'react';
import { X, Settings, Monitor, Volume2, Eye } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-[#030712]/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 select-none">
      <div className="hud-panel max-w-lg w-full p-6 sm:p-7 rounded-xl corner-brackets relative border border-[#00f0ff]/40 box-glow-cyan">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-[#00f0ff] font-mono text-xs tracking-widest uppercase mb-2">
          <Settings className="w-4 h-4 text-[#00f0ff]" />
          <span>SYSTEM CONFIGURATION</span>
        </div>

        <h3 className="font-orbitron font-bold text-xl text-white mb-5">
          GRAPHICS & AUDIO SETTINGS
        </h3>

        <div className="space-y-4 font-mono text-xs text-slate-300 mb-6">
          {/* Graphics Quality */}
          <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-white">
                <Monitor className="w-4 h-4 text-[#00f0ff]" />
                <span>RENDER FIDELITY</span>
              </span>
              <span className="text-[#00f0ff] uppercase font-bold">{settings.graphicsQuality}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdateSettings({ graphicsQuality: q })}
                  className={`py-1.5 rounded uppercase font-semibold text-[11px] transition cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'bg-[#00f0ff] text-[#030712] font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Volume */}
          <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-white">
                <Volume2 className="w-4 h-4 text-[#00f0ff]" />
                <span>SYNTH AMBIENCE GAIN</span>
              </span>
              <span className="text-[#00f0ff] font-bold">
                {Math.round(settings.audioVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.audioVolume}
              onChange={(e) => onUpdateSettings({ audioVolume: parseFloat(e.target.value) })}
              className="w-full accent-[#00f0ff] cursor-pointer"
            />
          </div>

          {/* Reduced Motion Toggle */}
          <div className="p-3 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Eye className="w-4 h-4 text-[#ff007f]" />
              <span>REDUCED MOTION</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ reducedMotion: !settings.reducedMotion })}
              className={`px-3 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                settings.reducedMotion
                  ? 'bg-[#ff007f] text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {settings.reducedMotion ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded bg-[#00f0ff] text-[#030712] font-orbitron font-bold text-xs uppercase tracking-widest hover:bg-white transition cursor-pointer"
        >
          SAVE & CLOSE
        </button>
      </div>
    </div>
  );
};
