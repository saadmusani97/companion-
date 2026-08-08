import type { OrbState } from "./types";

export const STATUS_LABELS: Record<OrbState, string> = {
  idle: "Standing by",
  thinking: "Thinking",
  responding: "Responding",
  listening: "Listening",
};
