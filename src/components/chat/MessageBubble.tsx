"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/lib/types";
import { formatTime } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const showCaret = message.role === "assistant" && message.status === "streaming";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className={`flex w-full items-end gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && <Avatar />}
      <div className={`flex max-w-[78%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={
            isUser
              ? "rounded-3xl rounded-br-xl border border-accent/30 bg-accent/12 px-4 py-2.5 text-ink-primary"
              : "glass rounded-3xl rounded-bl-xl px-4 py-2.5"
          }
        >
          {isUser ? (
            <p className="prose-chat whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat">
              {message.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              ) : (
                <ThinkingDots />
              )}
              {showCaret && message.content && <StreamingCaret />}
            </div>
          )}
        </div>
        <span className="mt-1 px-1 text-[10px] text-ink-tertiary">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}

function Avatar() {
  return (
    <div className="mb-5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line-subtle bg-bg-elevated">
      <span
        className="h-3 w-3 rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 30%, var(--accent-soft), var(--accent))",
          boxShadow: "0 0 10px -1px var(--accent-glow)",
        }}
      />
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-ink-secondary"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{
            duration: 1.1,
            ease: "easeInOut",
            repeat: Infinity,
            delay: i * 0.16,
          }}
        />
      ))}
    </span>
  );
}

function StreamingCaret() {
  return (
    <motion.span
      className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] rounded-full bg-accent align-middle"
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.9, ease: "easeInOut", repeat: Infinity }}
    />
  );
}
