"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamic import with SSR false after first paint
const Hero3DScene = dynamic(() => import("./hero-3d-scene"), {
  ssr: false,
  loading: () => <Hero3DPoster />,
});

// ── Static Poster Component (Instant LCP Element & Fallback) ──
export function Hero3DPoster() {
  return (
    <div
      className="relative w-full h-[360px] sm:h-[420px] lg:h-[480px] max-w-xl mx-auto flex items-center justify-center select-none"
      aria-hidden="true"
    >
      {/* Premium AI & Robotics Vector Scene (Zero-CLS LCP & Fallback) */}
      <svg
        viewBox="0 0 520 460"
        className="w-full h-full max-h-[460px] drop-shadow-sm select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <radialGradient id="heroBackdropGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C7D2FE" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#E0E7FF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="robotWhiteShell" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          <linearGradient id="robotNavyVisor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B1528" />
            <stop offset="100%" stopColor="#040914" />
          </linearGradient>

          <linearGradient id="indigoAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>

          <linearGradient id="cyanGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="40%" stopColor="#38BDF8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
          </radialGradient>

          {/* Glow filter for eyes and nodes */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Ambient Background Aura */}
        <circle cx="260" cy="230" r="210" fill="url(#heroBackdropGlow)" />

        {/* 2. Neural Network Connections & Subtle Orbit Rings */}
        <g opacity="0.45" strokeLinecap="round">
          {/* Orbital Data Rings */}
          <ellipse
            cx="260"
            cy="240"
            rx="210"
            ry="75"
            stroke="#818CF8"
            strokeWidth="1.2"
            strokeDasharray="6 8"
            transform="rotate(-12 260 240)"
          />
          <ellipse
            cx="260"
            cy="240"
            rx="180"
            ry="60"
            stroke="#38BDF8"
            strokeWidth="1"
            strokeDasharray="4 6"
            transform="rotate(16 260 240)"
          />

          {/* Synapse Lines */}
          <line x1="85" y1="110" x2="175" y2="170" stroke="#818CF8" strokeWidth="1.2" />
          <line x1="175" y1="170" x2="230" y2="105" stroke="#38BDF8" strokeWidth="1.2" />
          <line x1="230" y1="105" x2="330" y2="90" stroke="#818CF8" strokeWidth="1" />
          <line x1="330" y1="90" x2="425" y2="115" stroke="#38BDF8" strokeWidth="1.2" />
          <line x1="425" y1="115" x2="440" y2="210" stroke="#818CF8" strokeWidth="1" />
          <line x1="440" y1="210" x2="415" y2="315" stroke="#38BDF8" strokeWidth="1.2" />
          <line x1="415" y1="315" x2="350" y2="390" stroke="#818CF8" strokeWidth="1.2" />
          <line x1="100" y1="300" x2="170" y2="390" stroke="#818CF8" strokeWidth="1" />
          <line x1="75" y1="205" x2="85" y2="110" stroke="#38BDF8" strokeWidth="1" />
          <line x1="75" y1="205" x2="100" y2="300" stroke="#818CF8" strokeWidth="1" />
        </g>

        {/* Neural Data Nodes */}
        <g>
          <circle cx="85" cy="110" r="4.5" fill="#38BDF8" filter="url(#softGlow)" />
          <circle cx="175" cy="170" r="3.5" fill="#6366F1" />
          <circle cx="230" cy="105" r="4" fill="#818CF8" />
          <circle cx="330" cy="90" r="3.5" fill="#38BDF8" />
          <circle cx="425" cy="115" r="5" fill="#4F46E5" filter="url(#softGlow)" />
          <circle cx="440" cy="210" r="4" fill="#38BDF8" />
          <circle cx="415" cy="315" r="4.5" fill="#6366F1" />
          <circle cx="350" cy="390" r="3.5" fill="#38BDF8" />
          <circle cx="170" cy="390" r="3.5" fill="#4F46E5" />
          <circle cx="100" cy="300" r="4" fill="#818CF8" />
          <circle cx="75" cy="205" r="3.5" fill="#38BDF8" />
        </g>

        {/* 3. Companion Robot #1 (Upper-Left Floating Drone) */}
        <g transform="translate(70, 95) rotate(-6)">
          {/* Thruster Glow */}
          <ellipse cx="28" cy="46" rx="10" ry="4" fill="#38BDF8" opacity="0.7" filter="url(#softGlow)" />
          {/* Wings */}
          <rect x="-10" y="24" width="76" height="6" rx="3" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="0.8" />
          {/* Drone Body */}
          <rect x="12" y="6" width="32" height="36" rx="14" fill="url(#robotWhiteShell)" stroke="#CBD5E1" strokeWidth="1" />
          {/* Drone Visor Sensor */}
          <rect x="18" y="18" width="20" height="7" rx="3.5" fill="#071328" />
          <rect x="21" y="20" width="14" height="3" rx="1.5" fill="#38BDF8" filter="url(#softGlow)" />
          {/* Wingtip Beacon */}
          <circle cx="-7" cy="27" r="2.5" fill="#6366F1" />
          <circle cx="63" cy="27" r="2.5" fill="#38BDF8" />
        </g>

        {/* 4. Companion Robot #2 (Upper-Right Mini Neural Probe) */}
        <g transform="translate(415, 105)">
          {/* Orbit Halo */}
          <ellipse cx="14" cy="14" rx="22" ry="7" fill="none" stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="3 3" transform="rotate(25 14 14)" />
          {/* Crystalline Core */}
          <polygon points="14,0 26,14 14,28 2,14" fill="#FFFFFF" stroke="#818CF8" strokeWidth="1.5" />
          <polygon points="14,5 21,14 14,23 7,14" fill="url(#cyanGlowGrad)" filter="url(#softGlow)" />
        </g>

        {/* 5. Main Friendly Humanoid Robot (Center) */}
        <g>
          {/* Robot Torso / Chassis */}
          {/* Collar & Neck */}
          <rect x="238" y="260" width="44" height="26" rx="6" fill="#334155" />
          <line x1="242" y1="272" x2="278" y2="272" stroke="#818CF8" strokeWidth="2" />

          {/* Shoulders */}
          <g>
            {/* Left Shoulder */}
            <rect x="145" y="286" width="48" height="42" rx="14" fill="url(#robotWhiteShell)" stroke="#CBD5E1" strokeWidth="1.2" />
            <circle cx="169" cy="307" r="11" fill="none" stroke="url(#indigoAccentGrad)" strokeWidth="2.5" />
            {/* Right Shoulder */}
            <rect x="327" y="286" width="48" height="42" rx="14" fill="url(#robotWhiteShell)" stroke="#CBD5E1" strokeWidth="1.2" />
            <circle cx="351" cy="307" r="11" fill="none" stroke="url(#indigoAccentGrad)" strokeWidth="2.5" />
          </g>

          {/* Main Chest Body */}
          <rect x="180" y="280" width="160" height="120" rx="28" fill="url(#robotWhiteShell)" stroke="#CBD5E1" strokeWidth="1.5" />
          {/* Chest Inset Plate */}
          <rect x="200" y="300" width="120" height="84" rx="18" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          
          {/* Central Arc Core Reactor */}
          <circle cx="260" cy="342" r="22" fill="#0F172A" stroke="url(#indigoAccentGrad)" strokeWidth="2.5" />
          <circle cx="260" cy="342" r="14" fill="url(#coreGlow)" />
          <circle cx="260" cy="342" r="7" fill="#FFFFFF" filter="url(#softGlow)" />

          {/* Robot Head Assembly */}
          <g>
            {/* Ear Pods */}
            {/* Left Ear */}
            <rect x="172" y="180" width="18" height="40" rx="8" fill="url(#robotWhiteShell)" stroke="#CBD5E1" strokeWidth="1" />
            <circle cx="181" cy="200" r="5" fill="none" stroke="#6366F1" strokeWidth="2" />
            {/* Right Ear */}
            <rect x="330" y="180" width="18" height="40" rx="8" fill="url(#robotWhiteShell)" stroke="#CBD5E1" strokeWidth="1" />
            <circle cx="339" cy="200" r="5" fill="none" stroke="#6366F1" strokeWidth="2" />

            {/* Helmet Outer Shell */}
            <rect x="182" y="130" width="156" height="136" rx="36" fill="url(#robotWhiteShell)" stroke="#CBD5E1" strokeWidth="1.5" />

            {/* Indigo Head Brow Trim */}
            <path d="M 210 148 Q 260 142 310 148" stroke="url(#indigoAccentGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Curved Navy Visor Face Display */}
            <rect x="198" y="156" width="124" height="92" rx="24" fill="url(#robotNavyVisor)" stroke="#1E293B" strokeWidth="1.5" />
            
            {/* Subtle Visor Reflection Sheen */}
            <path
              d="M 206 172 C 235 162, 285 162, 314 172"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeOpacity="0.18"
              strokeLinecap="round"
              fill="none"
            />

            {/* Friendly Cyan Illuminated Eyes */}
            {/* Left Eye */}
            <rect x="222" y="184" width="16" height="26" rx="8" fill="url(#cyanGlowGrad)" filter="url(#softGlow)" />
            <circle cx="230" cy="192" r="3" fill="#FFFFFF" />
            {/* Right Eye */}
            <rect x="282" y="184" width="16" height="26" rx="8" fill="url(#cyanGlowGrad)" filter="url(#softGlow)" />
            <circle cx="290" cy="192" r="3" fill="#FFFFFF" />

            {/* Friendly Voice Status Bar */}
            <rect x="247" y="226" width="26" height="5" rx="2.5" fill="#38BDF8" opacity="0.85" />
          </g>
        </g>

        {/* 6. Companion Robot #3 (Lower-Right Assistant Orb) */}
        <g transform="translate(410, 310)">
          {/* Orbital Gyroscopic Ring */}
          <ellipse
            cx="24"
            cy="24"
            rx="36"
            ry="14"
            fill="none"
            stroke="url(#indigoAccentGrad)"
            strokeWidth="2.2"
            transform="rotate(-28 24 24)"
          />
          {/* Assistant Orb Body */}
          <circle cx="24" cy="24" r="22" fill="url(#robotWhiteShell)" stroke="#CBD5E1" strokeWidth="1.2" />
          {/* Equatorial Navy Seam */}
          <path d="M 4 24 Q 24 29 44 24" stroke="#0F172A" strokeWidth="3" fill="none" />
          {/* Optical Cyan Eye */}
          <circle cx="24" cy="22" r="8" fill="#0B1528" />
          <circle cx="24" cy="22" r="5" fill="url(#cyanGlowGrad)" filter="url(#softGlow)" />
          <circle cx="25" cy="20" r="1.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}

export function Hero3D() {
  const [shouldRender3D, setShouldRender3D] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // 2. Check for Save-Data mode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saveData = (navigator as any).connection?.saveData === true;

    // 3. Check for WebGL capability
    let hasWebGL = false;
    try {
      const canvas = document.createElement("canvas");
      hasWebGL = Boolean(
        window.WebGLRenderingContext &&
          (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch {
      hasWebGL = false;
    }

    // Only render 3D if conditions pass
    if (hasWebGL && !prefersReducedMotion && !saveData) {
      // Delay mounting slightly until after initial paint so LCP poster paints first
      const timer = setTimeout(() => {
        setShouldRender3D(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  // IntersectionObserver to pause rendering when off-screen
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry?.isIntersecting ?? false);
      },
      { rootMargin: "100px" }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full flex items-center justify-center">
      {shouldRender3D ? (
        <Hero3DScene isInView={isInView} />
      ) : (
        <Hero3DPoster />
      )}
    </div>
  );
}
