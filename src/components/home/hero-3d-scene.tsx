"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Geometries (Instantiated once to avoid garbage collection spikes)
// ─────────────────────────────────────────────────────────────────────────────

// Main Robot Head & Visor
const headShellGeometry = new RoundedBoxGeometry(1.6, 1.25, 1.05, 5, 0.28);
const visorRimGeometry = new RoundedBoxGeometry(1.4, 0.92, 0.12, 5, 0.25);
const visorGeometry = new RoundedBoxGeometry(1.32, 0.82, 0.16, 5, 0.22);
const earPodGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.16, 24);
const earAccentRingGeometry = new THREE.TorusGeometry(0.22, 0.025, 16, 32);
const eyeCapsuleGeometry = new THREE.CapsuleGeometry(0.08, 0.14, 8, 16);
const mouthStatusGeometry = new RoundedBoxGeometry(0.24, 0.06, 0.04, 3, 0.02);

// Main Robot Body / Torso
const neckGeometry = new THREE.CylinderGeometry(0.3, 0.36, 0.32, 24);
const neckRingGeometry = new THREE.TorusGeometry(0.34, 0.03, 16, 32);
const chestChassisGeometry = new RoundedBoxGeometry(1.95, 1.35, 1.15, 5, 0.32);
const chestPlateGeometry = new RoundedBoxGeometry(1.65, 0.95, 0.15, 5, 0.22);
const chestCoreRimGeometry = new THREE.CylinderGeometry(0.26, 0.26, 0.08, 32);
const chestCoreApertureGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32);
const shoulderPadGeometry = new RoundedBoxGeometry(0.68, 0.48, 0.68, 4, 0.2);
const shoulderRingGeometry = new THREE.TorusGeometry(0.36, 0.035, 16, 32);
const collarPlateGeometry = new RoundedBoxGeometry(1.3, 0.16, 0.7, 4, 0.06);

// Companion Drone (Upper-Left)
const droneChassisGeometry = new THREE.CapsuleGeometry(0.22, 0.52, 12, 24);
const droneVisorGeometry = new RoundedBoxGeometry(0.32, 0.14, 0.08, 4, 0.04);
const droneThrusterGeometry = new THREE.CylinderGeometry(0.12, 0.08, 0.16, 16);
const droneWingGeometry = new RoundedBoxGeometry(0.85, 0.06, 0.22, 4, 0.03);

// Assistant Orb (Lower-Right)
const orbBodyGeometry = new THREE.SphereGeometry(0.46, 28, 28);
const orbVisorRingGeometry = new THREE.TorusGeometry(0.48, 0.03, 16, 48);
const orbEyeGeometry = new THREE.SphereGeometry(0.12, 20, 20);
const orbGimbalRingGeometry = new THREE.TorusGeometry(0.72, 0.018, 16, 64);

// Mini Neural Probe (Upper-Right)
const probeCrystalGeometry = new THREE.OctahedronGeometry(0.3, 0);
const probeHaloGeometry = new THREE.TorusGeometry(0.48, 0.015, 16, 48);

