import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, RotateCcw, X, Shield, Zap, Target, Award, AlertTriangle } from 'lucide-react';
import { audioSystem } from '../services/audioSystem';

interface InterceptorGameProps {
  onExitGame: () => void;
  onShowToast: (msg: string) => void;
}

type GameState = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';

interface EnemyDrone {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  targetPos: THREE.Vector3;
  health: number;
  maxHealth: number;
  speed: number;
  laserTelegraph: THREE.Line;
  shootCooldown: number;
  isAlive: boolean;
}

interface PlayerLaser {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

interface DataOrb {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  collected: boolean;
}

interface SpeedRing {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  radius: number;
  passed: boolean;
}

export const InterceptorGame: React.FC<InterceptorGameProps> = ({
  onExitGame,
  onShowToast,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>('title');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('neon_earth_highscore') || '3500', 10);
  });
  const [shield, setShield] = useState(100);
  const [boost, setBoost] = useState(100);
  const [dronesRemaining, setDronesRemaining] = useState(8);
  const [dataOrbsCollected, setDataOrbsCollected] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [comboMultiplier, setComboMultiplier] = useState(1);

  // References for mutable game loop state (0 React re-renders per frame)
  const gameRef = useRef<{
    state: GameState;
    score: number;
    shield: number;
    boost: number;
    timeRemaining: number;
    multiplier: number;
    cameraShake: number;
    keys: Record<string, boolean>;
    playerPos: THREE.Vector3;
    playerRot: { pitch: number; yaw: number; roll: number };
    playerSpeed: number;
  }>({
    state: 'title',
    score: 0,
    shield: 100,
    boost: 100,
    timeRemaining: 90,
    multiplier: 1,
    cameraShake: 0,
    keys: {},
    playerPos: new THREE.Vector3(0, 75, 160),
    playerRot: { pitch: 0, yaw: 0, roll: 0 },
    playerSpeed: 0,
  });

  const startGame = () => {
    audioSystem.init();
    audioSystem.playWarp();
    gameRef.current.state = 'playing';
    gameRef.current.score = 0;
    gameRef.current.shield = 100;
    gameRef.current.boost = 100;
    gameRef.current.timeRemaining = 90;
    gameRef.current.multiplier = 1;
    gameRef.current.playerPos.set(0, 75, 160);
    gameRef.current.playerRot = { pitch: 0, yaw: 0, roll: 0 };
    setScore(0);
    setShield(100);
    setBoost(100);
    setTimeRemaining(90);
    setComboMultiplier(1);
    setDataOrbsCollected(0);
    setDronesRemaining(8);
    setGameState('playing');
    onShowToast('MISSION LAUNCHED // NEUTRALIZE ROGUE CITADEL DRONES');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Fog & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020612);
    scene.fog = new THREE.FogExp2(0x030718, 0.0035);

    const camera = new THREE.PerspectiveCamera(
      70,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 75, 160);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0a1428, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x00f0ff, 1.4);
    sunLight.position.set(100, 300, 100);
    scene.add(sunLight);

    const redAlertLight = new THREE.PointLight(0xff0055, 3.0, 500);
    redAlertLight.position.set(0, 90, 0);
    scene.add(redAlertLight);

    // 2. City Environment Arena
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    const bldgMat = new THREE.MeshStandardMaterial({
      color: 0x090f1d,
      roughness: 0.25,
      metalness: 0.85,
    });
    const neonCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonRed = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const neonAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    const boxGeom = new THREE.BoxGeometry(1, 1, 1);
    for (let x = -6; x <= 6; x++) {
      for (let z = -6; z <= 6; z++) {
        const posX = x * 50;
        const posZ = z * 50;
        if (Math.hypot(posX, posZ) < 45) continue;

        const h = 40 + Math.random() * 110;
        const w = 20 + Math.random() * 16;
        const d = 20 + Math.random() * 16;

        const bldg = new THREE.Mesh(boxGeom, bldgMat);
        bldg.scale.set(w, h, d);
        bldg.position.set(posX, h / 2, posZ);
        cityGroup.add(bldg);

        if (Math.random() > 0.4) {
          const band = new THREE.Mesh(
            new THREE.BoxGeometry(w * 1.02, 2, d * 1.02),
            Math.random() > 0.5 ? neonCyan : neonRed
          );
          band.position.set(posX, h * 0.5, posZ);
          cityGroup.add(band);
        }
      }
    }

    // Ground Grid
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1200, 1200),
      new THREE.MeshStandardMaterial({ color: 0x040814, roughness: 0.2, metalness: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const grid = new THREE.GridHelper(1000, 40, 0x00f0ff, 0x1e293b);
    grid.position.y = 0.5;
    scene.add(grid);

    // Central Spire obstacle in center
    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 20, 320, 10),
      new THREE.MeshStandardMaterial({ color: 0x0b1324, metalness: 0.9, roughness: 0.15 })
    );
    spire.position.y = 160;
    scene.add(spire);

    // 3. Player Cyber-Interceptor Model (Composite 5-part group attached to camera)
    const playerShip = new THREE.Group();
    // Fuselage
    const hull = new THREE.Mesh(new THREE.ConeGeometry(1.6, 6.5, 5), bldgMat);
    hull.rotation.x = -Math.PI / 2;
    playerShip.add(hull);

    // Swept Wings
    const wings = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.25, 2.8), bldgMat);
    wings.position.set(0, -0.2, 0.5);
    playerShip.add(wings);

    // Twin Laser Cannons
    const cannonLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 6), neonCyan);
    cannonLeft.rotation.x = Math.PI / 2;
    cannonLeft.position.set(-2.6, -0.2, -1);
    playerShip.add(cannonLeft);

    const cannonRight = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 6), neonCyan);
    cannonRight.rotation.x = Math.PI / 2;
    cannonRight.position.set(2.6, -0.2, -1);
    playerShip.add(cannonRight);

    // Ion Thruster exhaust glow
    const thruster = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    thruster.position.set(0, 0, 3.2);
    playerShip.add(thruster);

    scene.add(playerShip);

    // 4. Enemy Rogue Drones (Composite polyhedral hunter drones)
    const enemyDrones: EnemyDrone[] = [];
    const droneGeom = new THREE.OctahedronGeometry(3.5, 0);
    const ringGeom = new THREE.TorusGeometry(4.8, 0.4, 8, 16);

    for (let e = 0; e < 8; e++) {
      const droneGroup = new THREE.Group();
      const body = new THREE.Mesh(droneGeom, neonRed);
      droneGroup.add(body);

      const ring = new THREE.Mesh(ringGeom, bldgMat);
      ring.rotation.x = Math.PI / 2;
      droneGroup.add(ring);

      // Red eye sensor
      const eye = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), neonAmber);
      eye.position.set(0, 0, -2);
      droneGroup.add(eye);

      // Aim telegraph laser line
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -60),
      ]);
      const telegraph = new THREE.Line(
        lineGeom,
        new THREE.LineBasicMaterial({ color: 0xff0055, transparent: true, opacity: 0.6 })
      );
      droneGroup.add(telegraph);

      const angle = (e / 8) * Math.PI * 2;
      const radius = 90 + Math.random() * 80;
      const alt = 50 + Math.random() * 80;
      droneGroup.position.set(Math.cos(angle) * radius, alt, Math.sin(angle) * radius);
      scene.add(droneGroup);

      enemyDrones.push({
        mesh: droneGroup,
        pos: droneGroup.position,
        targetPos: new THREE.Vector3(Math.cos(angle) * radius, alt, Math.sin(angle) * radius),
        health: 100,
        maxHealth: 100,
        speed: 12 + Math.random() * 10,
        laserTelegraph: telegraph,
        shootCooldown: Math.random() * 3,
        isAlive: true,
      });
    }

    // 5. Collectible Quantum Data Orbs
    const dataOrbs: DataOrb[] = [];
    const orbGeom = new THREE.IcosahedronGeometry(2.2, 0);
    for (let o = 0; o < 8; o++) {
      const orbGroup = new THREE.Group();
      const orbMesh = new THREE.Mesh(orbGeom, neonCyan);
      orbGroup.add(orbMesh);

      const aura = new THREE.Mesh(new THREE.RingGeometry(2.8, 3.4, 16), neonCyan);
      aura.rotation.x = Math.PI / 2;
      orbGroup.add(aura);

      const angle = (o / 8) * Math.PI * 2 + 0.4;
      const r = 70 + Math.random() * 75;
      const y = 45 + Math.random() * 70;
      orbGroup.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      scene.add(orbGroup);

      dataOrbs.push({
        mesh: orbGroup,
        pos: orbGroup.position,
        collected: false,
      });
    }

    // 6. Speed Acceleration Rings
    const speedRings: SpeedRing[] = [];
    const ringTorus = new THREE.TorusGeometry(12, 1.2, 8, 32);
    for (let s = 0; s < 4; s++) {
      const ringMesh = new THREE.Mesh(ringTorus, neonAmber);
      const angle = (s / 4) * Math.PI * 2 + 0.8;
      const r = 110;
      const y = 65 + s * 15;
      ringMesh.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      ringMesh.lookAt(0, y, 0);
      scene.add(ringMesh);

      speedRings.push({
        mesh: ringMesh,
        pos: ringMesh.position,
        radius: 12,
        passed: false,
      });
    }

    // 7. Lasers & Particle Pool
    const playerLasers: PlayerLaser[] = [];
    const laserGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
    laserGeom.rotateX(Math.PI / 2);
    const laserMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Explosion Particles Pool
    const explosionGroup = new THREE.Group();
    scene.add(explosionGroup);
    const sparkCount = 120;
    const sparkGeom = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    const sparkVelocities: THREE.Vector3[] = [];
    for (let p = 0; p < sparkCount; p++) {
      sparkPos[p * 3] = 0;
      sparkPos[p * 3 + 1] = -1000;
      sparkPos[p * 3 + 2] = 0;
      sparkVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50
        )
      );
    }
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xff007f,
      size: 3.5,
      transparent: true,
      opacity: 0.9,
    });
    const sparkPoints = new THREE.Points(sparkGeom, sparkMat);
    explosionGroup.add(sparkPoints);

    const triggerExplosionAt = (x: number, y: number, z: number) => {
      audioSystem.playExplosion();
      gameRef.current.cameraShake = 1.2;
      const arr = sparkGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < sparkCount; i++) {
        arr[i * 3] = x;
        arr[i * 3 + 1] = y;
        arr[i * 3 + 2] = z;
        sparkVelocities[i].set(
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 60
        );
      }
      sparkGeom.attributes.position.needsUpdate = true;
    };

    // 8. Input Listeners
    let lastFireTime = 0;

    const fireLasers = () => {
      if (gameRef.current.state !== 'playing') return;
      const now = performance.now();
      if (now - lastFireTime < 180) return; // Fire rate limit
      lastFireTime = now;

      audioSystem.playLaser();

      // Fire from both wingtips
      const forward = new THREE.Vector3(0, 0, -1).applyEuler(playerShip.rotation);
      const right = new THREE.Vector3(1, 0, 0).applyEuler(playerShip.rotation);

      [-2.4, 2.4].forEach((offset) => {
        const lMesh = new THREE.Mesh(laserGeom, laserMat);
        lMesh.position.copy(playerShip.position).addScaledVector(right, offset);
        lMesh.rotation.copy(playerShip.rotation);
        scene.add(lMesh);

        playerLasers.push({
          mesh: lMesh,
          velocity: forward.clone().multiplyScalar(220),
          life: 1.5,
        });
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      gameRef.current.keys[k] = true;

      if (e.code === 'Space') {
        e.preventDefault();
        if (gameRef.current.state === 'title') {
          startGame();
        } else if (gameRef.current.state === 'playing') {
          fireLasers();
        }
      } else if (e.key === 'Enter') {
        if (gameRef.current.state === 'title' || gameRef.current.state === 'gameover' || gameRef.current.state === 'victory') {
          startGame();
        }
      } else if (e.key === 'Escape') {
        if (gameRef.current.state === 'playing') {
          gameRef.current.state = 'paused';
          setGameState('paused');
        } else if (gameRef.current.state === 'paused') {
          gameRef.current.state = 'playing';
          setGameState('playing');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      gameRef.current.keys[k] = false;
    };

    const handlePointerDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, #modal-box')) return;
      if (gameRef.current.state === 'playing') {
        fireLasers();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handlePointerDown);

    // 9. Main 60fps Game Simulation Loop
    const clock = new THREE.Clock();
    let animId = 0;
    let timerAccumulator = 0;

    const gameLoop = () => {
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05); // Frame pacing clamp
      const time = clock.getElapsedTime();

      if (gameRef.current.state === 'playing') {
        // Mission timer countdown
        timerAccumulator += dt;
        if (timerAccumulator >= 1.0) {
          timerAccumulator -= 1.0;
          gameRef.current.timeRemaining = Math.max(0, gameRef.current.timeRemaining - 1);
          setTimeRemaining(gameRef.current.timeRemaining);

          if (gameRef.current.timeRemaining <= 0) {
            // Victory or Survival finished
            audioSystem.playVictory();
            gameRef.current.state = 'victory';
            setGameState('victory');
            if (gameRef.current.score > highScore) {
              setHighScore(gameRef.current.score);
              localStorage.setItem('neon_earth_highscore', String(gameRef.current.score));
            }
          }
        }

        // Boost Energy Recharge / Consumption
        const keys = gameRef.current.keys;
        const isBoosting = keys['shift'] && gameRef.current.boost > 5;
        if (isBoosting) {
          gameRef.current.boost = Math.max(0, gameRef.current.boost - dt * 25);
        } else {
          gameRef.current.boost = Math.min(100, gameRef.current.boost + dt * 15);
        }
        setBoost(Math.round(gameRef.current.boost));

        // Flight Kinematics
        const baseSpeed = isBoosting ? 130 : 65;
        const rotSpeed = 2.4 * dt;

        if (keys['w'] || keys['arrowup']) gameRef.current.playerRot.pitch -= rotSpeed;
        if (keys['s'] || keys['arrowdown']) gameRef.current.playerRot.pitch += rotSpeed;
        if (keys['a'] || keys['arrowleft']) {
          gameRef.current.playerRot.yaw += rotSpeed;
          gameRef.current.playerRot.roll = THREE.MathUtils.damp(gameRef.current.playerRot.roll, 0.5, 8, dt);
        } else if (keys['d'] || keys['arrowright']) {
          gameRef.current.playerRot.yaw -= rotSpeed;
          gameRef.current.playerRot.roll = THREE.MathUtils.damp(gameRef.current.playerRot.roll, -0.5, 8, dt);
        } else {
          gameRef.current.playerRot.roll = THREE.MathUtils.damp(gameRef.current.playerRot.roll, 0, 6, dt);
        }

        // Altitude keys Q/E
        if (keys['q']) gameRef.current.playerPos.y = Math.max(15, gameRef.current.playerPos.y - 45 * dt);
        if (keys['e']) gameRef.current.playerPos.y = Math.min(320, gameRef.current.playerPos.y + 45 * dt);

        // Clamp pitch to avoid disorientation
        gameRef.current.playerRot.pitch = Math.max(-0.8, Math.min(0.8, gameRef.current.playerRot.pitch));

        // Forward motion
        playerShip.rotation.set(
          gameRef.current.playerRot.pitch,
          gameRef.current.playerRot.yaw,
          gameRef.current.playerRot.roll,
          'YXZ'
        );

        const forward = new THREE.Vector3(0, 0, -1).applyEuler(playerShip.rotation);
        gameRef.current.playerPos.addScaledVector(forward, baseSpeed * dt);

        // Boundary Arena Check
        gameRef.current.playerPos.x = Math.max(-340, Math.min(340, gameRef.current.playerPos.x));
        gameRef.current.playerPos.z = Math.max(-340, Math.min(340, gameRef.current.playerPos.z));
        playerShip.position.copy(gameRef.current.playerPos);

        // Third-person chase camera with slight dynamic lag
        const camOffset = new THREE.Vector3(0, 4.2, 16).applyEuler(playerShip.rotation);
        const targetCamPos = playerShip.position.clone().add(camOffset);

        // Camera Shake effect
        if (gameRef.current.cameraShake > 0.01) {
          targetCamPos.x += (Math.random() - 0.5) * gameRef.current.cameraShake * 3;
          targetCamPos.y += (Math.random() - 0.5) * gameRef.current.cameraShake * 3;
          gameRef.current.cameraShake = THREE.MathUtils.damp(gameRef.current.cameraShake, 0, 5, dt);
        }

        camera.position.lerp(targetCamPos, 0.12);
        const lookAhead = playerShip.position.clone().add(forward.clone().multiplyScalar(40));
        camera.lookAt(lookAhead);

        // Update Player Lasers
        for (let l = playerLasers.length - 1; l >= 0; l--) {
          const laser = playerLasers[l];
          laser.mesh.position.addScaledVector(laser.velocity, dt);
          laser.life -= dt;

          // Collision against enemy drones
          let hitEnemy = false;
          for (let e = 0; e < enemyDrones.length; e++) {
            const drone = enemyDrones[e];
            if (!drone.isAlive) continue;

            if (laser.mesh.position.distanceTo(drone.pos) < 6.0) {
              hitEnemy = true;
              drone.health -= 45;
              audioSystem.playPing(1100, 0.15);

              if (drone.health <= 0) {
                drone.isAlive = false;
                scene.remove(drone.mesh);
                triggerExplosionAt(drone.pos.x, drone.pos.y, drone.pos.z);

                const pointsGained = 450 * gameRef.current.multiplier;
                gameRef.current.score += pointsGained;
                setScore(gameRef.current.score);

                const remaining = enemyDrones.filter((d) => d.isAlive).length;
                setDronesRemaining(remaining);

                if (remaining === 0) {
                  // All drones destroyed -> VICTORY!
                  audioSystem.playVictory();
                  gameRef.current.state = 'victory';
                  setGameState('victory');
                  if (gameRef.current.score > highScore) {
                    setHighScore(gameRef.current.score);
                    localStorage.setItem('neon_earth_highscore', String(gameRef.current.score));
                  }
                }
              }
              break;
            }
          }

          if (hitEnemy || laser.life <= 0) {
            scene.remove(laser.mesh);
            playerLasers.splice(l, 1);
          }
        }

        // Update Enemy Drones AI Behavior (Telegraph aim & approach)
        enemyDrones.forEach((drone) => {
          if (!drone.isAlive) return;
          drone.mesh.rotation.y += dt * 1.5;

          // Aim telegraph laser directly at player
          drone.laserTelegraph.lookAt(playerShip.position);

          // Fly towards player if far, evade if close
          const distToPlayer = drone.pos.distanceTo(playerShip.position);
          if (distToPlayer > 30) {
            const dir = playerShip.position.clone().sub(drone.pos).normalize();
            drone.pos.addScaledVector(dir, drone.speed * dt);
          }

          // Drone attack on player
          drone.shootCooldown -= dt;
          if (drone.shootCooldown <= 0 && distToPlayer < 85) {
            drone.shootCooldown = 3.5 + Math.random() * 2;
            audioSystem.playDamage();
            gameRef.current.shield = Math.max(0, gameRef.current.shield - 12);
            setShield(Math.round(gameRef.current.shield));
            gameRef.current.cameraShake = 0.8;

            if (gameRef.current.shield <= 0) {
              // Game Over
              audioSystem.playExplosion();
              gameRef.current.state = 'gameover';
              setGameState('gameover');
            }
          }
        });

        // Collect Quantum Data Orbs
        dataOrbs.forEach((orb) => {
          if (orb.collected) return;
          orb.mesh.rotation.y += dt * 2.5;

          if (playerShip.position.distanceTo(orb.pos) < 7.5) {
            orb.collected = true;
            scene.remove(orb.mesh);
            audioSystem.playPickup();
            gameRef.current.score += 250 * gameRef.current.multiplier;
            gameRef.current.shield = Math.min(100, gameRef.current.shield + 20);
            setScore(gameRef.current.score);
            setShield(Math.round(gameRef.current.shield));
            setDataOrbsCollected((prev) => prev + 1);
            onShowToast('QUANTUM DATA ORB ACQUIRED // +20% SHIELD RESTORED');
          }
        });

        // Speed Acceleration Rings
        speedRings.forEach((ring) => {
          ring.mesh.rotation.z += dt * 0.8;
          if (!ring.passed && playerShip.position.distanceTo(ring.pos) < ring.radius) {
            ring.passed = true;
            audioSystem.playWarp();
            gameRef.current.multiplier += 1;
            gameRef.current.boost = 100;
            setComboMultiplier(gameRef.current.multiplier);
            setBoost(100);
            onShowToast(`SPEED RING BOOST ENGAGED // MULTIPLIER x${gameRef.current.multiplier}`);
            setTimeout(() => {
              ring.passed = false;
            }, 6000);
          }
        });

        // Update Spark Particles
        const sArr = sparkGeom.attributes.position.array as Float32Array;
        for (let i = 0; i < sparkCount; i++) {
          if (sArr[i * 3 + 1] > 0) {
            sArr[i * 3] += sparkVelocities[i].x * dt;
            sArr[i * 3 + 1] += sparkVelocities[i].y * dt;
            sArr[i * 3 + 2] += sparkVelocities[i].z * dt;
            sparkVelocities[i].y -= 9.8 * dt; // Gravity
          }
        }
        sparkGeom.attributes.position.needsUpdate = true;
      } else {
        // Idle cinematic camera orbit on Title Screen or Game Over
        const t = time * 0.2;
        camera.position.set(Math.cos(t) * 160, 95 + Math.sin(t * 2) * 15, Math.sin(t) * 160);
        camera.lookAt(0, 70, 0);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 z-40 w-full h-full bg-[#020612] font-rajdhani select-none overflow-hidden">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Atmospheric Vignette & Scanlines */}
      <div className="scanlines absolute inset-0 pointer-events-none z-10" />

      {/* ======================================================== */}
      {/* 1. TITLE SCREEN / MISSION BRIEFING MODAL                 */}
      {/* ======================================================== */}
      {gameState === 'title' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 sm:p-12 bg-[#020612]/85 backdrop-blur-sm pointer-events-auto">
          {/* Top Title Bar */}
          <div className="w-full flex items-center justify-between text-xs font-mono text-[#00f0ff] uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
              <span>ARCADE COMBAT SIMULATOR // SECTOR-07</span>
            </span>
            <button
              onClick={onExitGame}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>EXIT TO EXPLORATION</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hero Center Lockup */}
          <div className="max-w-xl text-center flex flex-col items-center my-auto">
            {/* Bespoke inline SVG Title Lockup */}
            <div className="w-20 h-20 mb-4 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_#00f0ff]">
                <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="#00f0ff" strokeWidth="3" />
                <polygon points="50,18 82,32 82,68 50,82 18,68 18,32" fill="none" stroke="#ff007f" strokeWidth="2" />
                <path d="M50 25 L50 75 M25 50 L75 50" stroke="#00f0ff" strokeWidth="2" />
                <circle cx="50" cy="50" r="8" fill="#00f0ff" />
              </svg>
            </div>

            <h1 className="font-orbitron text-4xl sm:text-5xl font-black text-white glow-cyan uppercase tracking-wider mb-2">
              INTERCEPTOR <span className="text-[#00f0ff]">PROTOCOL</span>
            </h1>

            <p className="font-mono text-xs text-[#ff007f] tracking-widest uppercase mb-4">
              ROGUE DEFENSE DRONES DETECTED IN CITADEL AIRSPACE
            </p>

            <p className="text-slate-300 font-rajdhani text-base sm:text-lg mb-6 leading-relaxed max-w-md">
              Rogue AI hunter drones have seized the Central Spire airspace. Pilot your Cyber-Interceptor to eliminate 8 rogue drones, retrieve Quantum Data Cores, and boost through acceleration rings!
            </p>

            {/* High Score Card */}
            <div className="p-3 mb-6 rounded bg-slate-950/70 border border-slate-800 flex items-center gap-6 font-mono text-xs">
              <div className="flex items-center gap-2 text-amber-400">
                <Award className="w-4 h-4" />
                <span>HIGH SCORE: <strong className="tabular-nums">{highScore.toLocaleString()}</strong></span>
              </div>
              <div className="text-slate-400">
                TIME LIMIT: <strong className="text-white">90 SECONDS</strong>
              </div>
            </div>

            {/* Start CTA Button */}
            <button
              onClick={startGame}
              className="px-10 py-4 bg-[#00f0ff] text-[#020612] font-orbitron font-bold text-sm tracking-widest uppercase rounded hover:bg-white hover:scale-105 transition box-glow-cyan flex items-center gap-3 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>LAUNCH INTERCEPTOR [SPACE / ENTER]</span>
            </button>
          </div>

          {/* Flat Single Control Hint Line */}
          <div className="text-xs font-mono text-slate-400 tracking-wider">
            WASD Pitch/Yaw · Space / Left-Click Fire Laser · Shift Boost · Q/E Altitude · Esc Pause
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PLAYING LOW-OCCLUSION HUD                             */}
      {/* ======================================================== */}
      {gameState === 'playing' && (
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 sm:p-6 select-none">
          {/* Top Status Cluster */}
          <div className="w-full flex items-start justify-between">
            {/* Shield & Boost Meters */}
            <div className="hud-panel p-3 rounded-lg border border-[#00f0ff]/30 space-y-2 w-52 pointer-events-auto">
              <div>
                <div className="flex justify-between font-mono text-[10px] text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 text-[#00f0ff]">
                    <Shield className="w-3.5 h-3.5" /> SHIELD
                  </span>
                  <span className="tabular-nums font-bold">{shield}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-100 ${
                      shield < 30 ? 'bg-red-500' : 'bg-[#00f0ff]'
                    }`}
                    style={{ width: `${shield}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono text-[10px] text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Zap className="w-3.5 h-3.5" /> AFTERBURNER
                  </span>
                  <span className="tabular-nums font-bold">{boost}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-amber-400 transition-all duration-100"
                    style={{ width: `${boost}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Target Reticle in Center */}
            <div className="self-center flex flex-col items-center">
              <div className="w-10 h-10 border border-[#00f0ff]/40 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full" />
              </div>
            </div>

            {/* Score & Mission Status */}
            <div className="hud-panel p-3 rounded-lg border border-[#00f0ff]/30 text-right pointer-events-auto">
              <div className="text-[10px] font-mono text-slate-400 uppercase">SCORE</div>
              <div className="font-orbitron font-bold text-xl text-[#00f0ff] tabular-nums">
                {score.toLocaleString()}
              </div>
              <div className="flex items-center justify-end gap-3 font-mono text-[11px] mt-1">
                <span className="text-[#ff007f] font-bold">x{comboMultiplier} MULTIPLIER</span>
                <span className="text-slate-400">|</span>
                <span className="text-white tabular-nums font-bold">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Telemetry Cluster */}
          <div className="w-full flex items-end justify-between">
            {/* Targets remaining */}
            <div className="hud-panel px-4 py-2.5 rounded-lg border border-[#ff007f]/40 flex items-center gap-4 text-xs font-mono pointer-events-auto">
              <div className="flex items-center gap-2 text-[#ff007f]">
                <Target className="w-4 h-4" />
                <span>ROGUE DRONES: <strong className="text-white tabular-nums">{dronesRemaining}</strong></span>
              </div>
              <div className="text-slate-600">|</div>
              <div className="flex items-center gap-2 text-[#00f0ff]">
                <span>ORBS COLLECTED: <strong className="text-white tabular-nums">{dataOrbsCollected} / 8</strong></span>
              </div>
            </div>

            {/* Control Reminder */}
            <div className="hud-panel px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-400">
              SPACE / CLICK: FIRE LASERS · SHIFT: BOOST · ESC: PAUSE
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. PAUSED MODAL                                          */}
      {/* ======================================================== */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#020612]/80 backdrop-blur-md">
          <div className="hud-panel max-w-sm w-full p-6 rounded-xl border border-[#00f0ff]/40 text-center space-y-4">
            <h2 className="font-orbitron font-bold text-2xl text-white">SIMULATION PAUSED</h2>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  gameRef.current.state = 'playing';
                  setGameState('playing');
                }}
                className="w-full py-2.5 rounded bg-[#00f0ff] text-[#020612] font-orbitron font-bold text-xs uppercase hover:bg-white transition cursor-pointer"
              >
                RESUME COMBAT
              </button>
              <button
                onClick={startGame}
                className="w-full py-2.5 rounded bg-slate-900 border border-slate-700 text-white font-orbitron text-xs uppercase hover:border-[#00f0ff] transition cursor-pointer"
              >
                RESTART MISSION
              </button>
              <button
                onClick={onExitGame}
                className="w-full py-2.5 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-white font-mono text-xs uppercase transition cursor-pointer"
              >
                EXIT TO EXPLORATION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. VICTORY / MISSION ACCOMPLISHED MODAL                  */}
      {/* ======================================================== */}
      {gameState === 'victory' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#020612]/85 backdrop-blur-md">
          <div className="hud-panel max-w-md w-full p-6 sm:p-8 rounded-xl corner-brackets border border-[#00f0ff] box-glow-cyan text-center">
            <div className="w-14 h-14 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center mx-auto mb-3 text-[#00f0ff]">
              <Award className="w-7 h-7" />
            </div>

            <h2 className="font-orbitron font-black text-2xl sm:text-3xl text-white glow-cyan uppercase tracking-wider mb-2">
              MISSION ACCOMPLISHED!
            </h2>
            <p className="font-mono text-xs text-[#00f0ff] tracking-widest uppercase mb-6">
              CITADEL AIRSPACE LIBERATED // ROGUE DRONES NEUTRALIZED
            </p>

            <div className="grid grid-cols-2 gap-3 p-3 rounded bg-slate-950/70 border border-slate-800 text-xs font-mono mb-6 text-left">
              <div>
                <span className="text-slate-400">FINAL SCORE:</span>
                <div className="font-orbitron font-bold text-lg text-[#00f0ff] tabular-nums">
                  {score.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-slate-400">DATA ORBS:</span>
                <div className="font-orbitron font-bold text-lg text-[#ff007f] tabular-nums">
                  {dataOrbsCollected} / 8
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3 rounded bg-[#00f0ff] text-[#020612] font-orbitron font-bold text-xs uppercase tracking-wider hover:bg-white transition box-glow-cyan cursor-pointer"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={onExitGame}
                className="flex-1 py-3 rounded bg-slate-900 border border-slate-700 text-slate-300 font-orbitron font-bold text-xs uppercase tracking-wider hover:text-white transition cursor-pointer"
              >
                FREE EXPLORE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. GAME OVER / DRONE DESTROYED MODAL                     */}
      {/* ======================================================== */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#020612]/85 backdrop-blur-md">
          <div className="hud-panel max-w-md w-full p-6 sm:p-8 rounded-xl corner-brackets border border-red-500 box-glow-magenta text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center mx-auto mb-3 text-red-500">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="font-orbitron font-black text-2xl sm:text-3xl text-white uppercase tracking-wider mb-2">
              SHIELD COLLAPSE
            </h2>
            <p className="font-mono text-xs text-red-400 tracking-widest uppercase mb-6">
              INTERCEPTOR INTEGRITY ZERO // CRITICAL FAILURE
            </p>

            <div className="p-3 rounded bg-slate-950/70 border border-slate-800 text-xs font-mono mb-6">
              <span className="text-slate-400">SCORE ATTAINED:</span>
              <div className="font-orbitron font-bold text-lg text-white tabular-nums">
                {score.toLocaleString()}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3 rounded bg-red-500 text-white font-orbitron font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-[#020612] transition cursor-pointer"
              >
                RE-ENGAGE [RETRY]
              </button>
              <button
                onClick={onExitGame}
                className="flex-1 py-3 rounded bg-slate-900 border border-slate-700 text-slate-300 font-orbitron font-bold text-xs uppercase tracking-wider hover:text-white transition cursor-pointer"
              >
                RETURN TO CITY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
