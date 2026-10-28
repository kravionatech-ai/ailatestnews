"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type RobotExpression = "idle" | "thinking" | "speaking" | "happy";

interface RobotHeadProps {
  expression?: RobotExpression;
  isStreaming?: boolean;
}

const helmetGeometry = new RoundedBoxGeometry(1.76, 1.28, 0.76, 6, 0.3);
const visorRimGeometry = new RoundedBoxGeometry(1.54, 0.98, 0.14, 6, 0.31);
const visorGeometry = new RoundedBoxGeometry(1.46, 0.88, 0.16, 6, 0.29);
const crownGeometry = new RoundedBoxGeometry(0.54, 0.18, 0.38, 5, 0.08);
const earPodGeometry = new RoundedBoxGeometry(0.32, 0.54, 0.5, 5, 0.12);
const earInsetGeometry = new RoundedBoxGeometry(0.035, 0.24, 0.27, 4, 0.08);
const mouthGeometry = new RoundedBoxGeometry(0.2, 0.1, 0.06, 4, 0.045);

/**
 * Procedural 3D Robot Head with expressive face and smooth cursor tracking.
 */
function RobotHeadMesh({ expression = "idle", isStreaming = false }: RobotHeadProps) {
  const headGroupRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const happyMouthRef = useRef<THREE.Mesh>(null);
  const leftCheekRef = useRef<THREE.Mesh>(null);
  const rightCheekRef = useRef<THREE.Mesh>(null);

  // Pointer position normalized (-1 to 1)
  const pointerTarget = useRef({ x: 0, y: 0 });

  // Blinking state
  const isBlinking = useRef(false);
  const blinkProgress = useRef(0);

  // Global cursor listener
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      // Normalize coordinate relative to window center
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      pointerTarget.current = { x, y };
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  // Periodic natural blinking timer
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleNextBlink = () => {
      // Random interval between 2.2 and 4.8 seconds
      const nextDelay = 2200 + Math.random() * 2600;
      timeoutId = setTimeout(() => {
        isBlinking.current = true;
        blinkProgress.current = 0;
        scheduleNextBlink();
      }, nextDelay);
    };

    scheduleNextBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  // Frame animation loop
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // 1. Smooth Head Rotation to follow cursor
    if (headGroupRef.current) {
      // Idle natural breathing sway
      const idleSwayY = Math.sin(t * 1.5) * 0.04;
      const idleSwayX = Math.cos(t * 1.2) * 0.03;

      const targetYaw = pointerTarget.current.x * 0.38 + idleSwayY;
      const targetPitch = pointerTarget.current.y * 0.28 + idleSwayX;
      const targetRoll = -pointerTarget.current.x * 0.07;

      // When thinking, tilt head slightly curiously
      const thinkTilt = expression === "thinking" || isStreaming ? 0.08 : 0;

      headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        headGroupRef.current.rotation.y,
        targetYaw,
        delta * 6
      );
      headGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        headGroupRef.current.rotation.x,
        targetPitch - thinkTilt,
        delta * 6
      );
      headGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        headGroupRef.current.rotation.z,
        targetRoll + (expression === "thinking" ? 0.06 : 0),
        delta * 6
      );
    }

    // 2. Eye Blinking Animation
    let eyeScaleY = 1.0;
    if (isBlinking.current) {
      blinkProgress.current += delta * 12;
      if (blinkProgress.current < Math.PI) {
        eyeScaleY = Math.max(0.06, Math.abs(Math.cos(blinkProgress.current)));
      } else {
        isBlinking.current = false;
        blinkProgress.current = 0;
        eyeScaleY = 1.0;
      }
    }

    // 3. Eye Expressions (Happy crescents vs Normal pills vs Thinking pulse)
    if (leftEyeRef.current && rightEyeRef.current) {
      if (expression === "happy") {
        // Crescent happy squint
        leftEyeRef.current.scale.set(0.45 * eyeScaleY, 1.1, 1);
        rightEyeRef.current.scale.set(0.45 * eyeScaleY, 1.1, 1);
        leftEyeRef.current.rotation.z = Math.PI / 2 - 0.2;
        rightEyeRef.current.rotation.z = Math.PI / 2 + 0.2;
      } else if (expression === "thinking" || (isStreaming && !isBlinking.current)) {
        // Focused thinking squint with glowing pulse
        const pulse = 1.0 + Math.sin(t * 8) * 0.12;
        leftEyeRef.current.scale.set(pulse, 0.8 * eyeScaleY * pulse, 1);
        rightEyeRef.current.scale.set(pulse, 0.8 * eyeScaleY * pulse, 1);
        leftEyeRef.current.rotation.z = Math.PI / 2;
        rightEyeRef.current.rotation.z = Math.PI / 2;
      } else {
        // Normal neutral eyes
        leftEyeRef.current.scale.set(eyeScaleY, 1, 1);
        rightEyeRef.current.scale.set(eyeScaleY, 1, 1);
        leftEyeRef.current.rotation.z = Math.PI / 2;
        rightEyeRef.current.rotation.z = Math.PI / 2;
      }

      // Eye pupil shift towards cursor (extra life)
      const pupilShiftX = pointerTarget.current.x * 0.04;
      const pupilShiftY = -pointerTarget.current.y * 0.04;
      leftEyeRef.current.position.x = -0.32 + pupilShiftX;
      leftEyeRef.current.position.y = 0.12 + pupilShiftY;
      rightEyeRef.current.position.x = 0.32 + pupilShiftX;
      rightEyeRef.current.position.y = 0.12 + pupilShiftY;
    }

    // 4. Mouth Expressions & Talking Animation
    if (mouthRef.current && happyMouthRef.current) {
      if (expression === "happy") {
        // Show smiling arc mouth, hide flat mouth
        mouthRef.current.visible = false;
        happyMouthRef.current.visible = true;
        const smilePulse = 1.0 + Math.sin(t * 4) * 0.05;
        happyMouthRef.current.scale.set(smilePulse, smilePulse, smilePulse);
      } else {
        happyMouthRef.current.visible = false;
        mouthRef.current.visible = true;

        if (isStreaming || expression === "speaking") {
          // Dynamic talking animation: opens and oscillates with speech rhythm
          const talkCycle = Math.abs(Math.sin(t * 15)) * 1.6 + 0.3;
          const talkWidth = 0.85 + Math.cos(t * 9) * 0.25;
          mouthRef.current.scale.set(talkWidth, talkCycle, 1);
        } else if (expression === "thinking") {
          // Subtle pulse / oscillating wave
          const thinkWave = Math.sin(t * 6) * 0.2 + 0.9;
          mouthRef.current.scale.set(thinkWave * 0.6, 0.5, 1);
        } else {
          // Neutral subtle mouth
          mouthRef.current.scale.set(1, 1, 1);
        }
      }
    }

    // 5. Cheeks visibility (blushing on happy)
    if (leftCheekRef.current && rightCheekRef.current) {
      const targetCheekOpacity = expression === "happy" ? 0.65 : 0.0;
      const leftMat = leftCheekRef.current.material as THREE.MeshBasicMaterial;
      const rightMat = rightCheekRef.current.material as THREE.MeshBasicMaterial;
      if (leftMat && rightMat) {
        leftMat.opacity = THREE.MathUtils.lerp(leftMat.opacity, targetCheekOpacity, delta * 5);
        rightMat.opacity = THREE.MathUtils.lerp(rightMat.opacity, targetCheekOpacity, delta * 5);
      }
    }

  });

  return (
    <group ref={headGroupRef} position={[0, 0, 0]}>
      {/* ── Soft, broad helmet shell matching the reference bot ── */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <primitive object={helmetGeometry} attach="geometry" />
        <meshStandardMaterial
          color="#F4F7FB"
          roughness={0.3}
          metalness={0.08}
          envMapIntensity={1.1}
        />
      </mesh>

      {/* ── Low-profile crown pad above the helmet ── */}
      <mesh position={[0, 0.67, -0.02]}>
        <primitive object={crownGeometry} attach="geometry" />
        <meshStandardMaterial color="#D9E0E8" roughness={0.35} metalness={0.08} />
      </mesh>

      {/* ── Soft silver bezel and dark glass face ── */}
      <mesh position={[0, -0.035, 0.385]}>
        <primitive object={visorRimGeometry} attach="geometry" />
        <meshStandardMaterial color="#D5DCE5" roughness={0.32} metalness={0.14} />
      </mesh>
      <mesh position={[0, -0.035, 0.48]}>
        <primitive object={visorGeometry} attach="geometry" />
        <meshPhysicalMaterial
          color="#071A27"
          roughness={0.12}
          metalness={0.38}
          clearcoat={1.0}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* ── Wide turquoise eyes ── */}
      <mesh ref={leftEyeRef} position={[-0.32, 0.12, 0.58]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.075, 0.055, 8, 16]} />
        <meshStandardMaterial
          color="#5DE5E1"
          emissive="#19C9C8"
          emissiveIntensity={1.8}
          roughness={0.18}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={rightEyeRef} position={[0.32, 0.12, 0.58]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.075, 0.055, 8, 16]} />
        <meshStandardMaterial
          color="#5DE5E1"
          emissive="#19C9C8"
          emissiveIntensity={1.8}
          roughness={0.18}
          toneMapped={false}
        />
      </mesh>

      {/* ── Small animated voice panel ── */}
      <mesh ref={mouthRef} position={[0, -0.25, 0.59]}>
        <primitive object={mouthGeometry} attach="geometry" />
        <meshStandardMaterial
          color="#5DE5E1"
          emissive="#19C9C8"
          emissiveIntensity={1.7}
          roughness={0.18}
          toneMapped={false}
        />
      </mesh>

      {/* ── Smiling Mouth (Curved Arc Torus, toggled on happy) ── */}
      <mesh
        ref={happyMouthRef}
        position={[0, -0.25, 0.59]}
        rotation={[0, 0, Math.PI]}
        visible={false}
      >
        <torusGeometry args={[0.18, 0.03, 8, 24, Math.PI * 0.7]} />
        <meshStandardMaterial
          color="#5DE5E1"
          emissive="#19C9C8"
          emissiveIntensity={2.0}
          toneMapped={false}
        />
      </mesh>

      {/* ── Left Cheek Blush (Glowing Pink/Lavender) ── */}
      <mesh ref={leftCheekRef} position={[-0.53, -0.1, 0.575]}>
        <circleGeometry args={[0.07, 16]} />
        <meshBasicMaterial color="#F472B6" transparent opacity={0} />
      </mesh>

      {/* ── Right Cheek Blush ── */}
      <mesh ref={rightCheekRef} position={[0.53, -0.1, 0.575]}>
        <circleGeometry args={[0.07, 16]} />
        <meshBasicMaterial color="#F472B6" transparent opacity={0} />
      </mesh>

      {/* ── Short, padded side pods ── */}
      <mesh position={[-0.94, 0, 0]}>
        <primitive object={earPodGeometry} attach="geometry" />
        <meshStandardMaterial color="#E4E9F0" roughness={0.3} metalness={0.08} />
      </mesh>
      <mesh position={[0.94, 0, 0]}>
        <primitive object={earPodGeometry} attach="geometry" />
        <meshStandardMaterial color="#E4E9F0" roughness={0.3} metalness={0.08} />
      </mesh>
      <mesh position={[-1.11, 0, 0.05]}>
        <primitive object={earInsetGeometry} attach="geometry" />
        <meshStandardMaterial color="#CBD4DE" roughness={0.34} />
      </mesh>
      <mesh position={[1.11, 0, 0.05]}>
        <primitive object={earInsetGeometry} attach="geometry" />
        <meshStandardMaterial color="#CBD4DE" roughness={0.34} />
      </mesh>
    </group>
  );
}

/**
 * 3D Robot Scene Canvas Wrapper with lighting and camera setup.
 */
export default function RobotHead3DScene({
  expression = "idle",
  isStreaming = false,
}: RobotHeadProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.04, 3.55], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      className="w-full h-full pointer-events-none"
    >
      <ambientLight intensity={1.0} />
      <directionalLight position={[3, 5, 4]} intensity={1.55} color="#FFFFFF" />
      <directionalLight position={[-3, -2, -2]} intensity={0.55} color="#C8F5F4" />
      <pointLight position={[0, 0.5, 2]} intensity={0.7} color="#D8FCFB" />

      <Float speed={2.5} rotationIntensity={0.15} floatIntensity={0.25}>
        <RobotHeadMesh expression={expression} isStreaming={isStreaming} />
      </Float>
    </Canvas>
  );
}
