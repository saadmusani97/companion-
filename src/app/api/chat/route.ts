import { SYSTEM_PROMPT } from "@/lib/system-prompt";

/**
 * ════════════════════════════════════════════════════════════════════════
 *  CHAT ROUTE — Groq (OpenAI-compatible) with Server-Sent Events streaming
 * ════════════════════════════════════════════════════════════════════════
 *
 *  Proxies chat completion requests to Groq's API. Streams text deltas back
 *  to the client as plain-text chunks (the frontend reads them as a
 *  ReadableStream<string>).
 *
 *  Groq is OpenAI-compatible, so the request/response shape matches the
 *  OpenAI Chat Completions API:
 *    POST https://api.groq.com/openai/v1/chat/completions
 *    { model, messages, stream: true }
 * ════════════════════════════════════════════════════════════════════════
 */

const API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Default model — fast, capable, and great for conversational AI.
// Other options on Groq:
//   llama-3.3-70b-versatile   (most capable, slightly slower)
//   llama-3.1-8b-instant      (fastest, smallest)
//   mixtral-8x7b-32768        (long context)
const MODEL_ID = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

function clientError(code: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: code,
    headers: {
      "Content-Type": "application/json",
      "X-Error-Code": String(code),
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!API_KEY) {
    return clientError(503, "Groq API key is not configured.");
  }

  // ── Parse + validate request body ──
  let body: { messages: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return clientError(400, "Invalid request body. Expected JSON with a 'messages' array.");
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return clientError(400, "Messages must be a non-empty array of { role, content } objects.");
  }

  for (const msg of messages) {
    if (msg.role !== "user" && msg.role !== "assistant") {
      return clientError(400, `Invalid role: "${msg.role}". Must be "user" or "assistant".`);
    }
    if (typeof msg.content !== "string") {
      return clientError(400, "Each message must have a string 'content' field.");
    }
  }

  // ── Build the upstream request ──
  // Prepend the system prompt as the first message.
  const upstreamMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  try {
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: upstreamMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const status = upstream.status;
      let message = "Groq request failed.";
      try {
        const errBody = (await upstream.json()) as { error?: { message?: string } };
        if (errBody?.error?.message) message = errBody.error.message;
      } catch {
        /* response wasn't JSON — keep the generic message */
      }

      if (status === 401 || status === 403) {
        return clientError(401, "Companion services are unavailable. Please check the API configuration.");
      }
      if (status === 429) {
        return clientError(429, "Friday is receiving too many requests. Wait a moment and try again.");
      }
      return clientError(status, message);
    }

    // ── Stream the SSE response back as plain-text chunks ──
    // Groq streams as Server-Sent Events: lines like `data: {json}\n\n`.
    // We parse each event, extract the .choices[0].delta.content, and forward
    // only the text to the client.
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE lines (separated by \n\n)
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? ""; // keep the incomplete last line

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data:")) continue;

              const data = trimmed.slice(5).trim();
              if (data === "[DONE]") {
                controller.close();
                return;
              }

              try {
                const json = JSON.parse(data);
                const delta = json?.choices?.[0]?.delta?.content;
                if (typeof delta === "string" && delta) {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // Malformed JSON chunk — skip it
              }
            }
          }
          controller.close();
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Streaming ended unexpectedly.";
          try {
            controller.enqueue(encoder.encode(`\n\n[Error: ${message}]`));
          } catch {
            /* controller may already be closed */
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err: unknown) {
    const status = err instanceof Error && "status" in err ? Number(err.status) : 500;
    const message = err instanceof Error ? err.message : "Friday encountered an issue.";
    return clientError(status, message);
  }
}
