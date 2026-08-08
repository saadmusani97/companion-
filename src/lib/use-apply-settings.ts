"use client";

import { useEffect } from "react";
import { useCompanion } from "@/store/companion";
import { ACCENTS, SPEED_TEMPO } from "@/lib/presets";

/**
 * Reflects settings onto the document via CSS variables so Tailwind's
 * accent tokens and Framer Motion timing can read them at runtime.
 */
export function useApplySettings() {
  const accent = useCompanion((s) => s.settings.accent);
  const speed = useCompanion((s) => s.settings.animationSpeed);
  const hydrate = useCompanion((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const preset = ACCENTS[accent];
    const root = document.documentElement;
    root.style.setProperty("--accent", preset.hex);
    root.style.setProperty("--accent-soft", preset.soft);
    root.style.setProperty("--accent-glow", preset.glow);
  }, [accent]);

  useEffect(() => {
    document.documentElement.style.setProperty("--tempo", String(SPEED_TEMPO[speed]));
  }, [speed]);
}
