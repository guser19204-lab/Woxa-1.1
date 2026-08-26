import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GameState, RelicItem, CuratorNote, HidingSpot, MuseumWing } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { WINGS_INFO } from '../data/museumData';

interface MuseumCanvasProps {
  gameState: GameState;
  flashlightOn: boolean;
  flashlightFlickering: boolean;
  isHiding: boolean;
  relics: RelicItem[];
  notes: CuratorNote[];
  hidingSpots: HidingSpot[];
  activeWing: MuseumWing;
  onWingChange: (wing: MuseumWing) => void;
  onNearRelic: (relic: RelicItem | null) => void;
  onNearNote: (note: CuratorNote | null) => void;
  onNearHidingSpot: (spot: HidingSpot | null) => void;
  onTriggerPresence: () => void;
  onTriggerGlassBreak: () => void;
  onMonsterCaught: () => void;
  monsterProximity: number; // 0 to 1
  virtualMove: { x: number; y: number };
  virtualLook: { x: number; y: number };
}

interface GlassShardParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotVelocity: THREE.Vector3;
  life: number;
}

export const MuseumCanvas: React.FC<MuseumCanvasProps> = ({
  gameState,
  flashlightOn,
  flashlightFlickering,
  isHiding,
  relics,
  notes,
  hidingSpots,
  activeWing,
  onWingChange,
  onNearRelic,
  onNearNote,
  onNearHidingSpot,
  onTriggerPresence,
  onTriggerGlassBreak,
  onMonsterCaught,
  monsterProximity,
  virtualMove,
  virtualLook
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mouseLook = useRef<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });
  const isPointerLocked = useRef<boolean>(false);
  const playerPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.7, 8)); // Starting in Grand Vestibule
  const playerVelocity = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const footstepTimer = useRef<number>(0);
  const shardsRef = useRef<GlassShardParticle[]>([]);
  const monsterRef = useRef<THREE.Group | null>(null);
  const monsterPos = useRef<THREE.Vector3>(new THREE.Vector3(-25, 1.8, -20));
  const monsterTargetWing = useRef<MuseumWing>('antiquities');
  const dustParticlesRef = useRef<THREE.Points | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const flashlightRef = useRef<THREE.SpotLight | null>(null);
  const flashlightTargetRef = useRef<THREE.Object3D | null>(null);
  const vitrinesRef = useRef<{ id: string; mesh: THREE.Group; broken: boolean; pos: THREE.Vector3 }[]>([]);

  // Track user input for freeze presence mechanic violation check in parent
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205);
    scene.fog = new THREE.FogExp2(0x020205, 0.045);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 100);
    camera.position.set(0, 1.7, 8);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient Eerie Moon/Shadow Light (Very dim)
    const ambientLight = new THREE.AmbientLight(0x0a0c16, 0.25);
    scene.add(ambientLight);

    // Skylight directional cold blue moonlight
    const moonLight = new THREE.DirectionalLight(0x1a264a, 0.35);
    moonLight.position.set(0, 20, 0);
    scene.add(moonLight);

    // Player Flashlight (SpotLight)
    const spotLight = new THREE.SpotLight(0xfff3d6, 3.8, 28, Math.PI / 5, 0.45, 1.5);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.bias = -0.001;
    scene.add(spotLight);
    flashlightRef.current = spotLight;

    const spotTarget = new THREE.Object3D();
    scene.add(spotTarget);
    spotLight.target = spotTarget;
    flashlightTargetRef.current = spotTarget;

    // ----------------------------------------------------
    // PROCEDURAL MUSEUM ARCHITECTURE BUILDER
    // ----------------------------------------------------
    buildMuseumEnvironment(scene, vitrinesRef);

    // Build Atmospheric Floating Dust Particles
    const dustCount = 600;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 80;
      dustPositions[i + 1] = Math.random() * 6;
      dustPositions[i + 2] = (Math.random() - 0.5) * 80;
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0xcccccc,
      size: 0.06,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustPoints);
    dustParticlesRef.current = dustPoints;

    // Build Monster Specter Model
    const monsterGroup = buildMonsterSpecter();
    monsterGroup.position.copy(monsterPos.current);
    scene.add(monsterGroup);
    monsterRef.current = monsterGroup;

    // Window resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Pointer Lock controls for immersive looking
    const domElement = renderer.domElement;
    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === domElement;
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;
      const sensitivity = 0.0022;
      mouseLook.current.yaw -= e.movementX * sensitivity;
      mouseLook.current.pitch -= e.movementY * sensitivity;
      // Clamp pitch so camera doesn't flip
      mouseLook.current.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, mouseLook.current.pitch));
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Main Game Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let glassBreakCheckTimer = 0;
    let presenceCheckTimer = 0;

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!cameraRef.current || !sceneRef.current || !rendererRef.current) return;

      // Handle Mobile Touch Virtual Look
      if (virtualLook.x !== 0 || virtualLook.y !== 0) {
        mouseLook.current.yaw -= virtualLook.x * 2.2 * delta;
        mouseLook.current.pitch -= virtualLook.y * 2.2 * delta;
        mouseLook.current.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, mouseLook.current.pitch));
      }

      // Camera Rotation
      cameraRef.current.rotation.order = 'YXZ';
      cameraRef.current.rotation.y = mouseLook.current.yaw;
      cameraRef.current.rotation.x = mouseLook.current.pitch;

      // Player Movement (only when playing and not hiding)
      if (gameState === 'playing' && !isHiding) {
        const moveSpeed = 4.2 * delta;
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), mouseLook.current.yaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), mouseLook.current.yaw);

        const moveDir = new THREE.Vector3();
        if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) moveDir.add(forward);
        if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) moveDir.sub(forward);
        if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) moveDir.add(right);
        if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) moveDir.sub(right);

        // Virtual joystick support
        if (virtualMove.y !== 0) moveDir.add(forward.clone().multiplyScalar(-virtualMove.y));
        if (virtualMove.x !== 0) moveDir.add(right.clone().multiplyScalar(virtualMove.x));

        if (moveDir.lengthSq() > 0) {
          moveDir.normalize();
          playerVelocity.current.lerp(moveDir.multiplyScalar(moveSpeed), 0.2);
          
          // Footstep audio pacing
          footstepTimer.current += delta;
          if (footstepTimer.current > 0.48) {
            audioEngine.playFootstep();
            footstepTimer.current = 0;
          }
        } else {
          playerVelocity.current.lerp(new THREE.Vector3(), 0.25);
        }

        // Apply new position with collision boundary limits
        const newX = playerPos.current.x + playerVelocity.current.x;
        const newZ = playerPos.current.z + playerVelocity.current.z;

        // Bounding box collision for the entire museum cross-floor plan
        if (checkWalkable(newX, newZ)) {
          playerPos.current.x = newX;
          playerPos.current.z = newZ;
        }

        // Subtle head-bobbing
        const isMoving = playerVelocity.current.length() > 0.01;
        const bob = isMoving ? Math.sin(time * 0.008) * 0.05 : Math.sin(time * 0.002) * 0.015;
        cameraRef.current.position.set(playerPos.current.x, 1.7 + bob, playerPos.current.z);
      } else if (isHiding) {
        // Lower camera height for crouching/hiding
        cameraRef.current.position.set(playerPos.current.x, 0.75 + Math.sin(time * 0.001) * 0.01, playerPos.current.z);
      }

      // Update Flashlight position and direction
      if (flashlightRef.current && flashlightTargetRef.current) {
        // Flashlight follows camera with subtle realistic inertia lag
        const flashOffset = new THREE.Vector3(0.2, -0.2, -0.3).applyQuaternion(cameraRef.current.quaternion);
        flashlightRef.current.position.copy(cameraRef.current.position).add(flashOffset);

        const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraRef.current.quaternion);
        flashlightTargetRef.current.position.copy(cameraRef.current.position).add(lookDir.multiplyScalar(10));

        // Flashlight intensity & flickering behavior
        if (!flashlightOn) {
          flashlightRef.current.intensity = 0;
        } else if (flashlightFlickering) {
          // Violent irregular flicker
          const flickerRand = Math.random();
          if (flickerRand > 0.6) {
            flashlightRef.current.intensity = Math.random() * 4.5;
            flashlightRef.current.color.setHex(0xffaa44);
            if (Math.random() < 0.12) audioEngine.playFlashlightFlicker();
          } else {
            flashlightRef.current.intensity = 0.05;
          }
        } else {
          // Standard steady beam with slight natural filament pulse
          flashlightRef.current.intensity = 3.5 + Math.sin(time * 0.01) * 0.15;
          flashlightRef.current.color.setHex(0xfff3d6);
        }
      }

      // Update Monster Movement and Stalking AI
      if (monsterRef.current && (gameState === 'playing' || gameState === 'hiding')) {
        updateMonsterAI(delta, time, playerPos.current, monsterPos.current, monsterRef.current, isHiding, onMonsterCaught);
      }

      // Animate Glass Shards Particle Physics
      updateGlassShards(delta);

      // Animate Dust Particles
      if (dustParticlesRef.current) {
        const positions = dustParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < dustPositions.length; i += 3) {
          positions[i] += Math.sin(time * 0.001 + i) * 0.003;
        }
        dustParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Determine Current Museum Wing
      const curWing = detectWing(playerPos.current.x, playerPos.current.z);
      if (curWing !== activeWing) {
        onWingChange(curWing);
      }

      // Proximity Checks for Relics, Notes, Hiding Spots
      checkProximities(playerPos.current, relics, notes, hidingSpots, onNearRelic, onNearNote, onNearHidingSpot);

      // Random Horror Event Generators during gameplay
      if (gameState === 'playing' && !isHiding) {
        glassBreakCheckTimer += delta;
        presenceCheckTimer += delta;

        // Occasional glass breaking trigger (every ~45-75 seconds or random check)
        if (glassBreakCheckTimer > 35) {
          if (Math.random() < 0.02) {
            triggerNearbyGlassShatter(playerPos.current, vitrinesRef, shardsRef, sceneRef.current);
            onTriggerGlassBreak();
            glassBreakCheckTimer = 0;
          }
        }

        // Random "Presence Behind You" trigger
        if (presenceCheckTimer > 50) {
          if (Math.random() < 0.015) {
            onTriggerPresence();
            presenceCheckTimer = 0;
          }
        }
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      if (rendererRef.current && rendererRef.current.domElement && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Sync state changes with Three.js objects
  useEffect(() => {
    if (gameState === 'intro') {
      playerPos.current.set(0, 1.7, 8);
      mouseLook.current = { yaw: 0, pitch: 0 };
    }
  }, [gameState]);

  const requestPointerLock = () => {
    if (rendererRef.current?.domElement && !document.pointerLockElement) {
      rendererRef.current.domElement.requestPointerLock();
    }
  };

  return (
    <div
      ref={containerRef}
      id="museum-viewport"
      onClick={requestPointerLock}
      className="relative w-full h-full cursor-crosshair overflow-hidden select-none"
    >
      {/* Subtle CRT / Security Scanline and vignette overlay for realism */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.85)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-15 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.4)_0px,rgba(0,0,0,0.4)_1px,transparent_1px,transparent_2px)]" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS: COLLISION, WING DETECTION, MONSTER AI & ENVIRONMENT BUILD
