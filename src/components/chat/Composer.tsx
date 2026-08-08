"use client";

import { FormEvent, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SendIcon } from "@/components/icons";

interface ComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function Composer({ onSend, disabled, placeholder = "Message Friday…" }: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea up to a sensible cap.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (disabled) return;
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e as unknown as FormEvent);
    }
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="px-6 pb-6 pt-2">
      <form
        onSubmit={submit}
        className="glass-strong mx-auto flex max-w-2xl items-end gap-2 rounded-3xl border-line-soft p-2 pl-4 transition-colors duration-300 focus-within:border-accent/40"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Message"
          className="max-h-40 flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-ink-primary placeholder:text-ink-tertiary focus:outline-none disabled:opacity-50"
        />
        <motion.button
          type="submit"
          disabled={!canSend}
          whileHover={canSend ? { scale: 1.04 } : undefined}
          whileTap={canSend ? { scale: 0.94 } : undefined}
          aria-label="Send message"
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl transition-colors duration-300 ${
            canSend
              ? "bg-accent text-bg-base"
              : "bg-white/[0.04] text-ink-tertiary"
          }`}
        >
          <SendIcon className="h-4 w-4" />
        </motion.button>
      </form>
      <p className="mx-auto mt-2 max-w-2xl px-2 text-center text-[10.5px] text-ink-tertiary">
        Friday keeps context within this session. v0.1 — conversation only.
      </p>
    </div>
  );
}
