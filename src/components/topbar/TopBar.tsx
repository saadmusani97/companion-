"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useCompanion } from "@/store/companion";
import { useSendTurn } from "@/lib/use-send-turn";
import { useVoice } from "@/lib/use-voice";
import { MicIcon } from "@/components/icons";
import { STATUS_LABELS } from "@/lib/labels";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const orbState = useCompanion((s) => s.orbState);
  const { send } = useSendTurn();

  const { recording, status, supported, disabled, startRecording, stopRecording } = useVoice({
    onTranscript: (text) => send(text, { voice: true }),
  });

  const micDisabled = !supported || disabled;

  // Safety net: if pointer leaves the window while held, stop recording
  useEffect(() => {
    const up = () => { if (recording) stopRecording(); };
    window.addEventListener("pointerup",     up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup",     up);
      window.removeEventListener("pointercancel", up);
    };
  }, [recording, stopRecording]);

  return (
    <header className="flex items-center justify-between gap-6 px-8 pt-6">

      {/* Left — title */}
      <div className="min-w-0">
        <motion.h1
          key={title}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="truncate text-[15px] font-medium tracking-tight text-ink-primary"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <p className="mt-0.5 truncate text-[12px] text-ink-tertiary">{subtitle}</p>
        )}
      </div>

      {/* Right — status pill + mic button */}
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-3">

          {/* Status pill */}
          <div className="hidden items-center gap-2 rounded-full border border-line-subtle bg-white/[0.02] px-3 py-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[11px] font-medium tracking-wide text-ink-secondary">
              {STATUS_LABELS[orbState]}
            </span>
          </div>

          {/* Mic button — hold to record */}
          <button
            onPointerDown={(e) => {
              if (micDisabled) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              startRecording();
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              stopRecording();
            }}
            onPointerCancel={stopRecording}
            onContextMenu={(e) => e.preventDefault()}
            disabled={micDisabled}
            aria-pressed={recording}
            aria-label={recording ? "Recording — release to send" : "Hold to speak"}
            title={
              !supported ? "Microphone not available in this browser" :
              disabled   ? "Friday is busy" :
              recording  ? "Release to send" :
                           "Hold to speak — or hold Space"
            }
            className={[
              "relative grid h-10 w-10 select-none place-items-center rounded-full border",
              "transition-colors duration-150",
              micDisabled
                ? "cursor-not-allowed border-line-subtle text-ink-muted opacity-40"
                : recording
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-line-strong bg-white/[0.03] text-ink-secondary hover:border-accent/50 hover:text-ink-primary",
            ].join(" ")}
          >
            <MicIcon className="h-4 w-4 pointer-events-none" />

            {/* Pulse rings while recording */}
            {recording && (
              <>
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-accent"
                  animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                  transition={{ duration: 0.9, ease: "easeOut", repeat: Infinity }}
                />
                <motion.span
                  className="absolute inset-0 rounded-full border border-accent/50"
                  animate={{ scale: [1, 1.9], opacity: [0.5, 0] }}
                  transition={{ duration: 0.9, ease: "easeOut", repeat: Infinity, delay: 0.25 }}
                />
              </>
            )}
          </button>
        </div>

        {/* Status line */}
        {status ? (
          <motion.p
            key={status}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            className={[
              "max-w-[280px] truncate text-[11px]",
              status.toLowerCase().includes("block") ||
              status.toLowerCase().includes("error") ||
              status.toLowerCase().includes("fail") ||
              status.toLowerCase().includes("network") ||
              status.toLowerCase().includes("couldn")
                ? "text-red-400"
                : recording
                  ? "font-medium text-accent"
                  : "italic text-ink-tertiary",
            ].join(" ")}
          >
            {recording ? `🎙 ${status}` : status}
          </motion.p>
        ) : (
          supported && !disabled && (
            <p className="text-[10px] text-ink-muted select-none">
              hold <kbd className="font-mono">Space</kbd> or mic to speak
            </p>
          )
        )}
      </div>
    </header>
  );
}
