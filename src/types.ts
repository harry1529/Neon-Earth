export interface CityLocation {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  pos: [number, number, number];
  camTarget: [number, number, number];
  desc: string;
  stat1Label: string;
  stat1: string;
  stat2Label: string;
  stat2: string;
  stat3Label: string;
  stat3: string;
  securityLevel: string;
  iconName?: string;
}

export interface EasterEgg {
  id: string;
  name: string;
  pos: [number, number, number];
  discoveryMsg: string;
  lore: string;
  bonusEffect: string;
}

export interface StoryChapter {
  id: number;
  title: string;
  subtitle: string;
  narrative: string;
  camPos: [number, number, number];
  lookAt: [number, number, number];
  sector: string;
}

export type CameraMode = 'manual' | 'guided' | 'story';

export interface TelemetryState {
  altitude: number;
  speed: number;
  latency: number;
  fps: number;
  gridPower: string;
  heading: number;
  activeSector: string;
}

export interface AppSettings {
  graphicsQuality: 'high' | 'medium' | 'low';
  audioVolume: number;
  audioMuted: boolean;
  mouseSensitivity: number;
  bloomEnabled: boolean;
  reducedMotion: boolean;
}
