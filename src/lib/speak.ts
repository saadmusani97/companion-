import { speakWithElevenLabs } from "@/lib/elevenlabs-client";

/**
 * Text-to-speech for Friday's replies.
 *
 * Strategy: prefer ElevenLabs (high-quality Alice voice, configured via
 * ELEVENLABS_API_KEY on the server). If ElevenLabs is unavailable — no key,
 * quota exceeded, network error — fall back to the browser's built-in
 * SpeechSynthesis API so the feature still works.
 *
 * The caller (use-voice.ts) only invokes this when the user's turn was
 * voice-initiated, so typed conversations remain text-only.
 */

/* ── Browser fallback (SpeechSynthesis) ── */

const FALLBACK_RATE = 0.95;
const FALLBACK_PITCH = 0.95;
const FALLBACK_LANG = "en-US";

let fallbackVoice: SpeechSynthesisVoice | null = null;
let voiceLoaded = false;

function pickFallbackVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  // Prefer a female English voice to match Alice
  const female = voices.find(
    (v) =>
      v.lang.startsWith(FALLBACK_LANG) &&
      (v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("victoria") ||
        v.name.toLowerCase().includes("karen") ||
        v.name.toLowerCase().includes("google us english")),
  );
  if (female) return female;
  return voices.find((v) => v.lang.startsWith(FALLBACK_LANG)) ?? voices[0];
}

function ensureFallbackVoice(): void {
  if (voiceLoaded) return;
  voiceLoaded = true;
  fallbackVoice = pickFallbackVoice();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      fallbackVoice = pickFallbackVoice();
    });
  }
}

export function isFallbackSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

/**
 * Strip markdown formatting so TTS reads cleanly.
 */
function cleanForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "") // code blocks
    .replace(/`[^`]+`/g, "") // inline code
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/^[-*+]\s+/gm, "") // bullet lists
    .replace(/^\d+\.\s+/gm, "") // numbered lists
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/\n{2,}/g, ". ") // paragraph breaks → sentence pause
    .replace(/\n/g, " ")
    .trim();
}

/* ── Public API ── */

/**
 * Speak Friday's reply.
 *
 * Tries ElevenLabs first. On any failure, falls back to browser TTS.
 * Never throws — if everything fails, we stay silent rather than crash
 * the chat experience.
 */
export async function speak(text: string): Promise<void> {
  const cleaned = cleanForSpeech(text);
  if (!cleaned) {
    console.log("[speak] skipping — text is empty after cleaning");
    return;
  }

  // Stop anything currently playing first
  stop();

  console.log("[speak] generating audio for:", cleaned.slice(0, 60) + "...");

  try {
    await speakWithElevenLabs(cleaned);
    console.log("[speak] ElevenLabs playback complete");
  } catch (err) {
    // Don't log 503 (no key configured) — expected in some setups
    const msg = err instanceof Error ? err.message : "";
    if (!msg.includes("HTTP 503") && !msg.includes("not configured")) {
      console.warn("[speak] ElevenLabs TTS failed, falling back to browser:", msg);
    } else {
      console.log("[speak] ElevenLabs unavailable, using browser TTS");
    }
    if (isFallbackSupported()) {
      console.log("[speak] starting browser TTS");
      speakWithBrowser(cleaned);
    } else {
      console.warn("[speak] browser TTS not supported — no audio output");
    }
  }
}

/**
 * Synchronous browser-native speech synthesis (the fallback path).
 */
function speakWithBrowser(text: string): void {
  if (!isFallbackSupported()) return;
  ensureFallbackVoice();

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = FALLBACK_RATE;
  utterance.pitch = FALLBACK_PITCH;
  utterance.lang = FALLBACK_LANG;
  if (fallbackVoice) utterance.voice = fallbackVoice;

  window.speechSynthesis.speak(utterance);
}

export function stop(): void {
  // Stop browser TTS
  if (isFallbackSupported()) {
    window.speechSynthesis.cancel();
  }
  // Stop any in-flight <audio> element playing ElevenLabs MP3
  if (typeof window !== "undefined") {
    // Audio elements created by speakWithElevenLabs aren't tracked here;
    // pausing all audio on the page is the simplest correct reset.
    document.querySelectorAll("audio").forEach((a) => {
      a.pause();
      a.currentTime = 0;
    });
  }
}

/** Kept for backwards compatibility — use isFallbackSupported() instead. */
export function isSupported(): boolean {
  return isFallbackSupported();
}