// ---------------------------------------------------------------------------

function checkWalkable(x: number, z: number): boolean {
  // Center cross corridor layout
  // Atrium: x: [-12, 12], z: [-12, 12]
  // Antiquities (West): x: [-36, -12], z: [-7, 7]
  // Curio (East): x: [12, 36], z: [-7, 7]
  // Archive (North): x: [-7, 7], z: [12, 36]
  // Sanctum (South): x: [-7, 7], z: [-36, -12]

  const inAtrium = x >= -12 && x <= 12 && z >= -12 && z <= 12;
  const inAntiquities = x >= -36 && x <= -12 && z >= -7 && z <= 7;
  const inCurio = x >= 12 && x <= 36 && z >= -7 && z <= 7;
  const inArchive = x >= -7 && x <= 7 && z >= 12 && z <= 36;
  const inSanctum = x >= -7 && x <= 7 && z >= -36 && z <= -12;

  return inAtrium || inAntiquities || inCurio || inArchive || inSanctum;
}

function detectWing(x: number, z: number): MuseumWing {
  if (x < -12) return 'antiquities';
  if (x > 12) return 'curio';
  if (z > 12) return 'archive';
  if (z < -12) return 'sanctum';
  return 'atrium';
}

function checkProximities(
  pos: THREE.Vector3,
  relics: RelicItem[],
  notes: CuratorNote[],
  hidingSpots: HidingSpot[],
  onNearRelic: (r: RelicItem | null) => void,
  onNearNote: (n: CuratorNote | null) => void,
  onNearHidingSpot: (s: HidingSpot | null) => void
) {
  // Check uncollected relics
  let nearR: RelicItem | null = null;
  for (const r of relics) {
    if (!r.isCollected) {
      const dist = Math.hypot(pos.x - r.position[0], pos.z - r.position[2]);
      if (dist < 2.5) {
        nearR = r;
        break;
      }
    }
  }
  onNearRelic(nearR);

  // Check unread notes
  let nearN: CuratorNote | null = null;
  for (const n of notes) {
    const dist = Math.hypot(pos.x - n.position[0], pos.z - n.position[2]);
    if (dist < 2.2) {
      nearN = n;
      break;
    }
  }
  onNearNote(nearN);

  // Check hiding spots
  let nearH: HidingSpot | null = null;
  for (const h of hidingSpots) {
    const dist = Math.hypot(pos.x - h.position[0], pos.z - h.position[2]);
    if (dist < 3.0) {
      nearH = h;
      break;
    }
  }
  onNearHidingSpot(nearH);
}

