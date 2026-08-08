import { ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL } from "@/lib/elevenlabs-client";

const API_KEY = process.env.ELEVENLABS_API_KEY;

interface ElevenLabsRequest {
  text?: unknown;
  voiceId?: unknown;
}

function clientError(code: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: code,
    headers: { "Content-Type": "application/json", "X-Error-Code": String(code) },
  });
}

/**
 * Server-side proxy to ElevenLabs text-to-speech.
 *
 * Keeps the API key server-side (never exposed to the browser). Receives a
 * JSON body { text, voiceId? } and streams back the generated MP3 audio.
 *
 * Falls through to a 503 if the key isn't configured — the client handles
 * that by switching to browser-native SpeechSynthesis as a fallback.
 */
export async function POST(request: Request): Promise<Response> {
  if (!API_KEY) {
    return clientError(503, "ElevenLabs API key is not configured.");
  }

  let body: ElevenLabsRequest;
  try {
    body = (await request.json()) as ElevenLabsRequest;
  } catch {
    return clientError(400, "Invalid request body. Expected JSON.");
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return clientError(400, "Missing or empty 'text' field.");
  }

  // Cap text length — ElevenLabs bills per character and very long inputs
  // are slow to generate. 2000 chars ≈ 3 minutes of speech, plenty for a
  // single assistant reply.
  const MAX_CHARS = 2000;
  const truncated = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

  const voiceId =
    typeof body.voiceId === "string" && body.voiceId.trim()
      ? body.voiceId.trim()
      : ELEVENLABS_VOICE_ID;

  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": API_KEY,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text: truncated,
          model_id: ELEVENLABS_MODEL,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!upstream.ok) {
      const status = upstream.status;
      // Surface a structured error the client can branch on
      let message = "ElevenLabs request failed.";
      try {
        const errBody = (await upstream.json()) as { detail?: unknown };
        if (Array.isArray(errBody.detail) && errBody.detail[0]?.msg) {
          message = String(errBody.detail[0].msg);
        } else if (typeof errBody.detail === "string") {
          message = errBody.detail;
        }
      } catch {
        /* response wasn't JSON — keep the generic message */
      }

      // 401/403 → config issue; 402 → quota/plan; 429 → rate limit
      return clientError(status, message);
    }

    // Stream the MP3 straight back to the browser
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error.";
    return clientError(502, message);
  }
}
