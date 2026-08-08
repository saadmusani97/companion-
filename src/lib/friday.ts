import type { Message } from "./types";

/**
 * Friday — a calm, composed companion.
 *
 * v0.1 capability surface: this version can only hold a conversation in the
 * current session. Anything beyond chat is acknowledged honestly rather than
 * faked. The intent router classifies a user turn so the orchestrator can pick
 * the right shape of reply.
 */

export type Intent =
  | "greeting"
  | "capability_question"
  | "identity_question"
  | "unsupported_action"
  | "wellbeing"
  | "smalltalk"
  | "thanks"
  | "conversation";

interface Rule {
  intent: Intent;
  test: RegExp;
}

const RULES: Rule[] = [
  { intent: "greeting", test: /\b(hi|hey|hello|yo|good (morning|afternoon|evening)|howdy)\b/i },
  {
    intent: "capability_question",
    test: /\b(what can you do|your capabilities|help me with|features|can you (do|help)|what are you able to|abilities)\b/i,
  },
  {
    intent: "identity_question",
    test: /\b(who are you|what('?s| is) your name|are you (chatgpt|friday|an ai|a bot)|tell me about yourself)\b/i,
  },
  {
    intent: "unsupported_action",
    test: /\b(send (an? )?email|read my email|calendar|schedule|browse|open (a )?website|search the web|book|order|buy|make a call|call someone|control my (computer|browser)|run (code|a script)|automate|integrate with|connect to my)\b/i,
  },
  {
    intent: "wellbeing",
    test: /\b(how are you|how('?s| is) it going|you (ok|good)|what'?s up|how do you feel)\b/i,
  },
  { intent: "thanks", test: /\b(thanks|thank you|thx|appreciate it|cheers)\b/i },
  { intent: "smalltalk", test: /\b(weather|joke|tell me (a )?story|fun fact|who (made|built) you)\b/i },
];

function classify(text: string): Intent {
  const t = text.trim();
  for (const rule of RULES) {
    if (rule.test.test(t)) return rule.intent;
  }
  return "conversation";
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const REPLIES: Record<Intent, string[]> = {
  greeting: [
    "Hi. I'm here.",
    "Hey. What's on your mind?",
    "Hello. Ready when you are.",
  ],
  identity_question: [
    "I'm Friday — your companion. Calm by design, here to think things through with you.",
    "Friday. I keep things simple and stay composed.",
    "Name's Friday. I'm built to be steady, not loud.",
  ],
  capability_question: [
    "Right now I can hold a conversation and keep context within this session. The rest is planned, not pretended.",
    "This is version 0.1. I chat, I listen, I stay with you through a session. Everything else comes later.",
    "I can talk through things with you for now. Memory, tools, and the deeper features are on the roadmap.",
  ],
  unsupported_action: [
    "I can't do that yet, but it's planned.",
    "Not in this version. I'll be honest rather than fake it — that one's on the roadmap.",
    "Outside what I can do today. When it ships, I'll let you know.",
  ],
  wellbeing: [
    "Steady. Thanks for asking.",
    "Running clean. You?",
    "All good on my end. How about you?",
  ],
  thanks: ["Anytime.", "Of course.", "Done."],
  smalltalk: [
    "I keep away from small talk — but I'm here if you want to think through something real.",
    "Not my strength. Bring me a real question and I'm useful.",
    "I'd rather get into something meaningful. What are you working on?",
  ],
  conversation: [
    "Tell me more.",
    "I'm listening.",
    "Go on.",
    "Interesting. What's the goal here?",
    "Let's take it step by step. What outcome do you want?",
    "Understood. What's the next move?",
    "I'm with you. What matters most about this?",
    "Got it. Where do you want to start?",
  ],
};

/**
 * Generate a full reply string for a user turn.
 * Deterministic per call but varied across runs.
 */
export function generateReply(userText: string, history: Message[]): string {
  const intent = classify(userText);

  if (intent === "conversation" && history.length > 0) {
    const lastUser = [...history].reverse().find((m) => m.role === "user");
    const repeats = lastUser && lastUser.content.trim() === userText.trim();
    if (repeats) {
      return "I heard you the first time. Want me to dig into it?";
    }
  }

  return pick(REPLIES[intent]);
}

/**
 * Decide whether Friday should pause visibly before replying (the "thinking"
 * beat). Short acknowledgements answer fast; substantive turns pause longer.
 */
export function thinkingDelayMs(userText: string): number {
  const words = userText.trim().split(/\s+/).length;
  if (words <= 3) return 480;
  if (words <= 12) return 780;
  return 1100;
}

export const FRIDAY_OPENING =
  "Friday, online. I'm here when you need me, Boss — say the word.";
