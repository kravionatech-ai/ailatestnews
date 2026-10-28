"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { RobotExpression } from "./robot-head-3d";

const RobotHead3DScene = dynamic(() => import("./robot-head-3d"), {
  ssr: false,
  loading: () => <RobotHeadPoster />,
});

export interface RobotHeadCanvasProps {
  expression?: RobotExpression;
  isStreaming?: boolean;
  className?: string;
}

/**
 * 2D SVG Poster Fallback (Rendered while 3D initializes or on low-end devices)
 */
export function RobotHeadPoster() {
  return (
    <div className="w-full h-full flex items-center justify-center select-none" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
        {/* Low rounded crown pad */}
        <rect x="36" y="12" width="28" height="10" rx="5" fill="#D9E0E8" />
        {/* Padded side pods */}
        <rect x="4" y="38" width="20" height="30" rx="9" fill="#E4E9F0" />
        <rect x="76" y="38" width="20" height="30" rx="9" fill="#E4E9F0" />
        {/* Wide ice-white helmet */}
        <path d="M25 21 Q50 15 75 21 Q88 24 89 39 V62 Q88 80 72 83 H28 Q12 80 11 62 V39 Q12 24 25 21Z" fill="#F4F7FB" stroke="#D5DCE5" strokeWidth="2" />
        {/* Silver bezel and deep glass face */}
        <path d="M27 31 Q50 24 73 31 Q82 34 82 43 V60 Q81 73 69 76 H31 Q19 73 18 60 V43 Q18 34 27 31Z" fill="#D5DCE5" />
        <path d="M29 34 Q50 28 71 34 Q78 37 78 45 V59 Q77 70 67 72 H33 Q23 70 22 59 V45 Q22 37 29 34Z" fill="#071A27" />
        {/* Bright expressive turquoise eyes */}
        <path d="M31 53 Q31 43 39 43 Q47 43 47 53 Q46 50 39 50 Q33 50 31 53Z" fill="#5DE5E1" className="animate-pulse" />
        <path d="M53 53 Q53 43 61 43 Q69 43 69 53 Q67 50 61 50 Q54 50 53 53Z" fill="#5DE5E1" className="animate-pulse" />
        {/* Small voice panel */}
        <rect x="44" y="61" width="12" height="6" rx="3" fill="#5DE5E1" />
      </svg>
    </div>
  );
}

export function RobotHeadCanvas({
  expression = "idle",
  isStreaming = false,
  className = "w-20 h-20",
}: RobotHeadCanvasProps) {
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    // Check WebGL availability
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        setCanRender3D(true);
      }
    } catch {
      setCanRender3D(false);
    }
  }, []);

  return (
    <div className={`relative ${className}`} aria-hidden="true">
      {canRender3D ? (
        <RobotHead3DScene expression={expression} isStreaming={isStreaming} />
      ) : (
        <RobotHeadPoster />
      )}
    </div>
  );
}
