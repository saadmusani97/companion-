"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useCompanion } from "@/store/companion";

const SILK = [0.22, 1, 0.36, 1] as const;

export function MinimizedChatPill() {
  const chatWindow = useCompanion((s) => s.chatWindow);
  const activeId = useCompanion((s) => s.activeSessionId);
  const lastMsg = useCompanion((s) => {
    const session = s.sessions.find((sess) => sess.id === activeId);
    const msgs = session?.messages ?? [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "assistant" && msgs[i].content) return msgs[i].content;
    }
    return null;
  });
  const setChatWindowMode = useCompanion((s) => s.setChatWindowMode);

  const preview = useMemo(() => {
    if (!lastMsg) return null;
    const collapsed = lastMsg.replace(/\s+/g, " ").trim();
    return collapsed.length > 60 ? collapsed.slice(0, 60) + "…" : collapsed;
  }, [lastMsg]);

  if (chatWindow.mode !== "minimized") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3, ease: SILK }}
      className="pointer-events-auto fixed bottom-6 right-6 z-50"
    >
      <button
        type="button"
        onClick={() => setChatWindowMode("open")}
        className="flex items-center gap-3 rounded-full border border-line-strong bg-bg-elevated/85 px-4 py-2.5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-accent/50 hover:bg-bg-elevated/95 hover:shadow-[0_0_24px_-4px_var(--accent-glow)]"
      >
        <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/15">
          <motion.span
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="block h-2 w-2 rounded-full bg-accent"
          />
        </span>
        <span className="min-w-0 text-left">
          <span className="block text-[12.5px] font-medium text-ink-primary leading-tight">
            Friday
          </span>
          {preview && (
            <span className="mt-0.5 block max-w-[220px] truncate text-[11px] text-ink-tertiary leading-tight">
              {preview}
            </span>
          )}
        </span>
      </button>
    </motion.div>
  );
}