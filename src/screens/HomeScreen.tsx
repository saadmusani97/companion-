"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompanion } from "@/store/companion";
import JarvisOrb from "@/components/orb/JarvisOrb";
import { TopBar } from "@/components/topbar/TopBar";
import { ChatPanel, ChatEmptyHint } from "@/components/chat/ChatPanel";
import { CalendarPopup } from "@/components/calendar/CalendarPopup";
import { MinimizeIcon, ChatIcon, CalendarIcon } from "@/components/icons";
import { STATUS_LABELS } from "@/lib/labels";

const SILK = [0.22, 1, 0.36, 1] as const;
const CHAT_WIDTH = 420;

export function HomeScreen() {
  const orbState = useCompanion((s) => s.orbState);
  const chatMode = useCompanion((s) => s.chatWindow.mode);
  const setChatWindowMode = useCompanion((s) => s.setChatWindowMode);
  const activeId = useCompanion((s) => s.activeSessionId);
  const hasMessages = useCompanion((s) =>
    s.sessions.some((sess) => sess.id === activeId && sess.messages.length > 0),
  );

  const chatOpen = chatMode === "open" || chatMode === "maximized";
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Center stage — 3D Ultron orb */}
      <div className="relative flex flex-1 flex-col">
        <TopBar title="Friday" subtitle="Your companion" />

        {/* Top-left controls */}
        <div className="absolute left-4 top-[72px] z-10 flex items-center gap-2">
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: SILK }}
            onClick={() => setCalendarOpen((o) => !o)}
            className={`grid h-9 w-9 place-items-center rounded-xl border shadow-lg backdrop-blur-md transition-colors duration-300 ${
              calendarOpen
                ? "border-accent/60 bg-accent/15 text-accent"
                : "border-line-strong bg-bg-elevated/80 text-ink-secondary hover:border-accent/50 hover:text-accent"
            }`}
            aria-label="Toggle calendar"
          >
            <CalendarIcon className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Calendar popup — top-left */}
        <AnimatePresence>
          {calendarOpen && <CalendarPopup onClose={() => setCalendarOpen(false)} />}
        </AnimatePresence>

        {/* Open chat button — only when chat is minimized */}
        {!chatOpen && (
          <motion.button
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.3, ease: SILK }}
            onClick={() => setChatWindowMode("open")}
            className="absolute right-4 top-[72px] z-10 grid h-9 w-9 place-items-center rounded-xl border border-line-strong bg-bg-elevated/80 text-ink-secondary shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-accent/50 hover:text-accent"
            aria-label="Open chat"
          >
            <ChatIcon className="h-4 w-4" />
          </motion.button>
        )}

        <div className="relative flex flex-1 overflow-hidden">
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: SILK }}
          >
            <JarvisOrb state={orbState} />
          </motion.div>
        </div>
      </div>

      {/* Chat panel — fixed right column, collapsible */}
      <AnimatePresence initial={false}>
        {chatOpen && (
          <motion.section
            key="home-chat"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: CHAT_WIDTH, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: SILK }}
            className="relative flex shrink-0 flex-col overflow-hidden border-l border-line-subtle bg-bg-surface/40"
          >
            <ChatHeader
              onMinimize={() => setChatWindowMode("minimized")}
              title="Friday"
              orbState={orbState}
            />
            {!hasMessages && <ChatEmptyHint />}
            <ChatPanel />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChatHeader({
  onMinimize,
  title,
  orbState,
}: {
  onMinimize: () => void;
  title: string;
  orbState: string;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-3 border-b border-line-subtle px-4">
      <span className="flex items-center gap-2 truncate">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent/15 text-accent">
          <span className="block h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
        <span className="truncate text-[13px] font-medium text-ink-primary">{title}</span>
        <span className="text-[11px] text-ink-tertiary">{STATUS_LABELS[orbState as keyof typeof STATUS_LABELS]}</span>
      </span>
      <div className="ml-auto">
        <button
          onClick={onMinimize}
          aria-label="Minimize chat"
          className="grid h-7 w-7 place-items-center rounded-lg text-ink-tertiary transition-colors duration-200 hover:bg-white/[0.06] hover:text-ink-primary"
        >
          <MinimizeIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
