"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCompanion } from "@/store/companion";
import { speak, stop as stopSpeaking } from "@/lib/speak";

/**
 * Voice pipeline — Web Speech API (STT) + ElevenLabs (TTS)
 *
 * PUSH-TO-TALK:
 *   - Hold Space bar OR hold mic button → listens continuously
 *   - Release → sends final transcript to Friday
 *
 * CONTINUOUS HOLD:
 *   Chrome auto-stops SpeechRecognition after ~5s of silence even with
 *   continuous:true. We restart it automatically while the user is still
 *   holding so it never cuts out mid-sentence.
 */

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SR extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart:  (() => void) | null;
  onend:    (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror:  ((e: SpeechRecognitionErrorEvent) => void) | null;
}

function getSRClass(): (new () => SR) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SR) | null;
}

export interface UseVoiceReturn {
  recording: boolean;
  status: string;
  supported: boolean;
  disabled: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

export function useVoice({ onTranscript }: { onTranscript: (t: string) => void }): UseVoiceReturn {
  const orbState    = useCompanion((s) => s.orbState);
  const setOrbState = useCompanion((s) => s.setOrbState);
  const sessions    = useCompanion((s) => s.sessions);
  const activeId    = useCompanion((s) => s.activeSessionId);

  const [recording, setRecording] = useState(false);
  const [status,    setStatus]    = useState("");
  const [supported, setSupported] = useState(false);

  // ── refs ────────────────────────────────────────────────────────────
  const srRef           = useRef<SR | null>(null);
  const holdingRef      = useRef(false);      // true while Space/button is held
  const accTextRef      = useRef("");         // accumulated final transcript
  const lastSpokenRef   = useRef<string | null>(null);
  const mountedAtRef    = useRef(Date.now());
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  // stable refs so spacebar handler (mounted once) always calls latest fns
  const startRef = useRef<() => void>(() => {});
  const stopRef  = useRef<() => void>(() => {});
  const orbRef   = useRef(orbState);
  orbRef.current = orbState;

  // ── support check ───────────────────────────────────────────────────
  useEffect(() => {
    setSupported(getSRClass() !== null);
    mountedAtRef.current = Date.now();
  }, []);

  // ── cleanup ──────────────────────────────────────────────────────────
  useEffect(() => () => { srRef.current?.abort(); }, []);

  // ── TTS: speak reply after voice turn ───────────────────────────────
  useEffect(() => {
    if (orbState !== "idle") return;
    const session = sessions.find((s) => s.id === activeId);
    if (!session) return;
    const msgs = session.messages;
    const last = msgs[msgs.length - 1];
    if (!last || last.role !== "assistant" || last.status !== "complete") return;
    if (last.id === lastSpokenRef.current) return;
    if (last.createdAt < mountedAtRef.current) return;
    const prevUser = [...msgs].reverse().find((m) => m.role === "user");
    if (!prevUser?.voice) return;
    lastSpokenRef.current = last.id;
    speak(last.content);
  }, [orbState, sessions, activeId]);

  // stop TTS when listening/thinking
  useEffect(() => {
    if (orbState === "listening" || orbState === "thinking") stopSpeaking();
  }, [orbState]);

  // ── spacebar — mounted once ──────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if ((e.target as HTMLElement).isContentEditable) return;
      e.preventDefault();
      if (e.repeat) return; // ignore key-repeat events
      if (orbRef.current === "thinking" || orbRef.current === "responding") return;
      startRef.current();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      stopRef.current();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup",   up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup",   up);
    };
  }, []);

  // ── createAndStartSR: internal — starts one SR instance ─────────────
  const createAndStartSR = useCallback(() => {
    const SRClass = getSRClass();
    if (!SRClass) return;

    // abort any existing instance cleanly
    try { srRef.current?.abort(); } catch { /* noop */ }

    const sr = new SRClass();
    sr.continuous     = true;
    sr.interimResults = true;
    sr.lang           = "en-US";
    srRef.current     = sr;

    sr.onstart = () => {
      console.log("[voice] SR started");
      setRecording(true);
      setOrbState("listening");
      if (!accTextRef.current) setStatus("Listening…");
    };

    sr.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final   = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + " ";
        else interim += t;
      }
      if (final) accTextRef.current += final;
      setStatus((accTextRef.current + interim).trim());
    };

    sr.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.warn("[voice] SR error:", e.error);
      // "aborted" = we called abort() ourselves, not a real error
      // "no-speech" = silence timeout — restart if still holding
      if (e.error === "aborted") return;
      if (e.error === "no-speech" && holdingRef.current) return; // onend will restart
      if (e.error === "no-speech") {
        setStatus("No speech — try again.");
        setTimeout(() => setStatus(""), 2500);
        setRecording(false);
        setOrbState("idle");
        return;
      }
      setStatus(`Mic error: ${e.error}`);
      setTimeout(() => setStatus(""), 3000);
      setRecording(false);
      setOrbState("idle");
      holdingRef.current = false;
    };

    sr.onend = () => {
      console.log("[voice] SR ended, holding:", holdingRef.current);
      // Chrome kills SR after silence — if still holding, restart it
      if (holdingRef.current) {
        console.log("[voice] restarting SR (still holding)");
        setTimeout(() => {
          if (holdingRef.current) createAndStartSR();
        }, 100);
        return;
      }
      // User released — send the transcript
      const text = accTextRef.current.trim();
      setRecording(false);
      srRef.current = null;

      if (!text) {
        setOrbState("idle");
        setStatus("");
        return;
      }

      console.log("[voice] final transcript:", JSON.stringify(text));
      setStatus(text);
      setTimeout(() => setStatus(""), 3000);
      onTranscriptRef.current(text);
    };

    try {
      sr.start();
    } catch (err) {
      console.error("[voice] SR.start() threw:", err);
      setStatus("Could not start microphone.");
      setTimeout(() => setStatus(""), 3000);
      setRecording(false);
      setOrbState("idle");
      holdingRef.current = false;
    }
  }, [setOrbState]);

  // ── startRecording (public) ──────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (holdingRef.current) return;              // already recording
    if (orbRef.current === "thinking" || orbRef.current === "responding") return;

    holdingRef.current   = true;
    accTextRef.current   = "";
    setStatus("Listening…");
    createAndStartSR();
  }, [createAndStartSR]);

  // ── stopRecording (public) ───────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    console.log("[voice] stop called");
    const sr = srRef.current;
    if (sr) {
      srRef.current = null;
      sr.stop(); // triggers onend → sends transcript
    } else {
      // SR already ended (e.g. silence timeout) — send whatever we accumulated
      const text = accTextRef.current.trim();
      accTextRef.current = "";
      setRecording(false);
      if (!text) { setOrbState("idle"); setStatus(""); return; }
      setStatus(text);
      setTimeout(() => setStatus(""), 3000);
      onTranscriptRef.current(text);
    }
  }, [setOrbState]);

  startRef.current = startRecording;
  stopRef.current  = stopRecording;

  return {
    recording,
    status,
    supported,
    disabled: orbState === "thinking" || orbState === "responding",
    startRecording,
    stopRecording,
  };
}
