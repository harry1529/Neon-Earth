import React, { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { audioSystem } from '../services/audioSystem';

interface AudioOscilloscopeProps {
  audioActive: boolean;
  onShowToast: (msg: string) => void;
}

export const AudioOscilloscope: React.FC<AudioOscilloscopeProps> = ({
  audioActive,
  onShowToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [vizMode, setVizMode] = useState<'oscilloscope' | 'spectrum'>('oscilloscope');
  const [dbReadout, setDbReadout] = useState('-INF dB');
  const [peakVpp, setPeakVpp] = useState('0.35 Vpp');
  const [phaseAngle, setPhaseAngle] = useState('90.0°');
  const [hzFreq, setHzFreq] = useState('432Hz');

  const toggleVizMode = () => {
    if (vizMode === 'oscilloscope') {
      setVizMode('spectrum');
      onShowToast('AUDIO VISUALIZER: SWITCHED TO FFT SPECTRUM BARS');
    } else {
      setVizMode('oscilloscope');
      onShowToast('AUDIO VISUALIZER: SWITCHED TO OSCILLOSCOPE BEAM');
    }
  };

  useEffect(() => {
    let animId = 0;
    let wavePhase = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      wavePhase += 0.045;

      const timeData = audioSystem.getTimeDomainData();
      const freqData = audioSystem.getFrequencyData();
      const isLive = audioActive && timeData;

      if (isLive) {
        let maxDev = 0;
        for (let i = 0; i < timeData.length; i++) {
          const dev = Math.abs(timeData[i] - 128);
          if (dev > maxDev) maxDev = dev;
        }
        const vpp = (maxDev / 128.0 * 1.45).toFixed(2);
        setPeakVpp(`${vpp} Vpp`);
        setPhaseAngle(`${Math.round(80 + (maxDev / 128) * 45)}°`);
        setDbReadout(`-${Math.max(6, Math.round(36 - (maxDev / 128) * 30))} dB`);
        setHzFreq(`${Math.round(432 + maxDev * 0.8)}Hz`);
      } else {
        setPeakVpp('0.35 Vpp');
        setPhaseAngle('90.0°');
        setDbReadout('-INF dB');
        setHzFreq('432Hz');
      }

      if (vizMode === 'oscilloscope') {
        const points: { x: number; y: number }[] = [];
        const numPoints = 128;
        const sliceWidth = w / (numPoints - 1);

        for (let i = 0; i < numPoints; i++) {
          let y = h / 2;
          if (isLive) {
            const dataIdx = Math.floor((i / numPoints) * timeData.length);
            const v = timeData[dataIdx] / 128.0 - 1.0;
            y = h / 2 + v * (h * 0.42);
          } else {
            const s1 = Math.sin(i * 0.12 + wavePhase * 1.2) * (h * 0.22);
            const s2 = Math.cos(i * 0.28 - wavePhase * 0.8) * (h * 0.08);
            y = h / 2 + (s1 + s2) * Math.sin(wavePhase * 0.4 + 1.2);
          }
          points.push({ x: i * sliceWidth, y });
        }

        // Phosphor afterglow trail
        ctx.beginPath();
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 14;
        points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Primary electron beam
        ctx.beginPath();
        ctx.lineWidth = 2.0;
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.95)');
        grad.addColorStop(0.45, '#00f0ff');
        grad.addColorStop(0.75, '#ff007f');
        grad.addColorStop(1, '#dbfcff');

        ctx.strokeStyle = grad;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // White core line
        ctx.beginPath();
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 0;
        points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Sweeping phosphor dot
        const sweepProgress = (wavePhase * 0.6) % 1;
        const sweepX = sweepProgress * w;
        const sweepIdx = Math.floor(sweepProgress * (points.length - 1));
        const sweepY = points[sweepIdx] ? points[sweepIdx].y : h / 2;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sweepX, sweepY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // FFT Spectrum bars mode
        const barCount = 36;
        const barWidth = w / barCount - 2;

        for (let i = 0; i < barCount; i++) {
          let value = 0.15;
          if (isLive && freqData) {
            const dataIndex = Math.floor((i / barCount) * (freqData.length * 0.75));
            value = (freqData[dataIndex] || 0) / 255;
          } else {
            value = 0.08 + Math.abs(Math.sin(i * 0.35 + wavePhase)) * 0.25;
          }

          const barHeight = Math.max(3, value * (h - 8));
          const x = i * (barWidth + 2) + 2;
          const y = h - barHeight - 2;

          const barGrad = ctx.createLinearGradient(0, y, 0, h);
          if (i < barCount * 0.6) {
            barGrad.addColorStop(0, '#00f0ff');
            barGrad.addColorStop(1, 'rgba(0, 240, 255, 0.15)');
          } else {
            barGrad.addColorStop(0, '#ff007f');
            barGrad.addColorStop(1, 'rgba(255, 0, 127, 0.15)');
          }

          ctx.fillStyle = barGrad;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Top peak luminous cap
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, y, barWidth, 1.5);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [audioActive, vizMode]);

  return (
    <div className="hud-panel p-3.5 rounded-lg corner-brackets pointer-events-auto w-full lg:w-auto max-w-md border border-[#00f0ff]/30 select-none">
      {/* Telemetry Header & Interactive Visualizer Mode Switcher */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#00f0ff]/20 text-[10px] font-mono">
        <div className="flex items-center gap-2 text-[#00f0ff] tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
          <span className="font-bold">OSCILLOSCOPE WAVE //</span>
          <span className="text-white">{hzFreq}</span>
        </div>

        {/* Mode Toggle Button */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 tracking-widest text-[9px]">{dbReadout}</span>
          <button
            onClick={toggleVizMode}
            className="px-2 py-0.5 rounded bg-slate-900 border border-[#00f0ff]/50 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition text-[9px] font-mono flex items-center gap-1 font-semibold cursor-pointer"
            title="Switch Oscilloscope / Spectrum View"
          >
            <Activity className="w-3 h-3 text-[#00f0ff]" />
            <span>MODE: {vizMode.toUpperCase()} [TOGGLE]</span>
          </button>
        </div>
      </div>

      {/* Oscilloscope Screen Canvas with Phosphor Reticle Grid & Scale Calibrations */}
      <div className="relative mt-2 rounded border border-[#00f0ff]/40 overflow-hidden h-20 oscilloscope-screen flex items-center justify-center">
        {/* Phosphor Reticle Grid / Sub-division scale */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundSize: '20px 20px',
            backgroundImage:
              'linear-gradient(to right, rgba(0, 240, 255, 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.25) 1px, transparent 1px)',
          }}
        />

        {/* Horizontal & Vertical Center Crosshairs */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-[#00f0ff]/35 pointer-events-none" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-[#00f0ff]/35 pointer-events-none" />

        {/* Reticle Tick Marks on Axes */}
        <div className="absolute top-1 left-2 font-mono text-[8px] text-[#00f0ff]/70 pointer-events-none">
          +1.5V
        </div>
        <div className="absolute bottom-1 left-2 font-mono text-[8px] text-[#00f0ff]/70 pointer-events-none">
          -1.5V
        </div>
        <div className="absolute top-1 right-2 font-mono text-[8px] text-[#ff007f]/80 pointer-events-none">
          CH-1: AC COUPLING
        </div>
        <div className="absolute bottom-1 right-2 font-mono text-[8px] text-[#00f0ff]/70 pointer-events-none">
          50µs / DIV
        </div>

        {/* Main Wave Canvas */}
        <canvas
          ref={canvasRef}
          width={380}
          height={80}
          className="w-full h-full block relative z-10"
        />
      </div>

      {/* Channel Telemetry and Voltage Scaling Readouts */}
      <div className="grid grid-cols-4 gap-2 mt-2 font-mono text-[9px] text-slate-400">
        <div className="flex flex-col gap-0.5 bg-slate-950/60 p-1.5 rounded border border-slate-800">
          <div className="flex justify-between text-[8px]">
            <span>SWEEP</span>
            <span className="text-[#00f0ff]">50µs</span>
          </div>
          <div className="text-[10px] text-slate-200 font-bold">AUTO-LOCK</div>
        </div>

        <div className="flex flex-col gap-0.5 bg-slate-950/60 p-1.5 rounded border border-slate-800">
          <div className="flex justify-between text-[8px]">
            <span>VOLTAGE</span>
            <span className="text-[#00f0ff]">±1.2V</span>
          </div>
          <div className="text-[10px] text-[#00f0ff] font-bold">{peakVpp}</div>
        </div>

        <div className="flex flex-col gap-0.5 bg-slate-950/60 p-1.5 rounded border border-slate-800">
          <div className="flex justify-between text-[8px]">
            <span>PHASE</span>
            <span className="text-[#ff007f]">Ø-REL</span>
          </div>
          <div className="text-[10px] text-[#ff007f] font-bold">{phaseAngle}</div>
        </div>

        <div className="flex flex-col gap-0.5 bg-slate-950/60 p-1.5 rounded border border-slate-800">
          <div className="flex justify-between text-[8px]">
            <span>BEAM</span>
            <span className="text-emerald-400">PHOSPHOR</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-bold">
            {audioActive ? 'CALIBRATED' : 'STANDBY'}
          </div>
        </div>
      </div>
    </div>
  );
};
