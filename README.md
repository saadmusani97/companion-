# Friday — v0.1

A premium desktop AI companion. Calm, minimal, alive.

This is **Version 0.1**. The entire goal of this release is polish: a clean,
Apple-level interface where the AI *feels* present. No memory, no RAG, no
tools, no integrations — just conversation, beautifully executed.

## Stack

- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** (design tokens via CSS variables)
- **Framer Motion** (orb, transitions, micro-interactions)
- **Zustand** (settings + chat sessions, persisted to localStorage)
- **react-markdown** + **remark-gfm** (markdown in assistant replies)

## Run

```bash
cd companion
bun install      # or npm install / pnpm install
bun run dev      # http://localhost:3000
```

Build for production:

```bash
bun run build && bun run start
```

## What's inside

### Screens (sidebar: Home · Chats · Settings)

- **Home** — fullscreen dark UI, animated AI orb center-stage, chat panel right,
  voice button top-right.
- **Chats** — session list with previews, new/delete, active conversation on the right.
- **Settings** — Dark theme (default), Accent color (5 presets), Animation speed.

### The Orb

A layered composition (halo + rotating ring + core sphere) driven by a state
machine. It **idles** slowly, **pulses** while thinking, **glows** while
responding, and **breathes wide** while listening. State is shared globally so
the orb and chat panel stay in sync.

### The Voice Button

UI-only in v0.1. Clicking it toggles the orb into a "listening" posture. No
real voice capture — intentionally honest about scope.

### Friday's voice

A calm, confident companion — never enthusiastic, never robotic. The local
response engine classifies intent and replies in a minimal register
("Done.", "I'm checking.", "I can't do that yet, but it's planned.").
Unsupported requests are acknowledged honestly rather than faked.

## Architecture

```
src/
  app/                     Next.js App Router entry
  components/
    orb/Orb.tsx            Animated AI orb
    sidebar/Sidebar.tsx    Left nav (Home, Chats, Settings)
    topbar/TopBar.tsx      Title + status + voice button
    chat/                  MessageBubble, MessageList, Composer, ChatPanel
    Dashboard.tsx          Shell + route transitions
    icons.tsx              Inline SVG icon set
  screens/                 HomeScreen, ChatsScreen, SettingsScreen
  store/companion.ts       Zustand store (settings + sessions, persisted)
  lib/
    friday.ts              Response engine (intent → reply)
    use-send-turn.ts       Orchestrator: thinking → streaming → complete
    presets.ts             Accent + animation-speed presets
    types.ts utils.ts      Types + helpers
    labels.ts              Orb state labels
  styles/globals.css       Tailwind + theme tokens + glass utilities
```

## Design language

- Deep near-black base (`#070709`), warm orange accent (default "Ember").
- Generous spacing, large rounded corners, glass surfaces where appropriate.
- Motion easing `cubic-bezier(0.22, 1, 0.36, 1)` everywhere — "silk".
- Minimal scrollbars, balanced text wrapping, no clutter.

## Scope (intentionally excluded until v0.2+)

Memory · RAG · browser automation · email · calendar · coding agents · MCP ·
multi-agent · plugins. v0.1 is conversation only, and it owns that.