function updateMonsterAI(
  delta: number,
  time: number,
  playerPos: THREE.Vector3,
  monsterPos: THREE.Vector3,
  monsterMesh: THREE.Group,
  isHiding: boolean,
  onCaught: () => void
) {
  const distToPlayer = monsterPos.distanceTo(playerPos);

  // Tension level audio control
  const dangerLevel = Math.max(0, Math.min(1, 1 - distToPlayer / 25));
  audioEngine.setTensionLevel(dangerLevel);
  if (dangerLevel > 0.5) {
    audioEngine.setHeartbeatState(true, 80 + dangerLevel * 60);
  } else {
    audioEngine.setHeartbeatState(false);
  }

  // Floating hover animation
  monsterMesh.position.y = 1.6 + Math.sin(time * 0.003) * 0.25;

  // Monster movement logic
  if (!isHiding && distToPlayer < 22) {
    // Aggressive pursuit when player is unhidden and in detection radius
    const chaseDir = new THREE.Vector3().subVectors(playerPos, monsterPos).normalize();
    monsterPos.add(chaseDir.multiplyScalar(2.6 * delta));
    monsterMesh.position.x = monsterPos.x;
    monsterMesh.position.z = monsterPos.z;
    monsterMesh.lookAt(playerPos.x, monsterMesh.position.y, playerPos.z);

    // Caught trigger (Permadeath Jumpscare)
    if (distToPlayer < 1.8) {
      onCaught();
    }
  } else {
    // Idle patrol / drifting through museum
    const patrolSpeed = 1.2 * delta;
    const wanderX = Math.sin(time * 0.0008) * 18;
    const wanderZ = Math.cos(time * 0.0006) * 18;
    const wanderTarget = new THREE.Vector3(wanderX, 1.8, wanderZ);

    const patrolDir = new THREE.Vector3().subVectors(wanderTarget, monsterPos).normalize();
    monsterPos.add(patrolDir.multiplyScalar(patrolSpeed));
    monsterMesh.position.x = monsterPos.x;
    monsterMesh.position.z = monsterPos.z;
    monsterMesh.lookAt(wanderTarget.x, monsterMesh.position.y, wanderTarget.z);
  }
}

