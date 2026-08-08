"use client";

import { create } from "zustand";
import type {
  ChatSession,
  ChatWindowGeometry,
  ChatWindowMode,
  ChatWindowPosition,
  ChatWindowSize,
  Message,
  Settings,
  OrbState,
  Route,
  CalendarEvent,
} from "@/lib/types";
import { uid, titleFromText } from "@/lib/utils";

const SETTINGS_KEY = "companion.settings";
const SESSIONS_KEY = "companion.sessions";
const ACTIVE_KEY = "companion.activeSession";
const WINDOW_KEY = "companion.chatWindow";

export const DEFAULT_CHAT_WINDOW_SIZE: ChatWindowSize = { width: 420, height: 560 };
export const MIN_CHAT_WINDOW_SIZE: ChatWindowSize = { width: 320, height: 360 };
export const MAX_CHAT_WINDOW_SIZE: ChatWindowSize = { width: 920, height: 760 };

interface CompanionState {
  // routing
  route: Route;
  setRoute: (route: Route) => void;

  // settings
  settings: Settings;
  setAccent: (accent: Settings["accent"]) => void;
  setAnimationSpeed: (speed: Settings["animationSpeed"]) => void;

  // orb
  orbState: OrbState;
  setOrbState: (state: OrbState) => void;

  // sessions
  sessions: ChatSession[];
  activeSessionId: string | null;

  createSession: () => string;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;

  addMessage: (sessionId: string, message: Message) => void;
  updateMessage: (sessionId: string, messageId: string, patch: Partial<Message>) => void;

  // chat window geometry
  chatWindow: ChatWindowGeometry;
  setChatWindowMode: (mode: ChatWindowMode) => void;
  setChatWindowSize: (size: ChatWindowSize) => void;
  setChatWindowPosition: (position: ChatWindowPosition) => void;
  patchChatWindow: (patch: Partial<ChatWindowGeometry>) => void;

  // calendar
  calendarEvents: CalendarEvent[];
  selectedCalendarDate: string | null;
  selectedCalendarEvent: CalendarEvent | null;
  setCalendarEvents: (events: CalendarEvent[]) => void;
  selectCalendarDate: (date: string | null) => void;
  selectCalendarEvent: (event: CalendarEvent | null) => void;

  hydrate: () => void;
}

function loadSettings(): Settings {
  if (typeof window === "undefined") {
    return { accent: "ember", animationSpeed: "balanced" };
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) return { accent: "ember", animationSpeed: "balanced", ...JSON.parse(raw) };
  } catch {
    /* fall through to default */
  }
  return { accent: "ember", animationSpeed: "balanced" };
}

function loadSessions(): { sessions: ChatSession[]; active: string | null } {
  if (typeof window === "undefined") return { sessions: [], active: null };
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    const sessions: ChatSession[] = raw ? JSON.parse(raw) : [];
    const active = window.localStorage.getItem(ACTIVE_KEY);
    return { sessions, active: active && sessions.some((s) => s.id === active) ? active : null };
  } catch {
    return { sessions: [], active: null };
  }
}

function loadChatWindow(): ChatWindowGeometry {
  if (typeof window === "undefined") {
    return { mode: "open", size: DEFAULT_CHAT_WINDOW_SIZE, position: null };
  }
  try {
    const raw = window.localStorage.getItem(WINDOW_KEY);
    if (!raw) return { mode: "open", size: DEFAULT_CHAT_WINDOW_SIZE, position: null };
    const parsed = JSON.parse(raw) as Partial<ChatWindowGeometry>;
    const size = {
      width: clamp(parsed.size?.width ?? DEFAULT_CHAT_WINDOW_SIZE.width, MIN_CHAT_WINDOW_SIZE.width, MAX_CHAT_WINDOW_SIZE.width),
      height: clamp(parsed.size?.height ?? DEFAULT_CHAT_WINDOW_SIZE.height, MIN_CHAT_WINDOW_SIZE.height, MAX_CHAT_WINDOW_SIZE.height),
    };
    return {
      mode: parsed.mode === "maximized" || parsed.mode === "minimized" ? parsed.mode : "open",
      size,
      position:
        parsed.position && typeof parsed.position.x === "number" && typeof parsed.position.y === "number"
          ? parsed.position
          : null,
    };
  } catch {
    return { mode: "open", size: DEFAULT_CHAT_WINDOW_SIZE, position: null };
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function persistChatWindow(geometry: ChatWindowGeometry) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WINDOW_KEY, JSON.stringify(geometry));
  } catch {
    /* non-fatal */
  }
}

// ---- Debounced persist ----
// During streaming, updateMessage fires on every token (potentially 20-60
// times per second). Writing to localStorage on every call is expensive and
// unnecessary. This debounced version coalesces rapid writes into a single
// flush every 600 ms, with an immediate sync on the first call and a forced
// flush on completion (non-streaming updates).

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistScheduled = false;

