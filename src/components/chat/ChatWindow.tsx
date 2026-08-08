"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useDragControls } from "framer-motion";
import { useCompanion } from "@/store/companion";
import {
  MAX_CHAT_WINDOW_SIZE,
  MIN_CHAT_WINDOW_SIZE,
} from "@/store/companion";
import {
  MaximizeIcon,
  MinimizeIcon,
  RestoreIcon,
} from "@/components/icons";
import { STATUS_LABELS } from "@/lib/labels";

interface ChatWindowProps {
  children: ReactNode;
  emptyHint?: ReactNode;
}

const SILK = [0.22, 1, 0.36, 1] as const;

export function ChatWindow({ children, emptyHint }: ChatWindowProps) {
  const chatWindow = useCompanion((s) => s.chatWindow);
  const orbState = useCompanion((s) => s.orbState);
  const setChatWindowMode = useCompanion((s) => s.setChatWindowMode);
  const setChatWindowSize = useCompanion((s) => s.setChatWindowSize);
  const setChatWindowPosition = useCompanion((s) => s.setChatWindowPosition);

  const controls = useDragControls();

  const containerRef = useRef<HTMLDivElement>(null);

  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const computeMaximized = useCallback(
    () => ({
      width: Math.min(MAX_CHAT_WINDOW_SIZE.width, viewport.w - 96),
      height: Math.min(MAX_CHAT_WINDOW_SIZE.height, viewport.h - 96),
    }),
    [viewport.w, viewport.h],
  );

  const resolved = chatWindow.mode === "maximized" ? computeMaximized() : chatWindow.size;
  const position = chatWindow.position ?? (viewport.w > 0 ? {
    x: Math.max(16, viewport.w - resolved.width - 80),
    y: Math.max(16, viewport.h - resolved.height - 80),
  } : null);

  const resizing = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const onResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: resolved.width,
      startH: resolved.height,
    };
    (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizing.current) return;
    const deltaW = e.clientX - resizing.current.startX;
    const deltaH = e.clientY - resizing.current.startY;
    const next = {
      width: Math.max(MIN_CHAT_WINDOW_SIZE.width, Math.min(MAX_CHAT_WINDOW_SIZE.width, resizing.current.startW + deltaW)),
      height: Math.max(MIN_CHAT_WINDOW_SIZE.height, Math.min(MAX_CHAT_WINDOW_SIZE.height, resizing.current.startH + deltaH)),
    };
    setChatWindowSize(next);
  };

  const onResizeEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (resizing.current) resizing.current = null;
    try {
      (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  if (chatWindow.mode === "minimized") {
    return null;
  }

  const showMaximized = chatWindow.mode === "maximized";

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      <motion.div
        key={chatWindow.mode === "maximized" ? "max" : "open"}
        drag={showMaximized ? false : true}
        dragControls={controls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={(_, info) => {
          // Derive the starting pixel position from the current CSS placement
          // so the first drag from a CSS-positioned window is correct.
          const ref = containerRef.current;
          const rect = ref?.getBoundingClientRect();
          let startX = position?.x ?? (rect ? rect.right - resolved.width - 32 : 100);
          let startY = position?.y ?? (rect ? rect.bottom - resolved.height - 32 : 100);
          const nextX = startX + info.offset.x;
          const nextY = startY + info.offset.y;
          const maxX = viewport.w - resolved.width - 8;
          const maxY = viewport.h - resolved.height - 8;
          const clampedX = Math.min(Math.max(nextX, 8), maxX);
          const clampedY = Math.min(Math.max(nextY, 8), maxY);
          setChatWindowPosition({ x: clampedX, y: clampedY });
        }}
        style={{
          width: resolved.width,
          height: resolved.height,
          position: "absolute",
          left: showMaximized
            ? (viewport.w - resolved.width) / 2
            : position
              ? position.x
              : undefined,
          right: showMaximized || position ? undefined : 32,
          top: showMaximized
            ? (viewport.h - resolved.height) / 2
            : position
              ? position.y
              : undefined,
          bottom: showMaximized || position ? undefined : 32,
          x: 0,
          y: 0,
        }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.28, ease: SILK }}
        className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-3xl border border-line-strong bg-bg-surface/80 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
      >
        {/* Header */}
        <div
          onPointerDown={(e) => {
            if (showMaximized) return;
            const target = e.target as HTMLElement;
            if (target.closest("[data-no-drag]")) return;
            controls.start(e);
          }}
          className={`flex h-[44px] shrink-0 items-center gap-3 border-b border-line-subtle px-4 ${showMaximized ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
        >
          <span className="flex items-center gap-2 truncate">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent/15 text-accent">
              <span className="block h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            <span className="truncate text-[13px] font-medium text-ink-primary">Friday</span>
            <span className="hidden text-[11px] text-ink-tertiary sm:inline">{STATUS_LABELS[orbState]}</span>
          </span>

          <div className="ml-auto flex items-center gap-1" data-no-drag>
            <HeaderButton
              aria-label="Minimize"
              onClick={() => setChatWindowMode("minimized")}
            >
              <MinimizeIcon className="h-3.5 w-3.5" />
            </HeaderButton>
            {showMaximized ? (
              <HeaderButton
                aria-label="Restore"
                onClick={() => setChatWindowMode("open")}
              >
                <RestoreIcon className="h-3.5 w-3.5" />
              </HeaderButton>
            ) : (
              <HeaderButton
                aria-label="Maximize"
                onClick={() => setChatWindowMode("maximized")}
              >
                <MaximizeIcon className="h-3.5 w-3.5" />
              </HeaderButton>
            )}
          </div>
        </div>

        {/* Chat body */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          {emptyHint}
          {children}
        </div>

        {/* Resize handle */}
        {!showMaximized && (
          <div
            onPointerDown={onResizeStart}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
            className="group absolute bottom-0 right-0 flex h-4 w-4 cursor-nwse-resize items-end justify-end p-1"
            data-no-drag
          >
            <span className="block h-2 w-2 rounded-br-md border-b-2 border-r-2 border-ink-tertiary/40 transition-colors group-hover:border-accent/70" />
          </div>
        )}
      </motion.div>
    </div>
  );
}

function HeaderButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`grid h-7 w-7 place-items-center rounded-lg text-ink-tertiary transition-colors duration-200 hover:bg-white/[0.06] hover:text-ink-primary ${className ?? ""}`}
    >
      {children}
    </button>
  );
}