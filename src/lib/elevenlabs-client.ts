/**
 * ElevenLabs client configuration + browser-side fetcher.
 *
 * The actual API key lives server-side (src/app/api/speak/route.ts) — this
 * module only holds public config (voice ID, model) and a helper that POSTs
 * to our own /api/speak endpoint, then plays the returned MP3.
 */

/**
 * Voice ID to use for Friday.
 *
 * Alice — warm, clear female American voice. Closest available match to the
 * "Friday" character on the user's ElevenLabs plan.
 *
 * Change this in one place to switch voices. Other IDs on the plan:
 *   Bella  (female)  EXAVITQu4vr4xnSDxMaL
 *   George (male)    JBFqnCBsd6RMkjVDRZzb
 *   Adam   (male)    pNInz6obpgDQGcFmaJgB
 *   Antoni (male)    ErXwobaYiN019PkySvjV
 *   Arnold (male)    VR6AewLTigWG4xSOukaG
 *   Charlie(male, AU) pFZP5JQG7iQjIQuC4Bku
 */
export const ELEVENLABS_VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2";

/**
 * Model ID. `eleven_turbo_v2_5` is fast, low-latency, and high quality —
 * the right pick for a conversational AI where responsiveness matters.
 */
export const ELEVENLABS_MODEL = "eleven_turbo_v2_5";

interface SpeakOptions {
  /** Override the default voice ID. */
  voiceId?: string;
}

/**
 * Send text to our /api/speak endpoint, receive an MP3 stream, and play it.
 *
 * Returns a promise that resolves when playback finishes (or rejects on
 * network/HTTP error). Caller should fall back to browser TTS on rejection.
 */
export async function speakWithElevenLabs(text: string, opts?: SpeakOptions): Promise<void> {
  const response = await fetch("/api/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId: opts?.voiceId }),
  });

  if (!response.ok) {
    // Surface a typed error so the caller can branch
    let message = `ElevenLabs request failed (HTTP ${response.status}).`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* keep the generic message */
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  try {
    await playAudio(url);
  } finally {
    // Revoke the object URL after playback (or on error) to free memory
    URL.revokeObjectURL(url);
  }
}

/**
 * Play an audio URL end-to-end. Resolves on completion, rejects on error.
 */
function playAudio(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onerror = () => reject(new Error("Audio playback failed."));
    audio.onended = () => resolve();
    // Some browsers require an explicit play() call which can reject if the
    // page hasn't been interacted with — but TTS only fires after the user
    // clicked the mic, so we should be fine.
    audio.play().catch(reject);
  });
}
