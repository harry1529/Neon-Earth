import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CITY_LOCATIONS, EASTER_EGGS, STORY_CHAPTERS } from '../data/locations';
import { CameraMode, CityLocation, EasterEgg, TelemetryState } from '../types';

interface CityCanvasProps {
  isEntered: boolean;
  cameraMode: CameraMode;
  currentChapter: number;
  onSelectLocation: (loc: CityLocation) => void;
  onSelectEasterEgg: (egg: EasterEgg) => void;
  onUpdateTelemetry: (telemetry: Partial<TelemetryState>) => void;
  onShowToast: (msg: string) => void;
  graphicsQuality: 'high' | 'medium' | 'low';
}

export const CityCanvas: React.FC<CityCanvasProps> = ({
  isEntered,
  cameraMode,
  currentChapter,
  onSelectLocation,
  onSelectEasterEgg,
  onUpdateTelemetry,
  onShowToast,
  graphicsQuality,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isEnteredRef = useRef(isEntered);
  const cameraModeRef = useRef(cameraMode);
  const currentChapterRef = useRef(currentChapter);

  // Store camera warp/target controls
  const warpTargetPos = useRef<THREE.Vector3 | null>(null);
  const warpTargetLookAt = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    isEnteredRef.current = isEntered;
  }, [isEntered]);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  useEffect(() => {
    currentChapterRef.current = currentChapter;
    if (cameraMode === 'story') {
      const chapter = STORY_CHAPTERS.find((c) => c.id === currentChapter);
      if (chapter) {
        warpTargetPos.current = new THREE.Vector3(...chapter.camPos);
        warpTargetLookAt.current = new THREE.Vector3(...chapter.lookAt);
      }
    }
  }, [currentChapter, cameraMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL Guard & Capabilities check
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Scene, Fog, Camera & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x040817, graphicsQuality === 'low' ? 0.0045 : 0.0032);

    const camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      2500
    );
    // Opening view: panoramic vantage point
    camera.position.set(0, 160, 480);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl && graphicsQuality !== 'low',
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(
      isSoftwareGl || graphicsQuality === 'low'
        ? 1
        : Math.min(window.devicePixelRatio, graphicsQuality === 'medium' ? 1.5 : 2)
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 3. Studio Environment Map (PMREMGenerator + RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x0a1428, 1.8);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    moonLight.position.set(250, 450, -200);
    scene.add(moonLight);

    const cyanCoreLight = new THREE.PointLight(0x00f0ff, 3.8, 650);
    cyanCoreLight.position.set(0, 90, 0);
    scene.add(cyanCoreLight);

    const magentaCoreLight = new THREE.PointLight(0xff007f, 3.2, 550);
    magentaCoreLight.position.set(130, 60, 90);
    scene.add(magentaCoreLight);

    // 5. Procedural Textures (Procedural illuminated window grid canvas texture)
    const createWindowTexture = (): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, 128, 256);

      const rows = 32;
      const cols = 16;
      const w = 128 / cols;
      const h = 256 / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const rand = Math.random();
          if (rand > 0.45) {
            // Lit office window
            if (rand > 0.88) {
              ctx.fillStyle = '#00f0ff'; // Cyan glow window
            } else if (rand > 0.80) {
              ctx.fillStyle = '#ff007f'; // Magenta window
            } else if (rand > 0.72) {
              ctx.fillStyle = '#f59e0b'; // Amber window
            } else {
              ctx.fillStyle = '#a5f3fc'; // Cool white/cyan
            }
            ctx.fillRect(c * w + 1.5, r * h + 1.5, w - 3, h - 3);
          }
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    };

    const windowTexture = createWindowTexture();

    // Procedural Billboard Kanji / Neon Signs Canvas Texture
    const createBillboardTexture = (text: string, subtext: string, color: string): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, 256, 128);

      // Border glow
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 248, 120);

      // Main Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fillText(text, 128, 60);

      // Subtext
      ctx.fillStyle = color;
      ctx.font = '600 16px "JetBrains Mono", monospace';
      ctx.fillText(subtext, 128, 95);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    // Common Materials
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x070c18,
      metalness: 0.85,
      roughness: 0.25,
      map: windowTexture,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.08,
    });

    const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonMagentaMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    const neonAmberMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x0b1324,
      metalness: 0.95,
      roughness: 0.15,
    });

    // 6. Procedural Megacity Grid Generation
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    const gridSize = 16;
    const spacing = 48;
    const offset = (gridSize * spacing) / 2;
    const boxGeom = new THREE.BoxGeometry(1, 1, 1);

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = i * spacing - offset + (Math.random() * 8 - 4);
        const z = j * spacing - offset + (Math.random() * 8 - 4);
        const distCenter = Math.hypot(x, z);

        // Keep Central Spire Plaza and Northern Gate clear
        if (distCenter < 55) continue;
        if (Math.abs(x) < 50 && z < -240) continue;

        // Heights vary dynamically with distance to create natural skyline valley
        let height = 35 + Math.random() * 110;
        if (distCenter < 240) height += 40 + Math.random() * 80;

        const width = 18 + Math.random() * 18;
        const depth = 18 + Math.random() * 18;

        const bldg = new THREE.Mesh(boxGeom, buildingMat);
        bldg.scale.set(width, height, depth);
        bldg.position.set(x, height / 2, z);
        cityGroup.add(bldg);

        // Holographic neon mid-tier bands
        if (Math.random() > 0.42) {
          const bandHeight = 2.0;
          const bandGeom = new THREE.BoxGeometry(width * 1.03, bandHeight, depth * 1.03);
          const bandMat = Math.random() > 0.45 ? neonCyanMat : neonMagentaMat;
          const band = new THREE.Mesh(bandGeom, bandMat);
          band.position.set(x, height * (0.35 + Math.random() * 0.45), z);
          cityGroup.add(band);
        }

        // Rooftop structures & antennas
        if (height > 90) {
          const antHeight = 16 + Math.random() * 30;
          const ant = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.7, antHeight, 6),
            darkMetalMat
          );
          ant.position.set(x, height + antHeight / 2, z);
          cityGroup.add(ant);

          const beacon = new THREE.Mesh(
            new THREE.SphereGeometry(0.9, 8, 8),
            Math.random() > 0.5 ? neonMagentaMat : neonCyanMat
          );
          beacon.position.set(x, height + antHeight, z);
          cityGroup.add(beacon);
        }

        // Rooftop Holographic Billboards on prominent towers
        if (height > 115 && Math.random() > 0.75) {
          const texts = [
            { t: 'NEON // 07', s: 'QUANTUM OS', c: '#00f0ff' },
            { t: 'NEXUS AI', s: 'NEURAL LINK 9', c: '#ff007f' },
            { t: 'CYBER-CORP', s: 'SUB-SECTOR 4', c: '#f59e0b' },
            { t: 'HYPER-DRIVE', s: 'ORBITAL READY', c: '#38bdf8' },
          ];
          const chosen = texts[Math.floor(Math.random() * texts.length)];
          const bTexture = createBillboardTexture(chosen.t, chosen.s, chosen.c);
          const boardGeom = new THREE.PlaneGeometry(16, 8);
          const boardMat = new THREE.MeshBasicMaterial({
            map: bTexture,
            side: THREE.DoubleSide,
            transparent: true,
          });
          const billboard = new THREE.Mesh(boardGeom, boardMat);
          billboard.position.set(x, height + 6, z);
          billboard.rotation.y = (Math.floor(Math.random() * 4) * Math.PI) / 2;
          cityGroup.add(billboard);
        }
      }
    }

    // Reflective Wet Sub-level Ground Grid
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1300, 1300, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x050814,
        roughness: 0.18,
        metalness: 0.88,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    const trafficGrid = new THREE.GridHelper(1100, 44, 0x00f0ff, 0x172554);
    trafficGrid.position.y = 0.6;
    scene.add(trafficGrid);

    // 7. HERO STRUCTURES (Composite 3-12 part groups)

    // A. CENTRAL SPIRE (Citadel Alpha)
    const spireGroup = new THREE.Group();
    // Main tapered tower
    const spireMain = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 22, 320, 12),
      new THREE.MeshStandardMaterial({
        color: 0x0b1324,
        metalness: 0.95,
        roughness: 0.15,
      })
    );
    spireMain.position.y = 160;
    spireGroup.add(spireMain);

    // Glowing orbital rings along spire
    const spireRings: THREE.Mesh[] = [];
    for (let r = 0; r < 5; r++) {
      const ringGeom = new THREE.TorusGeometry(14 + r * 3.5, 0.85, 8, 36);
      const ring = new THREE.Mesh(ringGeom, neonCyanMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 95 + r * 42;
      spireGroup.add(ring);
      spireRings.push(ring);
    }

    // Top apex crown & plasma beacon
    const crown = new THREE.Mesh(new THREE.OctahedronGeometry(6, 0), neonCyanMat);
    crown.position.y = 325;
    spireGroup.add(crown);

    const apexSpire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 1.2, 50, 8),
      darkMetalMat
    );
    apexSpire.position.y = 350;
    spireGroup.add(apexSpire);
    scene.add(spireGroup);

    // B. ORBITAL GATE (Northern Launch Ring)
    const gateGroup = new THREE.Group();
    const gateRing = new THREE.Mesh(
      new THREE.TorusGeometry(65, 3.8, 16, 64),
      neonMagentaMat
    );
    gateRing.position.set(0, 260, -290);
    gateGroup.add(gateRing);

    // Plasma portal disk inside ring
    const portalDisk = new THREE.Mesh(
      new THREE.CircleGeometry(61, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
      })
    );
    portalDisk.position.copy(gateRing.position);
    gateGroup.add(portalDisk);

    // 8 Superconducting node pods attached to gate perimeter
    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      const pod = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 10), darkMetalMat);
      pod.position.set(
        gateRing.position.x + Math.cos(angle) * 65,
        gateRing.position.y + Math.sin(angle) * 65,
        gateRing.position.z
      );
      gateGroup.add(pod);
    }
    scene.add(gateGroup);

    // C. NEURAL DISTRICT (AI Synapse research cloud)
    const neuralGroup = new THREE.Group();
    neuralGroup.position.set(-145, 80, -90);

    const neuralCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(12, 1),
      new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        wireframe: true,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.8,
      })
    );
    neuralGroup.add(neuralCore);

    // Orbiting data nodes
    const neuralNodes: THREE.Mesh[] = [];
    for (let n = 0; n < 8; n++) {
      const nodeMesh = new THREE.Mesh(new THREE.OctahedronGeometry(2.5, 0), neonCyanMat);
      neuralGroup.add(nodeMesh);
      neuralNodes.push(nodeMesh);
    }
    scene.add(neuralGroup);

    // D. UNDERGROUND MARKET BAZAAR CANOPY & HOLOGRAPHIC STALLS
    const marketGroup = new THREE.Group();
    marketGroup.position.set(125, 20, 105);

    for (let m = 0; m < 4; m++) {
      const stall = new THREE.Mesh(
        new THREE.BoxGeometry(14, 8, 14),
        new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.3,
          metalness: 0.7,
        })
      );
      stall.position.set((m % 2) * 20 - 10, 4, Math.floor(m / 2) * 20 - 10);
      marketGroup.add(stall);

      // Neon canopy strip
      const canopy = new THREE.Mesh(
        new THREE.BoxGeometry(15, 1.2, 15),
        m % 2 === 0 ? neonMagentaMat : neonAmberMat
      );
      canopy.position.set((m % 2) * 20 - 10, 8.5, Math.floor(m / 2) * 20 - 10);
      marketGroup.add(canopy);
    }
    scene.add(marketGroup);

    // 8. AUTONOMOUS FLYING VEHICLES (Spinners / Hovercraft)
    const vehicles: {
      mesh: THREE.Group;
      radius: number;
      altitude: number;
      speed: number;
      angle: number;
      lane: number;
    }[] = [];

    const vehicleCount = graphicsQuality === 'low' ? 10 : 20;
    const vHullGeom = new THREE.BoxGeometry(4.2, 1.4, 9);
    const vWingGeom = new THREE.BoxGeometry(7.2, 0.4, 2.5);

    for (let v = 0; v < vehicleCount; v++) {
      const vGroup = new THREE.Group();

      const hull = new THREE.Mesh(vHullGeom, darkMetalMat);
      vGroup.add(hull);

      const wing = new THREE.Mesh(vWingGeom, darkMetalMat);
      wing.position.set(0, -0.2, 0.5);
      vGroup.add(wing);

      // Front Headlight (Cyan)
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.7, 6, 6), neonCyanMat);
      hl.position.set(0, 0, -4.6);
      vGroup.add(hl);

      // Rear Taillight (Magenta)
      const tl = new THREE.Mesh(new THREE.SphereGeometry(0.7, 6, 6), neonMagentaMat);
      tl.position.set(0, 0, 4.6);
      vGroup.add(tl);

      // Trailing Ion Engine Glow (Small cone exhaust)
      const exhaust = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 2.5, 6),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.75 })
      );
      exhaust.rotation.x = Math.PI / 2;
      exhaust.position.set(0, 0, 5.8);
      vGroup.add(exhaust);

      const lane = v % 3;
      const altitude = 45 + lane * 38 + Math.random() * 18;
      const radius = 100 + lane * 65 + Math.random() * 30;
      const speed = (0.28 + Math.random() * 0.35) * (lane % 2 === 0 ? 1 : -1);
      const angle = (v / vehicleCount) * Math.PI * 2;

      vGroup.position.set(Math.cos(angle) * radius, altitude, Math.sin(angle) * radius);
      scene.add(vGroup);

      vehicles.push({
        mesh: vGroup,
        radius,
        altitude,
        speed: speed * 0.016,
        angle,
        lane,
      });
    }

    // 9. ATMOSPHERIC PARTICLES (Floating Cyber Dust / Nanites)
    const particleCount = graphicsQuality === 'low' ? 350 : 800;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount * 3; p += 3) {
      particlePositions[p] = (Math.random() - 0.5) * 850;
      particlePositions[p + 1] = Math.random() * 320;
      particlePositions[p + 2] = (Math.random() - 0.5) * 850;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 2.2,
      transparent: true,
      opacity: 0.65,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // 10. INTERACTIVE DISTRICT DISCOVERY MARKERS
    const markerMeshes: THREE.Group[] = [];
    CITY_LOCATIONS.forEach((loc, idx) => {
      const markerGroup = new THREE.Group();
      markerGroup.position.set(...loc.pos);

      // Rotating faceted diamond
      const diamondMat = idx % 2 === 0 ? neonCyanMat : neonMagentaMat;
      const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(5.2, 0), diamondMat);
      markerGroup.add(diamond);

      // Outer aura ring
      const aura = new THREE.Mesh(new THREE.RingGeometry(6.5, 7.5, 20), diamondMat);
      aura.rotation.x = Math.PI / 2;
      markerGroup.add(aura);

      markerGroup.userData = { type: 'location', locData: loc, diamond, aura };
      scene.add(markerGroup);
      markerMeshes.push(markerGroup);
    });

    // 11. HIDDEN EASTER EGGS IN 3D WORLD
    const easterEggMeshes: THREE.Group[] = [];
    EASTER_EGGS.forEach((egg, idx) => {
      const eggGroup = new THREE.Group();
      eggGroup.position.set(...egg.pos);

      // Unique Easter Egg Shapes
      let eggMesh: THREE.Mesh;
      if (idx === 0) {
        // Recon Drone #404 (small hovering probe)
        eggMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 0), neonAmberMat);
      } else if (idx === 1) {
        // Radio Broadcast Dish
        eggMesh = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.8, 8, 16), neonMagentaMat);
      } else {
        // Cyber Cat Hologram (prism)
        eggMesh = new THREE.Mesh(new THREE.TetrahedronGeometry(3.0, 0), neonCyanMat);
      }
      eggGroup.add(eggMesh);

      const aura = new THREE.Mesh(new THREE.RingGeometry(3.8, 4.4, 16), neonAmberMat);
      aura.rotation.x = Math.PI / 2;
      eggGroup.add(aura);

      eggGroup.userData = { type: 'easteregg', eggData: egg, diamond: eggMesh, aura };
      scene.add(eggGroup);
      easterEggMeshes.push(eggGroup);
    });

    // 12. CAMERA NAVIGATION & USER INPUTS
    const targetPos = new THREE.Vector3().copy(camera.position);
    const currentLookAt = new THREE.Vector3(0, 60, 0);
    const targetLookAt = new THREE.Vector3(0, 60, 0);

    const keys: Record<string, boolean> = {
      w: false,
      a: false,
      s: false,
      d: false,
      q: false,
      e: false,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (keys.hasOwnProperty(k)) {
        keys[k] = true;
      }
      if (k === 'r') {
        // Quick Reset shortcut
        targetPos.set(0, 70, 180);
        targetLookAt.set(0, 70, 0);
        yaw = 0;
        pitch = 0;
        onShowToast('VIEW TELEMETRY RESET TO DEFAULT CORRIDOR');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (keys.hasOwnProperty(k)) keys[k] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mouse Look tracking
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let yaw = 0;
    let pitch = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('#hud-overlay, #intro-screen, #modal-container')) {
        return;
      }
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isEnteredRef.current) {
        // Parallax drift in The Void scene
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        camera.position.x = nx * 80;
        camera.position.y = 160 - ny * 35;
        camera.lookAt(0, 65, 0);
        return;
      }

      if (isMouseDown && cameraModeRef.current === 'manual') {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        yaw -= deltaX * 0.003;
        pitch -= deltaY * 0.003;
        pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!isEnteredRef.current || cameraModeRef.current !== 'manual') return;
      targetPos.y = Math.max(16, Math.min(340, targetPos.y - e.deltaY * 0.09));
    };

    // Touch support for mobile devices
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isEnteredRef.current || cameraModeRef.current !== 'manual' || e.touches.length === 0) return;
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - touchStartX;
      const deltaY = touchY - touchStartY;
      touchStartX = touchX;
      touchStartY = touchY;

      yaw -= deltaX * 0.004;
      pitch -= deltaY * 0.004;
      pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Raycasting for interactive district markers & easter eggs
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('#hud-overlay, #intro-screen, #modal-container')) {
        return;
      }
      if (!isEnteredRef.current) return;

      mouseCoord.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseCoord.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseCoord, camera);

      const allInteractives = [
        ...markerMeshes.map((m) => m.userData.diamond),
        ...easterEggMeshes.map((e) => e.userData.diamond),
      ];
      const intersects = raycaster.intersectObjects(allInteractives, true);

      if (intersects.length > 0) {
        const hitParent = intersects[0].object.parent as THREE.Group;
        if (hitParent?.userData?.type === 'location') {
          onSelectLocation(hitParent.userData.locData);
        } else if (hitParent?.userData?.type === 'easteregg') {
          onSelectEasterEgg(hitParent.userData.eggData);
        }
      }
    };

    window.addEventListener('click', handleClick);

    // 13. MAIN RENDER LOOP & SIMULATION
    const clock = new THREE.Clock();
    let guidedTime = 0;
    let frameCount = 0;
    let lastFpsTime = performance.now();
    let animFrameId = 0;

    const renderLoop = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // FPS and Telemetry calculation
      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 500) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
        frameCount = 0;
        lastFpsTime = now;
        onUpdateTelemetry({
          fps: currentFps,
          altitude: Math.round(camera.position.y),
          heading: Math.round(((yaw % (Math.PI * 2)) + Math.PI * 2) * (180 / Math.PI)) % 360,
        });
      }

      // Animate Vehicles along flight paths
      vehicles.forEach((v) => {
        v.angle += v.speed * delta * 24;
        v.mesh.position.x = Math.cos(v.angle) * v.radius;
        v.mesh.position.z = Math.sin(v.angle) * v.radius;
        v.mesh.rotation.y = -v.angle + (v.speed > 0 ? 0 : Math.PI);
        v.mesh.position.y = v.altitude + Math.sin(time * 2.2 + v.radius) * 1.6;
      });

      // Animate District Markers & Easter Eggs (Rotation & Aura scale)
      markerMeshes.forEach((m, idx) => {
        m.userData.diamond.rotation.y += delta * 1.6;
        m.userData.diamond.rotation.x += delta * 0.9;
        const scale = 1 + Math.sin(time * 3 + idx) * 0.15;
        m.userData.aura.scale.set(scale, scale, scale);
      });

      easterEggMeshes.forEach((m, idx) => {
        m.userData.diamond.rotation.y -= delta * 2.0;
        m.userData.diamond.rotation.z += delta * 1.2;
        const scale = 1 + Math.sin(time * 4 + idx) * 0.2;
        m.userData.aura.scale.set(scale, scale, scale);
      });

      // Animate Spire Rings & Crown
      spireRings.forEach((ring, idx) => {
        ring.rotation.z += delta * (0.2 + idx * 0.05);
      });
      crown.rotation.y += delta * 0.8;
      crown.rotation.z += delta * 0.4;

      // Animate Orbital Gate
      gateRing.rotation.z += delta * 0.22;
      portalDisk.rotation.z -= delta * 0.12;

      // Animate Neural District Nodes
      neuralCore.rotation.y += delta * 0.6;
      neuralCore.rotation.x += delta * 0.3;
      neuralNodes.forEach((node, idx) => {
        const orbitAngle = time * 0.8 + (idx / 8) * Math.PI * 2;
        node.position.set(Math.cos(orbitAngle) * 22, Math.sin(orbitAngle * 2) * 8, Math.sin(orbitAngle) * 22);
      });

      // Particle floating drift
      const positions = particleGeom.attributes.position.array as Float32Array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        positions[i] -= delta * 6;
        if (positions[i] < 0) positions[i] = 300;
      }
      particleGeom.attributes.position.needsUpdate = true;

      // Camera Movement Logic
      if (isEnteredRef.current) {
        if (warpTargetPos.current && warpTargetLookAt.current) {
          // In warp transition (district warp or story chapter transition)
          camera.position.lerp(warpTargetPos.current, 0.05);
          currentLookAt.lerp(warpTargetLookAt.current, 0.05);
          camera.lookAt(currentLookAt);

          if (camera.position.distanceTo(warpTargetPos.current) < 2.0) {
            targetPos.copy(warpTargetPos.current);
            warpTargetPos.current = null;
            warpTargetLookAt.current = null;
          }
        } else if (cameraModeRef.current === 'manual') {
          // Manual Flight Control: WASD + QE + Mouse Pitch/Yaw
          const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
          const strafe = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
          const moveSpeed = (keys.shift ? 130 : 75) * delta;

          if (keys.w) targetPos.addScaledVector(forward, moveSpeed);
          if (keys.s) targetPos.addScaledVector(forward, -moveSpeed);
          if (keys.a) targetPos.addScaledVector(strafe, -moveSpeed);
          if (keys.d) targetPos.addScaledVector(strafe, moveSpeed);
          if (keys.e) targetPos.y = Math.min(320, targetPos.y + moveSpeed * 0.8);
          if (keys.q) targetPos.y = Math.max(16, targetPos.y - moveSpeed * 0.8);

          // Clamped boundaries
          targetPos.x = Math.max(-360, Math.min(360, targetPos.x));
          targetPos.z = Math.max(-360, Math.min(360, targetPos.z));

          camera.position.lerp(targetPos, 0.08);

          const lookDir = new THREE.Vector3(
            -Math.sin(yaw) * Math.cos(pitch),
            Math.sin(pitch),
            -Math.cos(yaw) * Math.cos(pitch)
          );
          currentLookAt.copy(camera.position).add(lookDir.multiplyScalar(120));
          camera.lookAt(currentLookAt);
        } else if (cameraModeRef.current === 'guided') {
          // Autonomous Drone Cruise (Cinematic orbital sweep around Central Spire)
          guidedTime += delta * 0.22;
          const cruiseRadius = 190;
          targetPos.x = Math.cos(guidedTime) * cruiseRadius;
          targetPos.z = Math.sin(guidedTime) * (cruiseRadius * 0.85) + 35;
          targetPos.y = 88 + Math.sin(guidedTime * 2.2) * 36;
          camera.position.lerp(targetPos, 0.05);

          currentLookAt.lerp(new THREE.Vector3(0, 85, 0), 0.05);
          camera.lookAt(currentLookAt);
        } else if (cameraModeRef.current === 'story') {
          // Story mode smooth drift
          guidedTime += delta * 0.08;
          camera.position.x += Math.sin(guidedTime) * 0.2;
          camera.lookAt(currentLookAt);
        }
      }

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [graphicsQuality, onSelectLocation, onSelectEasterEgg, onUpdateTelemetry, onShowToast]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full z-0 cursor-crosshair overflow-hidden"
    />
  );
};
