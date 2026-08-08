"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCompanion } from "@/store/companion";
import { TopBar } from "@/components/topbar/TopBar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PlusIcon, TrashIcon, MinimizeIcon, ChatIcon } from "@/components/icons";
import { formatRelativeDay } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/labels";

const SILK = [0.22, 1, 0.36, 1] as const;
const CHAT_WIDTH = 420;

export function ChatsScreen() {
  const sessions = useCompanion((s) => s.sessions);
  const activeId = useCompanion((s) => s.activeSessionId);
  const selectSession = useCompanion((s) => s.selectSession);
  const createSession = useCompanion((s) => s.createSession);
  const deleteSession = useCompanion((s) => s.deleteSession);
  const chatMode = useCompanion((s) => s.chatWindow.mode);
  const setChatWindowMode = useCompanion((s) => s.setChatWindowMode);
  const orbState = useCompanion((s) => s.orbState);

  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  const chatOpen = (chatMode === "open" || chatMode === "maximized") && activeId !== null;

  return (
    <div className="flex h-full">
      {/* Session list — center */}
      <div className="flex flex-1 flex-col">
        <TopBar title="Chats" subtitle={`${sessions.length} conversation${sessions.length === 1 ? "" : "s"}`} />
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="mx-auto max-w-2xl">
            <motion.button
              onClick={() => createSession()}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              className="mb-5 flex w-full items-center gap-3 rounded-3xl border border-line-soft bg-white/[0.02] px-5 py-4 text-left transition-colors duration-300 hover:border-accent/40 hover:bg-white/[0.04]"
            >
              <span className="grid h-9 w-9 place-items-center rounded-2xl border border-line-strong bg-bg-elevated text-accent">
                <PlusIcon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-[14px] font-medium text-ink-primary">New conversation</span>
                <span className="block text-[12px] text-ink-tertiary">Start fresh with Friday</span>
              </span>
            </motion.button>

            {sorted.length === 0 ? (
              <EmptyChats />
            ) : (
              <ul className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {sorted.map((s) => {
                    const active = s.id === activeId;
                    const preview =
                      s.messages[s.messages.length - 1]?.content?.slice(0, 80) ??
                      "No messages yet";
                    return (
                      <motion.li
                        key={s.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.28, ease: SILK }}
                      >
                        <button
                          onClick={() => {
                            selectSession(s.id);
                            setChatWindowMode("open");
                          }}
                          className={`group relative flex w-full items-center gap-4 rounded-3xl border px-5 py-4 text-left transition-colors duration-300 ${
                            active
                              ? "border-accent/40 bg-accent/[0.06]"
                              : "border-line-subtle bg-white/[0.015] hover:border-line-soft hover:bg-white/[0.03]"
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="chats-active"
                              className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full bg-accent"
                              transition={{ type: "spring", stiffness: 420, damping: 34 }}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate text-[14px] font-medium text-ink-primary">
                                {s.title}
                              </span>
                              <span className="shrink-0 text-[11px] text-ink-tertiary">
                                {formatRelativeDay(s.updatedAt)}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-[12.5px] text-ink-secondary">
                              {preview}
                            </p>
                          </div>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(s.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                e.preventDefault();
                                deleteSession(s.id);
                              }
                            }}
                            aria-label="Delete conversation"
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-ink-tertiary opacity-0 transition-all duration-300 hover:bg-white/[0.05] hover:text-ink-secondary group-hover:opacity-100"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </span>
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Chat panel — fixed right column, slides in when a session is selected */}
      <AnimatePresence initial={false}>
        {chatOpen && (
          <motion.section
            key="chats-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: CHAT_WIDTH, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: SILK }}
            className="relative flex shrink-0 flex-col overflow-hidden border-l border-line-subtle bg-bg-surface/40"
          >
            <ChatsChatHeader
              onMinimize={() => setChatWindowMode("minimized")}
              orbState={orbState}
            />
            <ChatPanel />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChatsChatHeader({
  onMinimize,
  orbState,
}: {
  onMinimize: () => void;
  orbState: string;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-3 border-b border-line-subtle px-4">
      <span className="flex items-center gap-2 truncate">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent/15 text-accent">
          <span className="block h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
        <span className="truncate text-[13px] font-medium text-ink-primary">Friday</span>
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

function EmptyChats() {
  return (
    <div className="rounded-3xl border border-dashed border-line-soft px-6 py-12 text-center">
      <p className="text-[14px] font-medium text-ink-secondary">No conversations yet</p>
      <p className="mt-1 text-[12.5px] text-ink-tertiary">
        Start one above — Friday is standing by.
      </p>
    </div>
  );
}
