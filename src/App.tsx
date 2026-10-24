import React, { useState, useCallback, useEffect } from 'react';
import { CityCanvas } from './components/CityCanvas';
import { IntroScreen } from './components/IntroScreen';
import { CityHUD } from './components/CityHUD';
import { LocationModal } from './components/LocationModal';
import { EasterEggModal } from './components/EasterEggModal';
import { HelpModal } from './components/HelpModal';
import { SettingsModal } from './components/SettingsModal';
import { StoryTourOverlay } from './components/StoryTourOverlay';
import { InterceptorGame } from './components/InterceptorGame';
import { CyberTerminal } from './components/CyberTerminal';
import { audioSystem } from './services/audioSystem';
import { AppSettings, CameraMode, CityLocation, EasterEgg, TelemetryState } from './types';
import { CITY_LOCATIONS } from './data/locations';

export default function App() {
  const [isEntered, setIsEntered] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('manual');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<CityLocation | null>(null);
  const [selectedEasterEgg, setSelectedEasterEgg] = useState<EasterEgg | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [discoveredLocationIds, setDiscoveredLocationIds] = useState<Set<string>>(new Set(['spire']));
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const [toastTimeout, setToastTimeout] = useState<number | null>(null);
  const [audioActive, setAudioActive] = useState(false);

  const [settings, setSettings] = useState<AppSettings>({
    graphicsQuality: 'high',
    audioVolume: 0.16,
    audioMuted: false,
    mouseSensitivity: 1.0,
    bloomEnabled: true,
    reducedMotion: false,
  });

  const [telemetry, setTelemetry] = useState<TelemetryState>({
    altitude: 128,
    speed: 44,
    latency: 18,
    fps: 60,
    gridPower: '14.8 PW',
    heading: 0,
    activeSector: 'SECTOR-07',
  });

  const showToast = useCallback(
    (msg: string) => {
      setActiveToast(msg);
      if (toastTimeout) {
        window.clearTimeout(toastTimeout);
      }
      const id = window.setTimeout(() => {
        setActiveToast(null);
      }, 4200);
      setToastTimeout(id);
    },
    [toastTimeout]
  );

  const handleToggleAudio = useCallback(() => {
    const active = audioSystem.toggle();
    setAudioActive(active);
    if (active) {
      showToast('AUDIO SYNTH ONLINE // 432HZ BLADE RUNNER AMBIENCE');
    } else {
      showToast('AUDIO SYNTH MUTED');
    }
  }, [showToast]);

  const handleEnterCity = (mode: CameraMode) => {
    setIsEntered(true);
    setCameraMode(mode);

    // Auto-init audio on user interaction
    audioSystem.init();
    setAudioActive(true);
    audioSystem.playWarp();

    if (mode === 'guided') {
      showToast('AUTONOMOUS DRONE CRUISE INITIALIZED // ORBITING CENTRAL SPIRE');
    } else if (mode === 'story') {
      showToast('CINEMATIC STORY TOUR ENGAGED // CHAPTER 01 LOADED');
    } else {
      showToast('WELCOME TO NEON EARTH // SECTOR-07 ENTRY VECTOR ESTABLISHED');
    }
  };

  const handleLaunchGame = () => {
    setIsEntered(true);
    audioSystem.init();
    setAudioActive(true);
    setIsGameActive(true);
    showToast('INTERCEPTOR PROTOCOL LAUNCHED // COMBAT STATIONS ENGAGED');
  };

  const handleSelectLocation = useCallback(
    (loc: CityLocation) => {
      setSelectedLocation(loc);
      audioSystem.playPing(720, 0.4);
      setDiscoveredLocationIds((prev) => {
        const next = new Set(prev);
        next.add(loc.id);
        return next;
      });
      showToast(`DOCKING TELEMETRY LINKED WITH ${loc.name}`);
    },
    [showToast]
  );

  const handleSelectEasterEgg = useCallback(
    (egg: EasterEgg) => {
      setSelectedEasterEgg(egg);
      audioSystem.playSecretChord();
      showToast(egg.discoveryMsg);
    },
    [showToast]
  );

  const handleWarpToLocation = (loc: CityLocation) => {
    audioSystem.playWarp();
    showToast(`WARPING TELEMETRY TO ${loc.name}`);
    setTimeout(() => {
      handleSelectLocation(loc);
    }, 1200);
  };

  const handleResetView = () => {
    audioSystem.playPing(960, 0.25);
    showToast('CAMERA GIMBAL & VIEW TELEMETRY SYNCHRONIZED');
  };

  const handleUpdateTelemetry = useCallback((data: Partial<TelemetryState>) => {
    setTelemetry((prev) => ({ ...prev, ...data }));
  }, []);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.audioVolume !== undefined) {
        audioSystem.setVolume(newSettings.audioVolume);
      }
      return updated;
    });
    showToast('SYSTEM CONFIGURATION UPDATED');
  };

  // Keyboard shortcut for toggling terminal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        setIsTerminalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <main className="relative w-screen h-screen bg-[#030712] font-rajdhani overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <CityCanvas
        isEntered={isEntered}
        cameraMode={cameraMode}
        currentChapter={currentChapter}
        onSelectLocation={handleSelectLocation}
        onSelectEasterEgg={handleSelectEasterEgg}
        onUpdateTelemetry={handleUpdateTelemetry}
        onShowToast={showToast}
        graphicsQuality={settings.graphicsQuality}
      />

      {/* Atmospheric Vignette & Scanlines */}
      <div className="scanlines absolute inset-0 z-10 pointer-events-none" />
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#030712]/30 to-[#030712]/90" />

      {/* Scene 1: Opening Void Screen */}
      {!isEntered && (
        <IntroScreen
          onEnter={handleEnterCity}
          onLaunchGame={handleLaunchGame}
          audioActive={audioActive}
          onToggleAudio={handleToggleAudio}
        />
      )}

      {/* Scene 2: Interactive Cyberpunk HUD */}
      {isEntered && !isGameActive && (
        <CityHUD
          telemetry={telemetry}
          cameraMode={cameraMode}
          onSetCameraMode={(mode) => {
            setCameraMode(mode);
            if (mode === 'manual') showToast('MANUAL PILOT ENGAGED // WASD + MOUSE ENABLED');
            else if (mode === 'guided') showToast('AUTONOMOUS DRONE CRUISE INITIALIZED');
            else if (mode === 'story') showToast('CINEMATIC STORY TOUR ENGAGED');
          }}
          onWarpToLocation={handleWarpToLocation}
          onResetView={handleResetView}
          discoveredCount={discoveredLocationIds.size}
          totalLocations={CITY_LOCATIONS.length}
          audioActive={audioActive}
          onToggleAudio={handleToggleAudio}
          onOpenHelp={() => setShowHelp(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenGame={() => setIsGameActive(true)}
          onOpenTerminal={() => setIsTerminalOpen(true)}
          activeToast={activeToast}
          onShowToast={showToast}
        />
      )}

      {/* 3D Arcade Combat Mini-Game: SECTOR-07 INTERCEPTOR PROTOCOL */}
      {isGameActive && (
        <InterceptorGame
          onExitGame={() => {
            setIsGameActive(false);
            showToast('RETURNED TO MEGACITY EXPLORATION');
          }}
          onShowToast={showToast}
        />
      )}

      {/* Story Tour Cinematic Chapter Overlay */}
      {isEntered && !isGameActive && cameraMode === 'story' && (
        <StoryTourOverlay
          currentChapter={currentChapter}
          onSetChapter={(c) => setCurrentChapter(c)}
          onExitStory={() => setCameraMode('manual')}
          onShowToast={showToast}
        />
      )}

      {/* Cyberpunk AI Co-Pilot / Tactical Terminal (A.U.R.A.) */}
      <CyberTerminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onShowToast={showToast}
      />

      {/* Modals Container */}
      <div id="modal-container">
        {selectedLocation && (
          <LocationModal
            location={selectedLocation}
            onClose={() => setSelectedLocation(null)}
            onShowToast={showToast}
          />
        )}

        {selectedEasterEgg && (
          <EasterEggModal
            easterEgg={selectedEasterEgg}
            onClose={() => setSelectedEasterEgg(null)}
            onShowToast={showToast}
          />
        )}

        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

        {showSettings && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </main>
  );
}
