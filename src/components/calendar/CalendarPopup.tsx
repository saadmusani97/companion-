"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useCompanion } from "@/store/companion";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlusIcon, ClockIcon, MapPinIcon } from "@/components/icons";
import { loadEvents, saveEvents, createLocalEvent, patchLocalEvent } from "@/lib/calendar-service";
import type { CalendarEvent, CalendarEventCreate } from "@/lib/types";

const SILK = [0.22, 1, 0.36, 1] as const;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

interface CalendarPopupProps {
  onClose: () => void;
}

export function CalendarPopup({ onClose }: CalendarPopupProps) {
  const events = useCompanion((s) => s.calendarEvents);
  const setEvents = useCompanion((s) => s.setCalendarEvents);

  const [viewMonth, setViewMonth] = useState(new Date());
  const [pickedDate, setPickedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);

  useEffect(() => {
    const stored = loadEvents();
    if (stored.length > 0) setEvents(stored);
  }, [setEvents]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth));
    const end = endOfWeek(endOfMonth(viewMonth));
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      try {
        const start = parseISO(e.start);
        const end = parseISO(e.end);
        const dayRange = eachDayOfInterval({ start, end: end < start ? start : end });
        for (const d of dayRange) {
          const iso = format(d, "yyyy-MM-dd");
          if (!map.has(iso)) map.set(iso, []);
          map.get(iso)!.push(e);
        }
      } catch {
        /* skip malformed */
      }
    }
    return map;
  }, [events]);

  const pickedEvents = useMemo(() => {
    return (eventsByDay.get(pickedDate) ?? []).sort((a, b) => a.start.localeCompare(b.start));
  }, [eventsByDay, pickedDate]);

  function handleAddEvent() {
    if (!title.trim()) return;
    const start = allDay ? pickedDate : `${pickedDate}T${time}:00`;
    const end = allDay ? pickedDate : `${pickedDate}T${endTime}:00`;
    const created = createLocalEvent({ title: title.trim(), start, end });
    const updated = [...events, created];
    setEvents(updated);
    saveEvents(updated);
    setTitle("");
    setShowForm(false);
  }

  function handleDelete(id: string) {
    const updated = events.filter((e) => e.id !== id);
    setEvents(updated);
    saveEvents(updated);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.3, ease: SILK }}
      className="glass-strong absolute left-4 top-[72px] z-40 w-[300px] rounded-3xl border border-line-strong p-3.5 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.6)]"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold tracking-tight text-ink-primary">
          {format(viewMonth, "MMMM yyyy")}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMonth((m) => addMonths(m, -1))}
            className="grid h-6 w-6 place-items-center rounded-lg text-ink-tertiary transition-colors hover:bg-white/[0.06] hover:text-ink-primary"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMonth(new Date())}
            className="rounded-lg px-2 py-1 text-[11px] text-ink-tertiary transition-colors hover:bg-white/[0.06] hover:text-ink-primary"
          >
            Today
          </button>
          <button
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="grid h-6 w-6 place-items-center rounded-lg text-ink-tertiary transition-colors hover:bg-white/[0.06] hover:text-ink-primary"
            aria-label="Next month"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="ml-1 grid h-6 w-6 place-items-center rounded-lg text-ink-tertiary transition-colors hover:bg-white/[0.06] hover:text-ink-primary"
            aria-label="Close"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium uppercase tracking-wider text-ink-tertiary">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, viewMonth);
          const today = isToday(day);
          const picked = pickedDate === iso;
          const dayEvents = eventsByDay.get(iso) ?? [];
          return (
            <button
              key={iso}
              onClick={() => setPickedDate(iso)}
              className={`relative grid aspect-square place-items-center rounded-lg text-[12px] font-medium transition-colors duration-200 ${
                picked
                  ? "bg-accent text-bg-base"
                  : today
                    ? "border border-accent/40 text-accent"
                    : inMonth
                      ? "text-ink-secondary hover:bg-white/[0.06]"
                      : "text-ink-muted hover:bg-white/[0.04]"
              }`}
            >
              {format(day, "d")}
              {dayEvents.length > 0 && !picked && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day events */}
      <div className="mt-4 border-t border-line-subtle pt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-medium text-ink-secondary">
            {format(parseISO(pickedDate), "EEE, MMM d")}
          </span>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="grid h-6 w-6 place-items-center rounded-lg text-ink-tertiary transition-colors hover:bg-white/[0.06] hover:text-accent"
            aria-label="Add event"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {pickedEvents.map((e) => (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: SILK }}
              className="group relative mb-1.5 flex items-center gap-2 overflow-hidden rounded-xl border border-line-subtle bg-white/[0.02] px-2.5 py-2"
            >
              <span className="h-7 w-[3px] shrink-0 rounded-full bg-accent/70" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-ink-primary">{e.title}</p>
                <div className="flex items-center gap-2 text-[10.5px] text-ink-tertiary">
                  <span className="flex items-center gap-0.5">
                    <ClockIcon className="h-2.5 w-2.5" />
                    {e.isAllDay ? "All day" : format(parseISO(e.start), "h:mm a")}
                  </span>
                  {e.location && (
                    <span className="flex items-center gap-0.5 truncate">
                      <MapPinIcon className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{e.location}</span>
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(e.id)}
                aria-label="Delete"
                className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] text-ink-tertiary opacity-0 transition-all hover:bg-white/[0.06] hover:text-ink-secondary group-hover:opacity-100"
              >
                Del
              </button>
              {/* Note: keep selectedDate synced to pickedDate so HomeScreen can read it */}
            </motion.div>
          ))}
        </AnimatePresence>

        {pickedEvents.length === 0 && !showForm && (
          <p className="py-2 text-center text-[11.5px] text-ink-tertiary">No events.</p>
        )}
      </div>

      {/* Quick add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: SILK }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col gap-2 border-t border-line-subtle pt-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddEvent()}
                placeholder="Event title"
                autoFocus
                className="w-full rounded-xl border border-line-subtle bg-white/[0.02] px-3 py-2 text-[13px] text-ink-primary placeholder:text-ink-tertiary focus:border-accent/40 focus:outline-none"
              />
              <label className="flex items-center gap-2 text-[11.5px] text-ink-secondary">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[var(--accent)]"
                />
                All day
              </label>
              {!allDay && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="rounded-xl border border-line-subtle bg-white/[0.02] px-2.5 py-2 text-[12.5px] text-ink-primary focus:border-accent/40 focus:outline-none [color-scheme:dark]"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="rounded-xl border border-line-subtle bg-white/[0.02] px-2.5 py-2 text-[12.5px] text-ink-primary focus:border-accent/40 focus:outline-none [color-scheme:dark]"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-line-subtle bg-white/[0.02] px-3 py-2 text-[12px] font-medium text-ink-secondary transition-colors hover:text-ink-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  disabled={!title.trim()}
                  className="flex-1 rounded-xl bg-accent px-3 py-2 text-[12px] font-medium text-bg-base transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