function updateGlassShards(delta: number) {
  // Update falling/spinning glass fragments
}

function triggerNearbyGlassShatter(
  playerPos: THREE.Vector3,
  vitrinesRef: React.MutableRefObject<{ id: string; mesh: THREE.Group; broken: boolean; pos: THREE.Vector3 }[]>,
  shardsRef: React.MutableRefObject<GlassShardParticle[]>,
  scene: THREE.Scene
) {
  audioEngine.playGlassBreak();

  // Find nearest unbroken glass vitrine
  const unbroken = vitrinesRef.current.filter((v) => !v.broken);
  if (unbroken.length > 0) {
    // Sort by proximity
    unbroken.sort((a, b) => a.pos.distanceTo(playerPos) - b.pos.distanceTo(playerPos));
    const targetVitrine = unbroken[0];
    targetVitrine.broken = true;

    // Explode glass shards
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x99ddff,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.9
    });

    for (let i = 0; i < 25; i++) {
      const shardGeo = new THREE.ConeGeometry(0.1 + Math.random() * 0.15, 0.2 + Math.random() * 0.25, 3);
      const shard = new THREE.Mesh(shardGeo, glassMaterial);
      shard.position.copy(targetVitrine.pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 1.2,
        1.0 + Math.random() * 0.8,
        (Math.random() - 0.5) * 1.2
      ));
      scene.add(shard);

      shardsRef.current.push({
        mesh: shard,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 3 + 1,
          (Math.random() - 0.5) * 4
        ),
        rotVelocity: new THREE.Vector3(
          Math.random() * 8,
          Math.random() * 8,
          Math.random() * 8
        ),
        life: 4.0
      });
    }
  }
}

