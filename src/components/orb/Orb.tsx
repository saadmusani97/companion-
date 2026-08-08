"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import type { OrbState } from "@/lib/types";

interface OrbProps {
  state: OrbState;
  size?: number;
}

/**
 * The AI orb. A layered composition:
 *   - outer halo (ambient glow)
 *   - mid ring (rotating accent arc)
 *   - core sphere (radial gradient + breathing)
 *
 * State changes morph the animation timing and intensity — idle is slow and
 * calm, thinking pulses, responding glows, listening breathes wide.
 */
export function Orb({ state, size = 280 }: OrbProps) {
  const tempo = useMemo(() => "var(--tempo)", []);

  const core = size * 0.62;
  const halo = size;

  const layers = stateConfig(state);

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: halo, height: halo }}
      aria-label={`Friday is ${state}`}
      role="img"
    >
      {/* Ambient halo */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: halo,
          height: halo,
          background: `radial-gradient(circle at 50% 45%, var(--accent-glow), transparent 62%)`,
          filter: "blur(8px)",
        }}
        animate={{ opacity: layers.haloOpacity, scale: layers.haloScale }}
        transition={{ duration: 1.6 * 1, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Rotating accent ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.92,
          height: size * 0.92,
          background: `conic-gradient(from 0deg, transparent 0%, var(--accent) 22%, transparent 48%, transparent 100%)`,
          opacity: 0.55,
          maskImage: "radial-gradient(closest-side, transparent 78%, #000 80%, #000 100%)",
          WebkitMaskImage: "radial-gradient(closest-side, transparent 78%, #000 80%, #000 100%)",
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: layers.ringDuration,
          ease: "linear",
          repeat: Infinity,
        }}
      />

      {/* Counter-rotating faint ring for depth */}
      <motion.div
        className="absolute rounded-full border border-line-subtle"
        style={{ width: size * 0.82, height: size * 0.82 }}
        animate={{ rotate: -360 }}
        transition={{
          duration: 36,
          ease: "linear",
          repeat: Infinity,
        }}
      />

      {/* Core sphere */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: core,
          height: core,
          background: `
            radial-gradient(circle at 35% 30%, rgba(255,255,255,0.22), transparent 45%),
            radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--accent) 78%, #070709), #050507 88%)
          `,
          boxShadow: `
            inset 0 0 40px rgba(0,0,0,0.55),
            inset 0 6px 24px rgba(255,255,255,0.06),
            0 0 60px -8px var(--accent-glow)
          `,
        }}
        animate={{
          scale: layers.coreScale,
          filter: layers.coreFilter,
        }}
        transition={{
          duration: layers.coreDuration,
          ease: [0.22, 1, 0.36, 1],
          repeat: layers.coreRepeat ? Infinity : 0,
          repeatType: "mirror",
        }}
      >
        {/* Inner shimmer */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 120%, var(--accent-glow), transparent 60%)",
            mixBlendMode: "screen",
          }}
          animate={{ opacity: layers.shimmerOpacity }}
          transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
        />
        {/* Specular highlight */}
        <div
          className="absolute rounded-full"
          style={{
            top: "14%",
            left: "22%",
            width: "30%",
            height: "20%",
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.5), transparent 70%)",
            filter: "blur(4px)",
          }}
        />
      </motion.div>

      <span className="sr-only" style={{ display: "none" }}>
        {tempo}
      </span>
    </div>
  );
}

interface StateLayer {
  haloOpacity: number[];
  haloScale: number[];
  ringDuration: number;
  coreScale: number[];
  coreFilter: string[];
  coreDuration: number;
  coreRepeat: boolean;
  shimmerOpacity: number[];
}

function stateConfig(state: OrbState): StateLayer {
  switch (state) {
    case "thinking":
      return {
        haloOpacity: [0.4, 0.75, 0.4],
        haloScale: [0.98, 1.04, 0.98],
        ringDuration: 3.2,
        coreScale: [1, 1.045, 1],
        coreFilter: ["brightness(1)", "brightness(1.15)", "brightness(1)"],
        coreDuration: 1.1,
        coreRepeat: true,
        shimmerOpacity: [0.4, 0.9, 0.4],
      };
    case "responding":
      return {
        haloOpacity: [0.55, 1, 0.55],
        haloScale: [1, 1.08, 1],
        ringDuration: 2.2,
        coreScale: [1, 1.02, 1],
        coreFilter: ["brightness(1.05) saturate(1.1)", "brightness(1.2) saturate(1.2)", "brightness(1.05) saturate(1.1)"],
        coreDuration: 1.6,
        coreRepeat: true,
        shimmerOpacity: [0.6, 1, 0.6],
      };
    case "listening":
      return {
        haloOpacity: [0.4, 0.8, 0.4],
        haloScale: [1, 1.1, 1],
        ringDuration: 5,
        coreScale: [1, 1.06, 1],
        coreFilter: ["brightness(1)", "brightness(1.1)", "brightness(1)"],
        coreDuration: 2.2,
        coreRepeat: true,
        shimmerOpacity: [0.4, 0.9, 0.4],
      };
    case "idle":
    default:
      return {
        haloOpacity: [0.25, 0.5, 0.25],
        haloScale: [0.98, 1.02, 0.98],
        ringDuration: 14,
        coreScale: [1, 1.015, 1],
        coreFilter: ["brightness(0.98)", "brightness(1.04)", "brightness(0.98)"],
        coreDuration: 6,
        coreRepeat: true,
        shimmerOpacity: [0.25, 0.55, 0.25],
      };
  }
}
