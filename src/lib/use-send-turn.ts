"use client";

import { useRef } from "react";
import { useCompanion } from "@/store/companion";
import { streamChat, StreamError } from "@/lib/chat-client";
import { uid } from "@/lib/utils";
import type { Message } from "@/lib/types";

/**
 * ════════════════════════════════════════════════════════════════════════
 *  SEND-TURN — clean rebuild
 * ════════════════════════════════════════════════════════════════════════
 *
 *  Orchestrates a single user turn:
 *
 *    user message → thinking → stream Groq reply → complete → idle
 *
 *  `voice` flag marks the user message as voice-initiated, which the voice
 *  hook reads to decide whether to speak the reply aloud.
 * ════════════════════════════════════════════════════════════════════════
 */
export function useSendTurn() {
  const addMessage = useCompanion((s) => s.addMessage);
  const updateMessage = useCompanion((s) => s.updateMessage);
  const setOrbState = useCompanion((s) => s.setOrbState);
  const abortRef = useRef<(() => void) | null>(null);

  async function send(text: string, opts?: { voice?: boolean }) {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Cancel any in-flight request.
    abortRef.current?.();
    abortRef.current = null;

    // Ensure we have a session.
    const state = useCompanion.getState();
    let sessionId = state.activeSessionId;
    if (!sessionId) sessionId = state.createSession();

    // ── Add the user message ──
    const userMessage: Message = {
      id: uid("msg"),
      role: "user",
      content: trimmed,
      status: "complete",
      createdAt: Date.now(),
      voice: opts?.voice ?? false,
    };
    addMessage(sessionId, userMessage);

    setOrbState("thinking");

    // ── Gather history (all complete messages so far) ──
    const history = useCompanion
      .getState()
      .sessions.find((s) => s.id === sessionId)!
      .messages.filter((m) => m.status === "complete");

    // ── Add a streaming assistant message placeholder ──
    const assistantMessage: Message = {
      id: uid("msg"),
      role: "assistant",
      content: "",
      status: "streaming",
      createdAt: Date.now(),
    };
    addMessage(sessionId, assistantMessage);

    // ── Stream from Groq ──
    try {
      const { stream, abort } = streamChat(history);
      abortRef.current = abort;

      setOrbState("responding");

      const reader = stream.getReader();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += value;
        updateMessage(sessionId, assistantMessage.id, {
          content: acc,
          status: "streaming",
        });
      }

      updateMessage(sessionId, assistantMessage.id, {
        content: acc,
        status: "complete",
      });
      setOrbState("idle");
    } catch (err: unknown) {
      if (err instanceof StreamError) {
        updateMessage(sessionId, assistantMessage.id, {
          content: err.message,
          status: "error",
        });
      } else if (err instanceof Error && err.name === "AbortError") {
        const current = useCompanion
          .getState()
          .sessions.find((s) => s.id === sessionId)
          ?.messages.find((m) => m.id === assistantMessage.id);
        updateMessage(sessionId, assistantMessage.id, {
          status: "complete",
          content: current?.content || "Cancelled.",
        });
      } else {
        updateMessage(sessionId, assistantMessage.id, {
          content: "Something went wrong. Please try again.",
          status: "error",
        });
      }
      setOrbState("idle");
    } finally {
      abortRef.current = null;
    }
  }

  return { send };
}
