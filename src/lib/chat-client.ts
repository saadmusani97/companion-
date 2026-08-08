import type { Message } from "./types";

interface StreamResult {
  stream: ReadableStream<string>;
  abort: () => void;
}

/**
 * Opens a streaming connection to the backend /api/chat endpoint.
 *
 * The backend proxies to Groq (OpenAI-compatible) and forwards text deltas
 * as a plain-text stream. This client wraps the fetch in a ReadableStream<string>
 * and exposes an abort handle so the orchestrator can cancel mid-generation.
 */
export function streamChat(messages: Message[]): StreamResult {
  const abortController = new AbortController();
  const signal = abortController.signal;

  const payload: { role: "user" | "assistant"; content: string }[] = messages
    .filter((m) => m.status === "complete" && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content }));

  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payload }),
          signal,
        });

        if (!response.ok) {
          const errorBody = await parseErrorBody(response);
          let userMessage: string;

          // The backend sends structured errors with an X-Error-Code header.
          // Fall back to a generic message for unexpected statuses.
          switch (response.status) {
            case 401:
            case 403:
              userMessage =
                "Companion services are unavailable. Please check the API configuration.";
              break;
            case 429:
              userMessage =
                "Friday is receiving too many requests. Wait a moment and try again.";
              break;
            default:
              userMessage = errorBody || "Something went wrong. Please try again.";
              break;
          }
          controller.error(new StreamError(userMessage, response.status));
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.error(new StreamError("No response body received.", 0));
          return;
        }

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            controller.enqueue(chunk);
          }
        }

        controller.close();
      } catch (err: unknown) {
        if (signal.aborted) {
          controller.close();
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Connection lost. Check your network and try again.";
        controller.error(new StreamError(message, 0));
      }
    },
  });

  return {
    stream,
    abort: () => abortController.abort(),
  };
}

async function parseErrorBody(response: Response): Promise<string | null> {
  try {
    const body = await response.json();
    if (body && typeof body === "object" && typeof body.error === "string") {
      return body.error as string;
    }
    return null;
  } catch {
    return null;
  }
}

export class StreamError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "StreamError";
  }
}
