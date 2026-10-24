import {
  Compass,
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  Settings,
  Radio,
  Gamepad2,
  Swords,
  Bot,
  Sparkles,
} from 'lucide-react';
import { CameraMode, CityLocation, TelemetryState } from '../types';
import { CITY_LOCATIONS } from '../data/locations';
import { AudioOscilloscope } from './AudioOscilloscope';

interface CityHUDProps {
  telemetry: TelemetryState;
  cameraMode: CameraMode;
  onSetCameraMode: (mode: CameraMode) => void;
  onWarpToLocation: (loc: CityLocation) => void;
  onResetView: () => void;
  discoveredCount: number;
  totalLocations: number;
  audioActive: boolean;
  onToggleAudio: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onOpenGame: () => void;
  onOpenTerminal: () => void;
  activeToast: string | null;
  onShowToast: (msg: string) => void;
}

export const CityHUD: React.FC<CityHUDProps> = ({
  telemetry,
  cameraMode,
  onSetCameraMode,
  onWarpToLocation,
  onResetView,
  discoveredCount,
  totalLocations,
  audioActive,
  onToggleAudio,
  onOpenHelp,
  onOpenSettings,
  onOpenGame,
  onOpenTerminal,
  activeToast,
  onShowToast,
}) => {
  return (
    <div
      id="hud-overlay"
      className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-5 md:p-6 transition-opacity duration-700 select-none"
    >
      {/* ========================================== */}
      {/* TOP BAR: Brand, Telemetry, Warp & Radar    */}
      {/* ========================================== */}
      <div className="w-full flex items-start justify-between gap-3 flex-wrap">
        {/* Top Left: Logo & Flight Status */}
        <div className="flex items-start gap-2.5 pointer-events-auto">
          <div className="hud-panel p-3 rounded-lg flex items-center gap-3 corner-brackets">
            <div className="w-9 h-9 rounded bg-[#00f0ff]/15 border border-[#00f0ff] flex items-center justify-center text-[#00f0ff]">
              <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '14s' }} />
            </div>
            <div>
              <div className="font-orbitron font-bold text-xs sm:text-sm tracking-widest text-white flex items-center gap-2">
                NEON EARTH
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] font-mono">
                  {telemetry.activeSector}
                </span>
              </div>
              <div className="font-mono text-[10px] text-[#00f0ff]/80 tracking-wider">
                ALTITUDE:{' '}
                <span className="text-white font-semibold">{telemetry.altitude}M</span> // VELOCITY:{' '}
                <span className="text-white font-semibold">{telemetry.speed} KM/H</span>
              </div>
            </div>
          </div>

          {/* Quick Reset View Button */}
          <button
            onClick={onResetView}
            title="Reset Camera View (Press R)"
            className="hud-panel p-2.5 sm:p-3 rounded-lg text-slate-300 hover:text-[#00f0ff] transition flex items-center gap-1.5 text-xs font-mono cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden md:inline">RESET</span>
          </button>
        </div>

        {/* Top Center: Sector Warp Tabs */}
        <div className="hidden lg:flex items-center gap-1.5 hud-panel px-3 py-1.5 rounded-full pointer-events-auto">
          <span className="text-[11px] font-mono text-slate-400 px-2">SECTOR WARP:</span>
          {CITY_LOCATIONS.map((loc, idx) => (
            <button
              key={loc.id}
              onClick={() => onWarpToLocation(loc)}
              className="px-3 py-1 rounded text-xs font-orbitron transition hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 text-slate-300 cursor-pointer"
            >
              0{idx + 1} {loc.id.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Top Right: Discovery Counter, Minimap Radar & Toggles */}
        <div className="flex items-start gap-2.5 pointer-events-auto">
          {/* Discovery Counter */}
          <div className="hud-panel px-3.5 py-2 rounded-lg text-right hidden sm:block">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              DISCOVERED SITES
            </div>
            <div className="font-orbitron font-bold text-base text-[#00f0ff]">
              <span>{discoveredCount}</span>
              <span className="text-slate-500"> / {totalLocations}</span>
            </div>
          </div>

          {/* Minimap Radar 360° */}
          <div
            className="hud-panel p-2 rounded-lg relative w-22 h-22 sm:w-24 sm:h-24 flex items-center justify-center overflow-hidden"
            title={`Heading: ${telemetry.heading}°`}
          >
            <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

            {/* Radar sweep */}
            <div className="absolute inset-0 rounded-full border border-[#00f0ff]/30 flex items-center justify-center">
              <div
                className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#00f0ff]/80 to-transparent animate-spin origin-center pointer-events-none"
                style={{ animationDuration: '4s' }}
              />
              <div className="w-12 h-12 rounded-full border border-[#00f0ff]/20 pointer-events-none" />
            </div>

            {/* Player icon with heading arrow */}
            <div
              className="w-2.5 h-2.5 rounded-full bg-white box-glow-cyan z-10 relative flex items-center justify-center transition-transform"
              style={{ transform: `rotate(${telemetry.heading}deg)` }}
            >
              <div className="w-0.5 h-2 bg-[#00f0ff] absolute -top-1" />
            </div>

            {/* Target blips (Locations on radar) */}
            <div
              className="absolute w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-ping"
              style={{ top: '22%', left: '30%' }}
              title="Central Spire"
            />
            <div
              className="absolute w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse"
              style={{ bottom: '26%', right: '28%' }}
              title="Underground Market"
            />
            <div
              className="absolute w-1.5 h-1.5 rounded-full bg-[#00f0ff]"
              style={{ top: '28%', right: '25%' }}
              title="Neural District"
            />
            <div
              className="absolute w-1.5 h-1.5 rounded-full bg-[#ff007f]"
              style={{ top: '15%', left: '50%' }}
              title="Orbital Gate"
            />

            <span className="absolute bottom-1 right-1 font-mono text-[8px] text-[#00f0ff]/70 pointer-events-none">
              RADAR 360°
            </span>
          </div>

          {/* Quick Action Toggles */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={onOpenGame}
              title="Launch Sector-07 Interceptor 3D Combat Game"
              className="hud-panel p-2.5 rounded-lg text-[#ff007f] hover:bg-[#ff007f]/20 hover:text-white border border-[#ff007f]/50 transition cursor-pointer flex items-center justify-center relative group"
            >
              <Swords className="w-4 h-4" />
              <span className="hidden sm:inline-block absolute right-full mr-2 px-2 py-0.5 rounded bg-slate-900 border border-[#ff007f] text-[9px] font-mono text-[#ff007f] whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                3D COMBAT GAME
              </span>
            </button>

            <button
              onClick={onOpenTerminal}
              title="Open A.U.R.A. AI Tactical Terminal & Vision Synthesis"
              className="hud-panel p-2.5 rounded-lg text-[#00f0ff] hover:bg-[#00f0ff]/20 hover:text-white border border-[#00f0ff]/50 transition cursor-pointer flex items-center justify-center relative group"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline-block absolute right-full mr-2 px-2 py-0.5 rounded bg-slate-900 border border-[#00f0ff] text-[9px] font-mono text-[#00f0ff] whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                AI CO-PILOT TERMINAL
              </span>
            </button>

            <button
              onClick={onToggleAudio}
              title={`Audio: ${audioActive ? 'Active' : 'Muted'}`}
              className="hud-panel p-2.5 rounded-lg text-slate-300 hover:text-[#00f0ff] transition cursor-pointer"
            >
              {audioActive ? (
                <Volume2 className="w-4 h-4 text-[#00f0ff]" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            <button
              onClick={onOpenHelp}
              title="Navigation Manual & Keys"
              className="hud-panel p-2.5 rounded-lg text-slate-300 hover:text-[#ff007f] transition cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              title="Settings & Quality"
              className="hud-panel p-2.5 rounded-lg text-slate-300 hover:text-[#00f0ff] transition cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* CENTER HOLOGRAPHIC NOTIFICATION TOAST      */}
      {/* ========================================== */}
      <div
        id="holo-toast"
        className={`self-center hud-panel px-6 py-2.5 rounded-full border border-[#00f0ff]/50 text-[#00f0ff] font-mono text-xs tracking-wider flex items-center gap-3 transition-all duration-500 pointer-events-none max-w-lg ${
          activeToast
            ? 'opacity-100 transform translate-y-0 box-glow-cyan'
            : 'opacity-0 transform -translate-y-8'
        }`}
      >
        <Radio className="w-4 h-4 text-[#00f0ff] animate-pulse flex-shrink-0" />
        <span className="truncate">{activeToast}</span>
      </div>

      {/* ========================================== */}
      {/* BOTTOM BAR: Flight Guide, Oscilloscope & Modes */}
      {/* ========================================== */}
      <div className="w-full flex flex-col lg:flex-row items-end justify-between gap-4">
        {/* Left: Navigation Controls Cheatsheet */}
        <div className="hud-panel px-4 py-3 rounded-lg text-xs font-mono text-slate-400 space-y-1 pointer-events-auto">
          <div className="text-[10px] text-[#00f0ff] uppercase font-bold tracking-widest flex items-center gap-2">
            <Gamepad2 className="w-3.5 h-3.5" /> FLIGHT CONTROLS
          </div>
          <div className="flex items-center gap-3 text-slate-300 flex-wrap">
            <span>
              <span className="text-[#00f0ff] font-bold">[W / S]</span> THROTTLE
            </span>
            <span>
              <span className="text-[#00f0ff] font-bold">[A / D]</span> STRAFE
            </span>
            <span>
              <span className="text-[#00f0ff] font-bold">[Q / E]</span> VERTICAL
            </span>
            <span>
              <span className="text-[#00f0ff] font-bold">[DRAG]</span> LOOK
            </span>
            <span>
              <span className="text-[#00f0ff] font-bold">[SHIFT]</span> TURBO
            </span>
          </div>
        </div>

        {/* Center: Audio Frequency Visualizer Wave & Oscilloscope */}
        <AudioOscilloscope audioActive={audioActive} onShowToast={onShowToast} />

        {/* Right: Mode Selector */}
        <div className="hud-panel p-1.5 rounded-lg flex items-center gap-1 pointer-events-auto">
          <button
            onClick={() => onSetCameraMode('manual')}
            className={`px-3.5 py-2 rounded font-orbitron text-xs tracking-wider font-semibold transition cursor-pointer ${
              cameraMode === 'manual'
                ? 'bg-[#00f0ff] text-[#030712] font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MANUAL FLIGHT
          </button>

          <button
            onClick={() => onSetCameraMode('guided')}
            className={`px-3.5 py-2 rounded font-orbitron text-xs tracking-wider font-semibold transition cursor-pointer ${
              cameraMode === 'guided'
                ? 'bg-[#00f0ff] text-[#030712] font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AUTONOMOUS CRUISE
          </button>

          <button
            onClick={() => onSetCameraMode('story')}
            className={`px-3.5 py-2 rounded font-orbitron text-xs tracking-wider font-semibold transition cursor-pointer ${
              cameraMode === 'story'
                ? 'bg-[#ff007f] text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            STORY TOUR
          </button>
        </div>
      </div>
    </div>
  );
};
