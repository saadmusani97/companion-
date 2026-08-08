"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Message } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);

  // Auto-scroll to the newest message while the user is pinned to the bottom.
  useEffect(() => {
    if (pinned) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, pinned]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setPinned(distance < 80);
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-6 py-6"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </AnimatePresence>
          <div ref={endRef} className="h-1" />
        </div>
      </div>

      <AnimatePresence>
        {!pinned && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              setPinned(true);
              endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-line-strong bg-bg-elevated/80 px-3 py-1.5 text-[11px] font-medium text-ink-secondary backdrop-blur-md hover:text-ink-primary"
          >
            Latest
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