function persistDebounced(state: CompanionState, immediate = false) {
  if (typeof window === "undefined") return;

  const write = () => {
    persistScheduled = false;
    persistTimer = null;
    persist(state);
  };

  if (immediate || !persistScheduled) {
    write();
    persistScheduled = true;
    return;
  }

  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(write, 600);
}

function persist(state: CompanionState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(state.sessions));
    if (state.activeSessionId) {
      window.localStorage.setItem(ACTIVE_KEY, state.activeSessionId);
    }
  } catch {
    /* storage may be unavailable; non-fatal */
  }
}

export const useCompanion = create<CompanionState>((set, get) => ({
  route: "home",
  setRoute: (route) => set({ route }),

  settings: { accent: "ember", animationSpeed: "balanced" },
  setAccent: (accent) => {
    const next = { ...get().settings, accent };
    set({ settings: next });
    persist(get());
  },
  setAnimationSpeed: (animationSpeed) => {
    const next = { ...get().settings, animationSpeed };
    set({ settings: next });
    persist(get());
  },

  orbState: "idle",
  setOrbState: (orbState) => set({ orbState }),

  sessions: [],
  activeSessionId: null,

  createSession: () => {
    const id = uid("sess");
    const now = Date.now();
    const session: ChatSession = {
      id,
      title: "New conversation",
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    const next = { sessions: [session, ...get().sessions], activeSessionId: id };
    set(next);
    persist(get());
    return id;
  },

  selectSession: (id) => {
    set({ activeSessionId: id });
    persist(get());
  },

  deleteSession: (id) => {
    const sessions = get().sessions.filter((s) => s.id !== id);
    let activeSessionId = get().activeSessionId;
    if (activeSessionId === id) {
      activeSessionId = sessions[0]?.id ?? null;
    }
    set({ sessions, activeSessionId });
    persist(get());
  },

  renameSession: (id, title) => {
    const sessions = get().sessions.map((s) =>
      s.id === id ? { ...s, title: title.trim() || s.title, updatedAt: Date.now() } : s,
    );
    set({ sessions });
    persist(get());
  },

  addMessage: (sessionId, message) => {
    const sessions = get().sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const messages = [...s.messages, message];
      const title =
        s.messages.length === 0 && message.role === "user"
          ? titleFromText(message.content)
          : s.title;
      return { ...s, messages, title, updatedAt: Date.now() };
    });
    set({ sessions });
    persist(get());
  },

  updateMessage: (sessionId, messageId, patch) => {
    const sessions = get().sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const messages = s.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m));
      return { ...s, messages, updatedAt: Date.now() };
    });
    set({ sessions });
    // Debounce during streaming; immediate on non-streaming updates.
    const isStreaming = patch.status === "streaming";
    persistDebounced(get(), !isStreaming);
  },

  chatWindow: { mode: "open", size: DEFAULT_CHAT_WINDOW_SIZE, position: null },
  setChatWindowMode: (mode) => {
    const chatWindow = { ...get().chatWindow, mode };
    set({ chatWindow });
    persistChatWindow(chatWindow);
  },
  setChatWindowSize: (size) => {
    const clamped = {
      width: clamp(size.width, MIN_CHAT_WINDOW_SIZE.width, MAX_CHAT_WINDOW_SIZE.width),
      height: clamp(size.height, MIN_CHAT_WINDOW_SIZE.height, MAX_CHAT_WINDOW_SIZE.height),
    };
    const chatWindow = { ...get().chatWindow, size: clamped };
    set({ chatWindow });
    persistChatWindow(chatWindow);
  },
  setChatWindowPosition: (position) => {
    const chatWindow = { ...get().chatWindow, position };
    set({ chatWindow });
    persistChatWindow(chatWindow);
  },
  patchChatWindow: (patch) => {
    const chatWindow = { ...get().chatWindow, ...patch };
    set({ chatWindow });
    persistChatWindow(chatWindow);
  },

  calendarEvents: [],
  selectedCalendarDate: null,
  selectedCalendarEvent: null,
  setCalendarEvents: (calendarEvents) => set({ calendarEvents }),
  selectCalendarDate: (selectedCalendarDate) => set({ selectedCalendarDate }),
  selectCalendarEvent: (selectedCalendarEvent) => set({ selectedCalendarEvent }),

  hydrate: () => {
    const settings = loadSettings();
    const { sessions, active } = loadSessions();
    const chatWindow = loadChatWindow();
    let calendarEvents: CalendarEvent[] = [];
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("companion.calendarEvents");
        calendarEvents = raw ? JSON.parse(raw) : [];
      } catch {
        calendarEvents = [];
      }
    }
    set({ settings, sessions, activeSessionId: active, chatWindow, calendarEvents });
  },
}));
