import React, { useEffect, useRef } from 'react';
import { ArrowRight, Play, Sparkles, Volume2, VolumeX, Compass, Swords } from 'lucide-react';
import { audioSystem } from '../services/audioSystem';

interface IntroScreenProps {
  onEnter: (mode: 'manual' | 'guided' | 'story') => void;
  onLaunchGame: () => void;
  audioActive: boolean;
  onToggleAudio: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({
  onEnter,
  onLaunchGame,
  audioActive,
  onToggleAudio,
}) => {
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render live mini oscilloscope canvas inside intro bottom bar
  useEffect(() => {
    let animId = 0;
    let phase = 0;
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderWave = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      phase += 0.05;

      // Center baseline
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const timeDomain = audioSystem.getTimeDomainData();
      ctx.beginPath();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = audioActive ? '#00f0ff' : 'rgba(0, 240, 255, 0.45)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = audioActive ? 6 : 2;

      if (audioActive && timeDomain) {
        const sliceWidth = w / 32;
        let x = 0;
        for (let i = 0; i < 32; i++) {
          const idx = Math.floor((i / 32) * timeDomain.length);
          const v = timeDomain[idx] / 128.0 - 1.0;
          const y = h / 2 + v * (h * 0.45);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
      } else {
        // Idle gentle waveform
        for (let x = 0; x <= w; x += 2) {
          const y = h / 2 + Math.sin(x * 0.16 + phase * 1.4) * (h * 0.28) * Math.cos(phase * 0.5);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(renderWave);
    };

    animId = requestAnimationFrame(renderWave);
    return () => cancelAnimationFrame(animId);
  }, [audioActive]);

  return (
    <div
      id="intro-screen"
      className="absolute inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 md:p-14 bg-[#030712]/92 backdrop-blur-md transition-all duration-1000 select-none"
    >
      {/* Top System Telemetry */}
      <div className="w-full flex items-center justify-between text-xs font-mono tracking-widest text-[#00f0ff]/70 uppercase">
        <div className="flex items-center gap-3">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-ping" />
          <span>SYS.KERNEL // VER 4.09.21 - MATRIX STABLE</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden sm:inline">
            LATENCY: <span className="text-[#00f0ff]">18MS</span>
          </span>
          <span>
            NEURAL LINK: <span className="text-emerald-400">ONLINE</span>
          </span>
        </div>
      </div>

      {/* Center Cinematic Title */}
      <div className="flex flex-col items-center text-center max-w-4xl px-4 my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-6 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff] text-xs font-mono tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
          IMMERSIVE AAA 3D WEB PROTOCOL
        </div>

        <h1 className="font-orbitron text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white glow-cyan uppercase leading-none">
          NEON <span className="text-[#00f0ff]">EARTH</span>
        </h1>

        <p className="font-rajdhani text-lg sm:text-2xl text-slate-300 font-medium tracking-[0.25em] uppercase mt-5 max-w-xl">
          THE FUTURE IS A WORLD YOU CAN ENTER.
        </p>

        {/* Enter CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 flex-wrap justify-center">
          <button
            onClick={() => onEnter('manual')}
            className="group relative px-9 py-4 bg-[#00f0ff] text-[#030712] font-orbitron font-bold tracking-widest text-sm uppercase rounded transition-all duration-300 hover:bg-white hover:scale-105 box-glow-cyan flex items-center gap-3 cursor-pointer"
          >
            <span>ENTER THE CITY</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={onLaunchGame}
            className="px-8 py-4 bg-slate-900/90 border border-[#ff007f] hover:border-white text-white font-orbitron font-bold tracking-wider text-xs uppercase rounded transition-all hover:bg-[#ff007f]/20 box-glow-magenta flex items-center gap-2.5 cursor-pointer"
          >
            <Swords className="w-4 h-4 text-[#ff007f]" />
            <span>PLAY 3D COMBAT GAME</span>
          </button>

          <button
            onClick={() => onEnter('guided')}
            className="px-7 py-4 bg-slate-900/80 border border-slate-700 hover:border-[#ff007f]/70 text-slate-200 font-orbitron tracking-wider text-xs uppercase rounded transition-all hover:text-[#ff007f] hover:bg-slate-900 flex items-center gap-2.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-[#ff007f]" />
            AUTONOMOUS DRONE CRUISE
          </button>

          <button
            onClick={() => onEnter('story')}
            className="px-6 py-4 bg-slate-900/80 border border-slate-700 hover:border-[#00f0ff]/70 text-slate-200 font-orbitron tracking-wider text-xs uppercase rounded transition-all hover:text-[#00f0ff] hover:bg-slate-900 flex items-center gap-2 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[#00f0ff]" />
            STORY CHAPTERS
          </button>
        </div>
      </div>

      {/* Bottom Controls & Hints with Mini Audio Oscilloscope */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={onToggleAudio}
            className="flex items-center gap-2 text-[#00f0ff] hover:text-white transition cursor-pointer"
          >
            {audioActive ? (
              <Volume2 className="w-4 h-4 text-[#00f0ff]" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
            <span>
              SOUND SYNTH: [{audioActive ? 'ONLINE' : 'OFF'}] CLICK TO {audioActive ? 'MUTE' : 'ENABLE'}
            </span>
          </button>

          {/* Mini Oscilloscope Canvas Preview Bar */}
          <div
            className="flex items-center gap-1.5 h-7 px-2.5 py-1 rounded bg-slate-950/90 border border-[#00f0ff]/40 shadow-inner"
            title="Oscilloscope Beam Active"
          >
            <div className="flex items-center gap-1 font-mono text-[9px] text-[#00f0ff]/80 tracking-tighter">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
              <span>OSC</span>
            </div>
            <canvas
              ref={miniCanvasRef}
              width={96}
              height={20}
              className="h-5 w-24 block"
            />
            <span className="text-[8px] font-mono text-[#ff007f]/80 tracking-tight">±1.2V</span>
          </div>

          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline">
            HARDWARE ACCELERATION: <span className="text-[#00f0ff]">DETECTED (WEBGL2)</span>
          </span>
        </div>

        <div className="text-right tracking-widest text-slate-400">
          EXPLORE THE MEGACITY — WASD + MOUSE / ORBIT
        </div>
      </div>
    </div>
  );
};
