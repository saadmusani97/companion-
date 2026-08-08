"use client";

import { v4 as uuidv4 } from "uuid";
import type { CalendarEvent, CalendarEventCreate, CalendarEventPatch } from "./types";

const EVENTS_KEY = "companion.calendarEvents";

export function loadEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEvents(events: CalendarEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch {
    /* non-fatal */
  }
}

export function createLocalEvent(data: CalendarEventCreate): CalendarEvent {
  return {
    id: uuidv4(),
    title: data.title,
    description: data.description || "",
    start: data.start,
    end: data.end,
    startTimezone: data.startTimezone || "",
    endTimezone: data.endTimezone || "",
    location: data.location || "",
    colorId: data.colorId || "",
    isAllDay: data.start.length === 10 && data.end.length === 10,
    source: "local",
  };
}

export function patchLocalEvent(event: CalendarEvent, patch: CalendarEventPatch): CalendarEvent {
  const updated = { ...event };
  if (patch.title !== undefined) updated.title = patch.title;
  if (patch.description !== undefined) updated.description = patch.description;
  if (patch.start !== undefined) updated.start = patch.start;
  if (patch.end !== undefined) updated.end = patch.end;
  if (patch.startTimezone !== undefined) updated.startTimezone = patch.startTimezone;
  if (patch.endTimezone !== undefined) updated.endTimezone = patch.endTimezone;
  if (patch.location !== undefined) updated.location = patch.location;
  if (patch.colorId !== undefined) updated.colorId = patch.colorId;
  if (patch.start !== undefined && patch.end !== undefined) {
    updated.isAllDay = patch.start.length === 10 && patch.end.length === 10;
  }
  return updated;
}
