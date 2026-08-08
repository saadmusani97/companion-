import type { AccentPreset, AccentKey, AnimationSpeed } from "./types";

export const ACCENTS: Record<AccentKey, AccentPreset> = {
  ember: {
    key: "ember",
    label: "Ember",
    hex: "#ff7a18",
    soft: "#ff9a4a",
    glow: "rgba(255, 122, 24, 0.45)",
  },
  amber: {
    key: "amber",
    label: "Amber",
    hex: "#ffb020",
    soft: "#ffc859",
    glow: "rgba(255, 176, 32, 0.45)",
  },
  violet: {
    key: "violet",
    label: "Violet",
    hex: "#8b5cf6",
    soft: "#a78bfa",
    glow: "rgba(139, 92, 246, 0.45)",
  },
  azure: {
    key: "azure",
    label: "Azure",
    hex: "#38bdf8",
    soft: "#7dd3fc",
    glow: "rgba(56, 189, 248, 0.45)",
  },
  mint: {
    key: "mint",
    label: "Mint",
    hex: "#34d399",
    soft: "#6ee7b7",
    glow: "rgba(52, 211, 153, 0.45)",
  },
};

export const ACCENT_LIST: AccentPreset[] = Object.values(ACCENTS);

export const ANIMATION_SPEEDS: { key: AnimationSpeed; label: string; tempo: number }[] = [
  { key: "calm", label: "Calm", tempo: 0.7 },
  { key: "balanced", label: "Balanced", tempo: 1 },
  { key: "lively", label: "Lively", tempo: 1.4 },
];

export const SPEED_TEMPO: Record<AnimationSpeed, number> = {
  calm: 0.7,
  balanced: 1,
  lively: 1.4,
};