// ---------------------------------------------------------------------------
// PROCEDURAL ARCHITECTURE BUILDER
// ---------------------------------------------------------------------------

function buildMuseumEnvironment(
  scene: THREE.Scene,
  vitrinesRef: React.MutableRefObject<{ id: string; mesh: THREE.Group; broken: boolean; pos: THREE.Vector3 }[]>
) {
  // Shared Materials
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x14161d,
    roughness: 0.25,
    metalness: 0.4
  });

  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x08090d,
    roughness: 0.9
  });

  const stoneWallMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f242e,
    roughness: 0.8
  });

  const antiqueWoodMaterial = new THREE.MeshStandardMaterial({
    color: 0x22130c,
    roughness: 0.6
  });

  const marbleColumnMaterial = new THREE.MeshStandardMaterial({
    color: 0x474c59,
    roughness: 0.35,
    metalness: 0.2
  });

  const goldAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.85,
    roughness: 0.2
  });

  // 1. FLOOR & CEILING
  const floorGeo = new THREE.PlaneGeometry(100, 100);
  const floor = new THREE.Mesh(floorGeo, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceiling = new THREE.Mesh(floorGeo, ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 5.5;
  scene.add(ceiling);

  // 2. WALLS & CORRIDORS
  buildWalls(scene, stoneWallMaterial);

  // 3. ARCHED COLUMNS & PEDESTALS (Grand Atrium)
  const colPositions = [
    [-6, 0, -6], [6, 0, -6], [-6, 0, 6], [6, 0, 6],
    [-10, 0, 0], [10, 0, 0], [0, 0, -10], [0, 0, 10]
  ];
  colPositions.forEach(([x, y, z]) => {
    const colGeo = new THREE.CylinderGeometry(0.5, 0.6, 5.5, 16);
    const col = new THREE.Mesh(colGeo, marbleColumnMaterial);
    col.position.set(x, 2.75, z);
    col.castShadow = true;
    col.receiveShadow = true;
    scene.add(col);

    const baseGeo = new THREE.BoxGeometry(1.4, 0.4, 1.4);
    const base = new THREE.Mesh(baseGeo, marbleColumnMaterial);
    base.position.set(x, 0.2, z);
    scene.add(base);
  });

  // 4. DISPLAY CASES (VITRINES) ACROSS WINGS
  const vitrineConfigs = [
    { id: 'v-anti-1', pos: new THREE.Vector3(-26, 0, 0), wing: 'antiquities', relic: 'The Ankh' },
    { id: 'v-anti-2', pos: new THREE.Vector3(-22, 0, 8), wing: 'antiquities', relic: 'The Canopic Urn' },
    { id: 'v-anti-3', pos: new THREE.Vector3(-30, 0, -4), wing: 'antiquities', relic: 'Scarab Amulet' },
    { id: 'v-curio-1', pos: new THREE.Vector3(26, 0, 0), wing: 'curio', relic: 'The Glass Eye' },
    { id: 'v-curio-2', pos: new THREE.Vector3(22, 0, -8), wing: 'curio', relic: 'Taxidermy Raven' },
    { id: 'v-curio-3', pos: new THREE.Vector3(30, 0, 6), wing: 'curio', relic: 'Spirit Bell' },
    { id: 'v-arch-1', pos: new THREE.Vector3(0, 0, 26), wing: 'archive', relic: 'The Codex' },
    { id: 'v-sanc-1', pos: new THREE.Vector3(0, 0, -26), wing: 'sanctum', relic: 'Sanctum Keystone' }
  ];

  vitrineConfigs.forEach((cfg) => {
    const vitrineGroup = buildGlassVitrine(goldAccentMaterial, antiqueWoodMaterial);
    vitrineGroup.position.copy(cfg.pos);
    scene.add(vitrineGroup);
    vitrinesRef.current.push({
      id: cfg.id,
      mesh: vitrineGroup,
      broken: false,
      pos: cfg.pos
    });
  });

  // 5. ANTIQUE PAINTINGS WITH OBSERVING EYES
  buildCreepyPaintings(scene, antiqueWoodMaterial);

  // 6. SARCOPHAGUS & EGYPTIAN OBELISKS (Antiquities Wing)
  const sarcophagus = buildSarcophagus(goldAccentMaterial);
  sarcophagus.position.set(-26, 0, -6);
  scene.add(sarcophagus);

  // 7. CURATOR OAK DESK & ARCHIVAL BOOKSHELVES (Archive Wing)
  buildArchivalStacks(scene, antiqueWoodMaterial);

  // 8. MASTER LOCKED GATE (Atrium South Exit)
  const gate = buildMasterGate();
  gate.position.set(0, 0, 12);
  scene.add(gate);
}

function buildWalls(scene: THREE.Scene, wallMat: THREE.Material) {
  const wallConfigs = [
    // Outer perimeter bounding walls
    { size: [2, 5.5, 48], pos: [-38, 2.75, 0] }, // Far West
    { size: [2, 5.5, 48], pos: [38, 2.75, 0] },  // Far East
    { size: [48, 5.5, 2], pos: [0, 2.75, 38] },  // Far North
    { size: [48, 5.5, 2], pos: [0, 2.75, -38] }, // Far South

    // Corridor dividers creating the 5 wings
    { size: [24, 5.5, 2], pos: [-26, 2.75, 8] },
    { size: [24, 5.5, 2], pos: [-26, 2.75, -8] },
    { size: [24, 5.5, 2], pos: [26, 2.75, 8] },
    { size: [24, 5.5, 2], pos: [26, 2.75, -8] },
    { size: [2, 5.5, 24], pos: [8, 2.75, 26] },
    { size: [2, 5.5, 24], pos: [-8, 2.75, 26] },
    { size: [2, 5.5, 24], pos: [8, 2.75, -26] },
    { size: [2, 5.5, 24], pos: [-8, 2.75, -26] }
  ];

  wallConfigs.forEach((w) => {
    const geo = new THREE.BoxGeometry(w.size[0], w.size[1], w.size[2]);
    const mesh = new THREE.Mesh(geo, wallMat);
    mesh.position.set(w.pos[0], w.pos[1], w.pos[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  });
}

function buildGlassVitrine(goldMat: THREE.Material, woodMat: THREE.Material): THREE.Group {
  const group = new THREE.Group();

  // Wooden base pedestal
  const baseGeo = new THREE.BoxGeometry(1.2, 0.9, 1.2);
  const base = new THREE.Mesh(baseGeo, woodMat);
  base.position.y = 0.45;
  base.castShadow = true;
  group.add(base);

  // Velvet cushion inside
  const cushionGeo = new THREE.BoxGeometry(0.9, 0.08, 0.9);
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0x550a12, roughness: 0.8 });
  const cushion = new THREE.Mesh(cushionGeo, cushionMat);
  cushion.position.y = 0.94;
  group.add(cushion);

  // Glass Case (Transparent Physical Material)
  const glassGeo = new THREE.BoxGeometry(1.05, 0.9, 1.05);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xddeeff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.85
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.y = 1.4;
  group.add(glass);

  // Brass Corner Trim
  const trimGeo = new THREE.BoxGeometry(1.1, 0.04, 1.1);
  const trim = new THREE.Mesh(trimGeo, goldMat);
  trim.position.y = 1.86;
  group.add(trim);

  // Glowing relic visual placeholder inside
  const relicGeo = new THREE.OctahedronGeometry(0.18, 0);
  const relicMat = new THREE.MeshStandardMaterial({
    color: 0xffcc33,
    emissive: 0x996611,
    roughness: 0.2
  });
  const relicMesh = new THREE.Mesh(relicGeo, relicMat);
  relicMesh.position.y = 1.15;
  group.add(relicMesh);

  return group;
}

function buildCreepyPaintings(scene: THREE.Scene, frameMat: THREE.Material) {
  const paintingConfigs = [
    { pos: [14, 2.6, 4], rot: -Math.PI / 2, title: 'Portrait of Lord Blackwood' },
    { pos: [14, 2.6, -4], rot: -Math.PI / 2, title: 'The Weeping Lady of 1882' },
    { pos: [-14, 2.6, 4], rot: Math.PI / 2, title: 'The Shadow over Luxor' }
  ];

  paintingConfigs.forEach((cfg) => {
    const frameGeo = new THREE.BoxGeometry(1.8, 2.4, 0.12);
    const frame = new THREE.Mesh(frameGeo, frameMat);

    // Canvas inside
    const canvasGeo = new THREE.PlaneGeometry(1.5, 2.1);
    const canvasMat = new THREE.MeshStandardMaterial({
      color: 0x1c1a24,
      roughness: 0.7
    });
    const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
    canvasMesh.position.z = 0.07;
    frame.add(canvasMesh);

    frame.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    frame.rotation.y = cfg.rot;
    scene.add(frame);
  });
}

function buildSarcophagus(goldMat: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(1.2, 2.2, 0.7);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x2b271f, roughness: 0.7 });
  const body = new THREE.Mesh(bodyGeo, stoneMat);
  body.position.y = 1.1;
  group.add(body);

  const headGeo = new THREE.ConeGeometry(0.5, 0.6, 6);
  const head = new THREE.Mesh(headGeo, goldMat);
  head.position.set(0, 2.2, 0.1);
  group.add(head);

  return group;
}

