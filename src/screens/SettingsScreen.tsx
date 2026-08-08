"use client";

import { motion } from "framer-motion";
import { useCompanion } from "@/store/companion";
import { TopBar } from "@/components/topbar/TopBar";
import { CheckIcon } from "@/components/icons";
import { ACCENT_LIST, ANIMATION_SPEEDS } from "@/lib/presets";
import type { AccentKey, AnimationSpeed } from "@/lib/types";

export function SettingsScreen() {
  const accent = useCompanion((s) => s.settings.accent);
  const speed = useCompanion((s) => s.settings.animationSpeed);
  const setAccent = useCompanion((s) => s.setAccent);
  const setSpeed = useCompanion((s) => s.setAnimationSpeed);

  return (
    <div className="relative flex h-full">
      <div className="flex flex-1 flex-col">
        <TopBar title="Settings" subtitle="Make it yours" />
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-8">
            <Section
              title="Appearance"
              description="Friday ships in a single dark theme. Pick the accent that feels right."
            >
              <Row label="Theme">
                <Pill active>Dark</Pill>
                <Pill disabled>Light</Pill>
                <Pill disabled>System</Pill>
              </Row>
            </Section>

            <Section title="Accent color" description="Used across the orb, highlights, and focus rings.">
              <div className="flex flex-wrap items-center gap-3">
                {ACCENT_LIST.map((preset) => {
                  const selected = preset.key === accent;
                  return (
                    <button
                      key={preset.key}
                      onClick={() => setAccent(preset.key as AccentKey)}
                      aria-pressed={selected}
                      aria-label={preset.label}
                      className="group relative h-11 w-11 rounded-2xl border transition-all duration-300"
                      style={{
                        borderColor: selected ? preset.hex : "rgba(255,255,255,0.08)",
                        background: `radial-gradient(circle at 35% 30%, ${preset.soft}, ${preset.hex})`,
                        boxShadow: selected ? `0 0 24px -6px ${preset.glow}` : "none",
                      }}
                    >
                      {selected && (
                        <motion.span
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute inset-0 grid place-items-center text-bg-base"
                        >
                          <CheckIcon className="h-4 w-4" strokeWidth={2.4} />
                        </motion.span>
                      )}
                    </button>
                  );
                })}
                <span className="ml-1 text-[12.5px] text-ink-secondary">
                  {ACCENT_LIST.find((p) => p.key === accent)?.label}
                </span>
              </div>
            </Section>

            <Section title="Animation speed" description="Tempo of the orb and interface motion.">
              <Row label="Speed">
                {ANIMATION_SPEEDS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSpeed(opt.key as AnimationSpeed)}
                    aria-pressed={speed === opt.key}
                    className={`rounded-full border px-4 py-1.5 text-[12.5px] font-medium transition-colors duration-300 ${
                      speed === opt.key
                        ? "border-accent/50 bg-accent/12 text-accent"
                        : "border-line-subtle bg-white/[0.02] text-ink-secondary hover:text-ink-primary"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </Row>
            </Section>

            <div className="rounded-3xl border border-line-subtle bg-white/[0.015] px-5 py-4">
              <p className="text-[12px] leading-relaxed text-ink-tertiary">
                This is Friday <span className="text-ink-secondary">v0.1</span>. Settings stay on this
                device. More arrives with every release.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel kept consistent with other screens */}
      <div className="relative flex w-[440px] shrink-0 items-center justify-center border-l border-line-subtle bg-bg-surface/30">
        <motion.div
          key={accent + speed}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-tertiary">Preview</p>
          <div className="mt-4 grid place-items-center">
            <span
              className="block h-24 w-24 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, var(--accent-soft), var(--accent))",
                boxShadow: "0 0 50px -8px var(--accent-glow)",
              }}
            />
          </div>
          <p className="mt-5 text-[13px] text-ink-secondary">
            {ACCENT_LIST.find((p) => p.key === accent)?.label} ·{" "}
            {ANIMATION_SPEEDS.find((s) => s.key === speed)?.label}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[15px] font-medium text-ink-primary">{title}</h2>
      <p className="mt-1 text-[12.5px] text-ink-tertiary">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-16 text-[12.5px] text-ink-secondary">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function Pill({
  children,
  active,
  disabled,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-4 py-1.5 text-[12.5px] font-medium ${
        active
          ? "border-accent/50 bg-accent/12 text-accent"
          : disabled
            ? "border-line-subtle bg-white/[0.01] text-ink-muted"
            : "border-line-subtle bg-white/[0.02] text-ink-secondary"
      }`}
    >
      {children}
    </span>
  );
}
