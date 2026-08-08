"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useCompanion } from "@/store/companion";
import { useSendTurn } from "@/lib/use-send-turn";
import { FRIDAY_OPENING } from "@/lib/friday";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";

export function ChatPanel() {
  const activeId = useCompanion((s) => s.activeSessionId);
  const session = useCompanion((s) =>
    s.sessions.find((sess) => sess.id === activeId),
  );
  const orbState = useCompanion((s) => s.orbState);
  const { send } = useSendTurn();

  const messages = useMemo(() => session?.messages ?? [], [session]);
  const busy = orbState === "thinking" || orbState === "responding";

  return (
    <section className="flex h-full min-h-0 flex-col">
      <MessageList messages={messages} />
      <Composer onSend={send} disabled={busy} />
    </section>
  );
}

export function ChatEmptyHint() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none absolute inset-x-0 bottom-32 mx-auto max-w-md px-6 text-center"
    >
      <p className="text-balance text-[13.5px] leading-relaxed text-ink-secondary">
        {FRIDAY_OPENING}
      </p>
    </motion.div>
  );
}