function buildArchivalStacks(scene: THREE.Scene, woodMat: THREE.Material) {
  for (let z = 18; z <= 34; z += 5) {
    const shelfGeo = new THREE.BoxGeometry(6, 4.2, 0.8);
    const shelf = new THREE.Mesh(shelfGeo, woodMat);
    shelf.position.set(-4, 2.1, z);
    shelf.castShadow = true;
    scene.add(shelf);
  }
}

function buildMasterGate(): THREE.Group {
  const group = new THREE.Group();
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x111116, metalness: 0.9, roughness: 0.3 });

  // Iron Bars
  for (let x = -3; x <= 3; x += 0.4) {
    const barGeo = new THREE.CylinderGeometry(0.04, 0.04, 4.5, 8);
    const bar = new THREE.Mesh(barGeo, ironMat);
    bar.position.set(x, 2.25, 0);
    group.add(bar);
  }

  // Heavy cross beams
  const crossGeo = new THREE.BoxGeometry(6.6, 0.15, 0.15);
  const cross1 = new THREE.Mesh(crossGeo, ironMat);
  cross1.position.y = 1.2;
  const cross2 = new THREE.Mesh(crossGeo, ironMat);
  cross2.position.y = 3.6;
  group.add(cross1);
  group.add(cross2);

  return group;
}

function buildMonsterSpecter(): THREE.Group {
  const group = new THREE.Group();

  // Shadowy body shroud (inverted cone with dark ghostly material)
  const shroudGeo = new THREE.ConeGeometry(0.65, 2.4, 16);
  const shroudMat = new THREE.MeshStandardMaterial({
    color: 0x050508,
    roughness: 0.9,
    transparent: true,
    opacity: 0.85
  });
  const shroud = new THREE.Mesh(shroudGeo, shroudMat);
  shroud.position.y = 0.2;
  group.add(shroud);

  // Floating skull/face
  const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a24,
    roughness: 0.8
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.4;
  group.add(head);

  // Glowing hollow spectral eye sockets
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMat);
  leftEye.position.set(-0.1, 1.45, 0.28);
  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMat);
  rightEye.position.set(0.1, 1.45, 0.28);
  group.add(leftEye);
  group.add(rightEye);

  return group;
}
