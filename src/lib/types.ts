export type Role = "user" | "assistant";

export type MessageStatus = "complete" | "streaming" | "thinking" | "error";

export interface Message {
  id: string;
  role: Role;
  content: string;
  status: MessageStatus;
  createdAt: number;
  /** True if this message originated from the microphone (voice input).
   *  Drives whether the assistant's reply is spoken aloud via TTS. */
  voice?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type AccentKey = "ember" | "amber" | "violet" | "azure" | "mint";

export interface AccentPreset {
  key: AccentKey;
  label: string;
  hex: string;
  soft: string;
  glow: string;
}

export type AnimationSpeed = "calm" | "balanced" | "lively";

export interface Settings {
  accent: AccentKey;
  animationSpeed: AnimationSpeed;
}

export type OrbState = "idle" | "thinking" | "responding" | "listening";

export type Route = "home" | "chats" | "settings";

export type ChatWindowMode = "open" | "maximized" | "minimized";

export interface ChatWindowSize {
  width: number;
  height: number;
}

export interface ChatWindowPosition {
  x: number;
  y: number;
}

export interface ChatWindowGeometry {
  mode: ChatWindowMode;
  size: ChatWindowSize;
  position: ChatWindowPosition | null;
}

/* ── Calendar ── */

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  startTimezone: string;
  endTimezone: string;
  location: string;
  colorId: string;
  isAllDay: boolean;
  source: "local";
}

export interface CalendarEventCreate {
  title: string;
  description?: string;
  start: string;
  end: string;
  startTimezone?: string;
  endTimezone?: string;
  location?: string;
  colorId?: string;
}

export interface CalendarEventPatch {
  title?: string;
  description?: string;
  start?: string;
  end?: string;
  startTimezone?: string;
  endTimezone?: string;
  location?: string;
  colorId?: string;
}