// ─────────────────────────────────────────────────────────────────────────────
// Component 1: Main Humanoid Robot (Head, Visor, Eyes, Torso, Core)
// ─────────────────────────────────────────────────────────────────────────────
function MainHumanoidRobot({ pointer }: { pointer: React.MutableRefObject<[number, number]> }) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const chestCoreRef = useRef<THREE.Mesh>(null);

  // Blinking cycle state
  const isBlinking = useRef(false);
  const blinkProgress = useRef(0);

  // Schedule natural eye blinks every 2.8 - 4.6 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const triggerBlink = () => {
      const delay = 2800 + Math.random() * 2000;
      timeoutId = setTimeout(() => {
        isBlinking.current = true;
        blinkProgress.current = 0;
        triggerBlink();
      }, delay);
    };
    triggerBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // 1. Idle Gentle Breathing & Floating of Entire Humanoid Figure
    if (rootGroupRef.current) {
      rootGroupRef.current.position.y = -0.35 + Math.sin(t * 1.6) * 0.06;
      rootGroupRef.current.rotation.y = Math.sin(t * 0.8) * 0.04;
    }

    // 2. Head Cursor-Tracking (Smooth Yaw, Pitch, Roll)
    if (headGroupRef.current) {
      const targetYaw = pointer.current[0] * 0.38;
      const targetPitch = -pointer.current[1] * 0.24;
      const targetRoll = -pointer.current[0] * 0.08;

      headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        headGroupRef.current.rotation.y,
        targetYaw,
        delta * 5
      );
      headGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        headGroupRef.current.rotation.x,
        targetPitch,
        delta * 5
      );
      headGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        headGroupRef.current.rotation.z,
        targetRoll,
        delta * 5
      );
    }

    // 3. Eye Blinking & Pupil Cursor Shifting
    let eyeScaleY = 1.0;
    if (isBlinking.current) {
      blinkProgress.current += delta * 12;
      if (blinkProgress.current < Math.PI) {
        eyeScaleY = Math.max(0.05, Math.abs(Math.cos(blinkProgress.current)));
      } else {
        isBlinking.current = false;
        blinkProgress.current = 0;
        eyeScaleY = 1.0;
      }
    }

    const pupilShiftX = pointer.current[0] * 0.035;
    const pupilShiftY = pointer.current[1] * 0.025;

    if (leftEyeRef.current) {
      leftEyeRef.current.scale.set(1, eyeScaleY, 1);
      leftEyeRef.current.position.x = -0.32 + pupilShiftX;
      leftEyeRef.current.position.y = 0.09 + pupilShiftY;
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.scale.set(1, eyeScaleY, 1);
      rightEyeRef.current.position.x = 0.32 + pupilShiftX;
      rightEyeRef.current.position.y = 0.09 + pupilShiftY;
    }

    // 4. Subtle Pulse on Chest Core and Voice Bar
    if (chestCoreRef.current) {
      const corePulse = 1.6 + Math.sin(t * 3.2) * 0.4;
      (chestCoreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = corePulse;
    }
    if (mouthRef.current) {
      const mouthScale = 0.95 + Math.sin(t * 2.5) * 0.08;
      mouthRef.current.scale.set(mouthScale, 1, 1);
    }
  });

  return (
    <group ref={rootGroupRef} position={[0, -0.35, 0]}>
      {/* ─── UPPER BODY & TORSO ─── */}
      <group position={[0, -0.9, 0]}>
        {/* Main Chest Chassis (White Shell) */}
        <mesh position={[0, 0, 0]}>
          <primitive object={chestChassisGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.24}
            metalness={0.06}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Inset Front Armor Plate */}
        <mesh position={[0, -0.05, 0.54]}>
          <primitive object={chestPlateGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#F1F5F9"
            roughness={0.28}
            metalness={0.08}
          />
        </mesh>

        {/* Collar Plate (Indigo Tinted Trim) */}
        <mesh position={[0, 0.65, 0.15]}>
          <primitive object={collarPlateGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#E0E7FF"
            roughness={0.3}
            metalness={0.12}
          />
        </mesh>

        {/* Central Power Core Reactor (Cyan & Indigo Accent) */}
        <mesh position={[0, 0.06, 0.61]} rotation={[Math.PI / 2, 0, 0]}>
          <primitive object={chestCoreRimGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#4F46E5"
            roughness={0.25}
            metalness={0.4}
          />
        </mesh>
        <mesh ref={chestCoreRef} position={[0, 0.06, 0.63]} rotation={[Math.PI / 2, 0, 0]}>
          <primitive object={chestCoreApertureGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#0284C7"
            emissiveIntensity={1.8}
            roughness={0.15}
            toneMapped={false}
          />
        </mesh>

        {/* Left Shoulder Pad & Indigo Ring */}
        <mesh position={[-1.25, 0.42, 0]}>
          <primitive object={shoulderPadGeometry} attach="geometry" />
          <meshStandardMaterial color="#FFFFFF" roughness={0.25} metalness={0.06} />
        </mesh>
        <mesh position={[-1.25, 0.42, 0]} rotation={[0, Math.PI / 2, 0]}>
          <primitive object={shoulderRingGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#6366F1"
            emissive="#4F46E5"
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>

        {/* Right Shoulder Pad & Indigo Ring */}
        <mesh position={[1.25, 0.42, 0]}>
          <primitive object={shoulderPadGeometry} attach="geometry" />
          <meshStandardMaterial color="#FFFFFF" roughness={0.25} metalness={0.06} />
        </mesh>
        <mesh position={[1.25, 0.42, 0]} rotation={[0, Math.PI / 2, 0]}>
          <primitive object={shoulderRingGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#6366F1"
            emissive="#4F46E5"
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>

        {/* Neck Column & Joint */}
        <mesh position={[0, 0.85, 0]}>
          <primitive object={neckGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#334155"
            roughness={0.35}
            metalness={0.6}
          />
        </mesh>
        <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <primitive object={neckRingGeometry} attach="geometry" />
          <meshStandardMaterial color="#64748B" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* ─── ARTICULATED ROBOT HEAD ─── */}
      <group ref={headGroupRef} position={[0, 0.55, 0]}>
        {/* Main Clean White Helmet Shell */}
        <mesh position={[0, 0, 0]}>
          <primitive object={headShellGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.22}
            metalness={0.08}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Dark Navy Visor Bezel / Rim */}
        <mesh position={[0, -0.04, 0.48]}>
          <primitive object={visorRimGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#CBD5E1"
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>

        {/* Deep Navy Curved Display Visor */}
        <mesh position={[0, -0.04, 0.54]}>
          <primitive object={visorGeometry} attach="geometry" />
          <meshPhysicalMaterial
            color="#071328"
            roughness={0.1}
            metalness={0.35}
            clearcoat={1.0}
            clearcoatRoughness={0.08}
          />
        </mesh>

        {/* Soft Cyan Glowing Left Eye */}
        <mesh ref={leftEyeRef} position={[-0.32, 0.09, 0.63]} rotation={[0, 0, Math.PI / 2]}>
          <primitive object={eyeCapsuleGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#0284C7"
            emissiveIntensity={2.4}
            roughness={0.15}
            toneMapped={false}
          />
        </mesh>

        {/* Soft Cyan Glowing Right Eye */}
        <mesh ref={rightEyeRef} position={[0.32, 0.09, 0.63]} rotation={[0, 0, Math.PI / 2]}>
          <primitive object={eyeCapsuleGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#0284C7"
            emissiveIntensity={2.4}
            roughness={0.15}
            toneMapped={false}
          />
        </mesh>

        {/* Subtle Cyan Voice Status Bar */}
        <mesh ref={mouthRef} position={[0, -0.25, 0.63]}>
          <primitive object={mouthStatusGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#0EA5E9"
            emissiveIntensity={1.6}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>

        {/* Left Ear Audio Pod & Indigo Light Ring */}
        <mesh position={[-0.86, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <primitive object={earPodGeometry} attach="geometry" />
          <meshStandardMaterial color="#F1F5F9" roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[-0.94, 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
          <primitive object={earAccentRingGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#6366F1"
            emissive="#4F46E5"
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>

        {/* Right Ear Audio Pod & Indigo Light Ring */}
        <mesh position={[0.86, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <primitive object={earPodGeometry} attach="geometry" />
          <meshStandardMaterial color="#F1F5F9" roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0.94, 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
          <primitive object={earAccentRingGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#6366F1"
            emissive="#4F46E5"
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component 2: Companion Robot #1 (Upper-Left Floating AI Drone)
// ─────────────────────────────────────────────────────────────────────────────
function DroneCompanion({ pointer }: { pointer: React.MutableRefObject<[number, number]> }) {
  const droneGroupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!droneGroupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Gentle hovering sway & slight banking toward pointer
    const targetX = -1.9 + pointer.current[0] * 0.15;
    const targetY = 1.05 + Math.sin(t * 2.2) * 0.09 - pointer.current[1] * 0.1;
    const targetZ = 0.35 + Math.cos(t * 1.8) * 0.08;

    droneGroupRef.current.position.x = THREE.MathUtils.lerp(
      droneGroupRef.current.position.x,
      targetX,
      delta * 3
    );
    droneGroupRef.current.position.y = THREE.MathUtils.lerp(
      droneGroupRef.current.position.y,
      targetY,
      delta * 3
    );
    droneGroupRef.current.position.z = THREE.MathUtils.lerp(
      droneGroupRef.current.position.z,
      targetZ,
      delta * 3
    );

    // Natural banking tilt
    droneGroupRef.current.rotation.z = Math.sin(t * 2.0) * 0.08 + pointer.current[0] * 0.1;
    droneGroupRef.current.rotation.y = 0.25 + pointer.current[0] * 0.15;
  });

  return (
    <group ref={droneGroupRef} position={[-1.9, 1.05, 0.35]}>
      {/* Aerodynamic White Fuselage */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <primitive object={droneChassisGeometry} attach="geometry" />
        <meshStandardMaterial color="#FFFFFF" roughness={0.25} metalness={0.08} />
      </mesh>

      {/* Mini Cyan Visor Scanner */}
      <mesh position={[0.08, 0, 0.22]}>
        <primitive object={droneVisorGeometry} attach="geometry" />
        <meshStandardMaterial
          color="#38BDF8"
          emissive="#0284C7"
          emissiveIntensity={2.0}
          roughness={0.15}
          toneMapped={false}
        />
      </mesh>

      {/* Aerodynamic Wing Fin */}
      <mesh position={[-0.04, 0.02, -0.05]}>
        <primitive object={droneWingGeometry} attach="geometry" />
        <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Dual Bottom Stabilizing Thrusters (Indigo Glow) */}
      <mesh position={[-0.26, -0.16, 0]}>
        <primitive object={droneThrusterGeometry} attach="geometry" />
        <meshStandardMaterial
          color="#6366F1"
          emissive="#4F46E5"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.26, -0.16, 0]}>
        <primitive object={droneThrusterGeometry} attach="geometry" />
        <meshStandardMaterial
          color="#6366F1"
          emissive="#4F46E5"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component 3: Companion Robot #2 (Lower-Right Assistant AI Orb)
// ─────────────────────────────────────────────────────────────────────────────
function AssistantOrbCompanion({ pointer }: { pointer: React.MutableRefObject<[number, number]> }) {
  const orbGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!orbGroupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Bobbing in pleasant counter-phase to the main robot
    const targetX = 1.85 + pointer.current[0] * 0.12;
    const targetY = -0.65 + Math.sin(t * 1.8 + 1.2) * 0.08;
    const targetZ = 0.45;

    orbGroupRef.current.position.x = THREE.MathUtils.lerp(
      orbGroupRef.current.position.x,
      targetX,
      delta * 3
    );
    orbGroupRef.current.position.y = THREE.MathUtils.lerp(
      orbGroupRef.current.position.y,
      targetY,
      delta * 3
    );
    orbGroupRef.current.position.z = THREE.MathUtils.lerp(
      orbGroupRef.current.position.z,
      targetZ,
      delta * 3
    );

    // Continuous orbital ring spin
    if (ringRef.current) {
      ringRef.current.rotation.x = t * 0.8;
      ringRef.current.rotation.y = t * 0.6;
    }
  });

  return (
    <group ref={orbGroupRef} position={[1.85, -0.65, 0.45]}>
      {/* Spherical White Shell Body */}
      <mesh>
        <primitive object={orbBodyGeometry} attach="geometry" />
        <meshStandardMaterial color="#FFFFFF" roughness={0.22} metalness={0.06} />
      </mesh>

      {/* Horizontal Indigo Visor Seam */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <primitive object={orbVisorRingGeometry} attach="geometry" />
        <meshStandardMaterial color="#4F46E5" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Glowing Cyan Optical Eye */}
      <mesh position={[0, 0.05, 0.42]}>
        <primitive object={orbEyeGeometry} attach="geometry" />
        <meshStandardMaterial
          color="#38BDF8"
          emissive="#0284C7"
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>

      {/* Orbital Gyroscopic Gimbal Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, Math.PI / 6, 0]}>
        <primitive object={orbGimbalRingGeometry} attach="geometry" />
        <meshStandardMaterial
          color="#818CF8"
          emissive="#6366F1"
          emissiveIntensity={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component 4: Companion Robot #3 (Upper-Right Mini Neural Probe)
// ─────────────────────────────────────────────────────────────────────────────
function MiniProbeCompanion() {
  const probeGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!probeGroupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Gentle float and rotation
    probeGroupRef.current.position.y = 1.25 + Math.sin(t * 1.9 + 2.0) * 0.07;
    probeGroupRef.current.rotation.y = t * 0.45;
    probeGroupRef.current.rotation.x = Math.sin(t * 0.6) * 0.2;
  });

  return (
    <group ref={probeGroupRef} position={[1.65, 1.25, -0.2]}>
      {/* Octahedral Geometric Crystalline Core */}
      <mesh>
        <primitive object={probeCrystalGeometry} attach="geometry" />
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={0.18}
          metalness={0.2}
          emissive="#C7D2FE"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Glowing Cyan Orbit Ring */}
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <primitive object={probeHaloGeometry} attach="geometry" />
        <meshStandardMaterial
          color="#38BDF8"
          emissive="#0EA5E9"
          emissiveIntensity={1.2}
          transparent
          opacity={0.65}
        />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component 5: Subtle Neural Network Connections & Glowing Data Nodes
// ─────────────────────────────────────────────────────────────────────────────
function NeuralField() {
  const groupRef = useRef<THREE.Group>(null);

  // Generate 22 balanced node points around the robotics composition
  const { nodePositions, lineGeometry } = useMemo(() => {
    const rawCoords: [number, number, number][] = [
      [-2.4, 0.4, -0.6],
      [-2.1, 1.8, -0.4],
      [-1.3, 1.9, 0.2],
      [-0.9, 2.1, -0.5],
      [0.0, 2.3, 0.1],
      [0.8, 2.1, -0.4],
      [1.4, 2.0, 0.3],
      [2.2, 1.6, -0.5],
      [2.5, 0.5, -0.2],
      [2.3, -0.4, 0.2],
      [2.0, -1.3, -0.4],
      [1.2, -1.8, -0.2],
      [0.0, -1.9, 0.3],
      [-1.1, -1.7, -0.3],
      [-1.9, -1.2, 0.1],
      [-2.3, -0.5, -0.4],
      // Inner ambient nodes
      [-1.5, 0.0, -0.8],
      [-0.8, 1.3, -0.6],
      [0.7, 1.4, -0.7],
      [1.6, 0.2, -0.7],
      [0.9, -1.1, -0.8],
      [-0.8, -1.0, -0.8],
    ];

    const pos = new Float32Array(rawCoords.length * 3);
    rawCoords.forEach(([x, y, z], i) => {
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    });

    // Build connections between nearby nodes
    const indices: number[] = [];
    for (let i = 0; i < rawCoords.length; i++) {
      for (let j = i + 1; j < rawCoords.length; j++) {
        const dx = rawCoords[i]![0] - rawCoords[j]![0];
        const dy = rawCoords[i]![1] - rawCoords[j]![1];
        const dz = rawCoords[i]![2] - rawCoords[j]![2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > 0.8 && dist < 1.65) {
          indices.push(i, j);
        }
      }
    }

    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    lineGeom.setIndex(indices);

    return { nodePositions: rawCoords, lineGeometry: lineGeom };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Slow, subtle ambient rotation for depth
    groupRef.current.rotation.y += delta * 0.04;
  });

  return (
    <group ref={groupRef}>
      {/* Neural Synapse Connection Strands */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          color="#818CF8"
          transparent
          opacity={0.3}
          linewidth={1}
        />
      </lineSegments>

      {/* Glowing Data Nodes */}
      {nodePositions.map(([x, y, z], idx) => (
        <mesh key={idx} position={[x, y, z]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial
            color={idx % 3 === 0 ? "#4F46E5" : idx % 2 === 0 ? "#38BDF8" : "#A5B4FC"}
            emissive={idx % 3 === 0 ? "#6366F1" : "#0284C7"}
            emissiveIntensity={1.2}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Background Holographic Data Rings */}
      <mesh position={[0, 0, -1.2]} rotation={[Math.PI / 4, Math.PI / 6, 0]}>
        <torusGeometry args={[2.5, 0.012, 16, 80]} />
        <meshStandardMaterial
          color="#C7D2FE"
          emissive="#818CF8"
          emissiveIntensity={0.5}
          transparent
          opacity={0.4}
        />
      </mesh>
      <mesh position={[0, 0, -1.4]} rotation={[-Math.PI / 3, 0, 0]}>
        <torusGeometry args={[3.1, 0.01, 16, 96]} />
        <meshStandardMaterial
          color="#BAE6FD"
          emissive="#38BDF8"
          emissiveIntensity={0.4}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Scene Export: Light-Theme Studio Rig with Interactive Canvas
// ─────────────────────────────────────────────────────────────────────────────
export default function Hero3DScene({ isInView }: { isInView: boolean }) {
  const pointer = useRef<[number, number]>([0, 0]);

  // Track cursor coordinates across the Hero scene
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    pointer.current = [x, y];
  };

  const handlePointerLeave = () => {
    // Return gracefully to center
    pointer.current = [0, 0];
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-[360px] sm:h-[420px] lg:h-[480px] max-w-xl mx-auto cursor-grab active:cursor-grabbing select-none"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0.1, 5.2], fov: 42 }}
        dpr={[1, 1.5]} // Capped at 1.5 for optimal Core Web Vitals
        frameloop={isInView ? "always" : "never"} // Pauses off-screen
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        {/* Soft, clean high-key studio lighting matching light theme */}
        <ambientLight intensity={1.3} color="#FFFFFF" />
        <directionalLight position={[5, 6, 5]} intensity={1.8} color="#FFFFFF" />
        <directionalLight position={[-4, 3, 2]} intensity={0.9} color="#E0E7FF" />
        <pointLight position={[0, -2, 3]} intensity={0.7} color="#38BDF8" />
        <pointLight position={[3, 4, -2]} intensity={0.6} color="#6366F1" />

        {/* Neural Network & Circuit Connections Field */}
        <NeuralField />

        {/* Main Friendly Humanoid Robot */}
        <MainHumanoidRobot pointer={pointer} />

        {/* Companion Robot #1 (Upper-Left Floating Drone) */}
        <DroneCompanion pointer={pointer} />

        {/* Companion Robot #2 (Lower-Right Assistant Orb) */}
        <AssistantOrbCompanion pointer={pointer} />

        {/* Companion Robot #3 (Upper-Right Mini Neural Probe) */}
        <MiniProbeCompanion />
      </Canvas>
    </div>
  );
}
