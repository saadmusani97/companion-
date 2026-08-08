export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatRelativeDay(ts: number): string {
  const now = new Date();
  const date = new Date(ts);
  const isToday = now.toDateString() === date.toDateString();
  if (isToday) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function titleFromText(text: string, max = 38): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New conversation";
  if (clean.length <= max) return clean;
  return clean.slice(0, max).trimEnd() + "…";
}
