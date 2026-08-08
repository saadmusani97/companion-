"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { OrbState } from "@/lib/types";

interface JarvisVideoProps {
  state: OrbState;
  /**
   * Fixed pixel size. When omitted, the video sizes itself to the viewport —
   * large on desktop, scaled down on smaller windows — so it always sits
   * centered without overflowing the stage.
   */
  size?: number;
}

function useResponsiveSize(): number {
  const [size, setSize] = useState(() => computeSize());
  useEffect(() => {
    const update = () => setSize(computeSize());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

function computeSize(): number {
  if (typeof window === "undefined") return 420;
  const shortest = Math.min(window.innerWidth, window.innerHeight);
  // Fill ~46% of the shortest viewport axis, clamped to a sensible range.
  return Math.max(280, Math.min(620, Math.round(shortest * 0.46)));
}

/**
 * Looping Jarvis video that replaces the animated orb on the home screen.
 *
 * The video itself always plays in a seamless loop; the surrounding glow and
 * outer ring still react to the orb state machine so the companion keeps its
 * sense of being "alive" while thinking, responding, or listening.
 *
 * Browser autoplay policy requires `muted` + `playsInline` for autoplay to
 * work without a user gesture — both are set on the element.
 */
export function JarvisVideo({ state, size }: JarvisVideoProps) {
  const responsiveSize = useResponsiveSize();
  const resolvedSize = size ?? responsiveSize;
  const layers = glowConfig(state);

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: resolvedSize, height: resolvedSize }}
      role="img"
      aria-label={`Friday is ${state}`}
    >
      {/* Ambient glow that reacts to state */}
      <motion.div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: resolvedSize * 1.15,
          height: resolvedSize * 1.15,
          background: "radial-gradient(circle at 50% 50%, var(--accent-glow), transparent 62%)",
          filter: "blur(20px)",
        }}
        animate={{ opacity: layers.opacity, scale: layers.scale }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Rotating accent ring framing the video */}
      <motion.div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: resolvedSize * 1.02,
          height: resolvedSize * 1.02,
          background:
            "conic-gradient(from 0deg, transparent 0%, var(--accent) 22%, transparent 48%, transparent 100%)",
          opacity: 0.5,
          maskImage: "radial-gradient(closest-side, transparent 80%, #000 82%, #000 100%)",
          WebkitMaskImage: "radial-gradient(closest-side, transparent 80%, #000 82%, #000 100%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: layers.ringDuration, ease: "linear", repeat: Infinity }}
      />

      {/* The looping video itself */}
      <video
        className="relative rounded-full object-cover"
        style={{
          width: resolvedSize,
          height: resolvedSize,
          boxShadow:
            "0 0 60px -10px var(--accent-glow), inset 0 0 40px rgba(0,0,0,0.4)",
        }}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster=""
      >
        <source src="/jarvis.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

interface GlowLayer {
  opacity: number[];
  scale: number[];
  ringDuration: number;
}

function glowConfig(state: OrbState): GlowLayer {
  switch (state) {
    case "thinking":
      return {
        opacity: [0.5, 0.85, 0.5],
        scale: [1, 1.05, 1],
        ringDuration: 3.2,
      };
    case "responding":
      return {
        opacity: [0.65, 1, 0.65],
        scale: [1, 1.08, 1],
        ringDuration: 2.2,
      };
    case "listening":
      return {
        opacity: [0.55, 0.9, 0.55],
        scale: [1, 1.07, 1],
        ringDuration: 5,
      };
    case "idle":
    default:
      return {
        opacity: [0.35, 0.6, 0.35],
        scale: [1, 1.03, 1],
        ringDuration: 14,
      };
  }
}
