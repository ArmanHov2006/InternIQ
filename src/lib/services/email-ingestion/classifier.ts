import type { ParsedEmailSignal } from "@/lib/services/email-ingestion/types";

type SignalKey = "rejection" | "offer" | "interview" | "applied";

const TOKEN_WEIGHTS: Record<
  SignalKey,
  {
    strong: string[];
    weak: string[];
  }
> = {
  rejection: {
    strong: [
      "we will not be moving forward",
      "regret to inform",
      "decided to move forward with other candidates",
      "not selected for this role",
      "position has been filled",
    ],
    weak: ["unfortunately", "declined", "rejection"],
  },
  offer: {
    strong: ["pleased to extend an offer", "offer letter", "sign your offer", "extend an offer of employment"],
    weak: ["offer", "start date", "onboarding"],
  },
  interview: {
    strong: [
      "schedule your interview",
      "online assessment",
      "hackerrank",
      "codesignal",
      "take-home",
      "take home",
      "coding challenge",
      "phone screen",
      "technical interview",
    ],
    weak: ["interview", "availability", "assessment", "schedule", "next round"],
  },
  applied: {
    strong: [
      "application received",
      "thanks for applying",
      "thank you for applying",
      "successfully submitted",
      "we received your application",
    ],
    weak: ["submission confirmation", "application submitted"],
  },
};

const OFFER_NOISE = ["we offer competitive", "benefits include"];
const INTERVIEW_NOISE = ["schedule a demo", "schedule a tour"];
const REJECTION_CONTEXT_MODIFIERS = ["reschedule", "rescheduled", "postpone", "postponed", "update your"];

const countMatches = (corpus: string, tokens: string[]): number =>
  tokens.reduce((count, token) => (corpus.includes(token) ? count + 1 : count), 0);

const scoreSignal = (
  corpus: string,
  key: SignalKey
): { score: number; strongHits: number; weakHits: number } => {
  const strongHits = countMatches(corpus, TOKEN_WEIGHTS[key].strong);
  let weakHits = countMatches(corpus, TOKEN_WEIGHTS[key].weak);

  if (strongHits === 0 && key === "offer" && OFFER_NOISE.some((noise) => corpus.includes(noise))) {
    weakHits = 0;
  }
  if (strongHits === 0 && key === "interview" && INTERVIEW_NOISE.some((noise) => corpus.includes(noise))) {
    weakHits = 0;
  }

  let score = strongHits * 3 + weakHits;

  if (key === "rejection" && REJECTION_CONTEXT_MODIFIERS.some((modifier) => corpus.includes(modifier))) {
    score = Math.max(0, score - 2);
  }

  return { score, strongHits, weakHits };
};

const confidenceFromHits = (strongHits: number, weakHits: number): number => {
  if (strongHits >= 1) {
    return Math.min(0.98, 0.87 + strongHits * 0.05);
  }
  if (weakHits > 0) {
    return Math.min(0.8, 0.6 + weakHits * 0.1);
  }
  return 0.25;
};

const STATUS_BY_SIGNAL: Record<SignalKey, ParsedEmailSignal["proposedStatus"]> = {
  rejection: "rejected",
  offer: "offer",
  interview: "interview",
  applied: "applied",
};

export const classifyInboundEmail = (subject: string, snippet: string): ParsedEmailSignal => {
  const corpus = `${subject} ${snippet}`.toLowerCase();

  const scored = (Object.keys(TOKEN_WEIGHTS) as SignalKey[]).map((signal) => ({
    signal,
    ...scoreSignal(corpus, signal),
  }));

  const winner = scored.reduce((best, current) => {
    if (current.score > best.score) return current;
    if (current.score === best.score && current.strongHits > best.strongHits) return current;
    return best;
  });

  if (winner.score < 1) {
    return {
      signal: "unknown",
      proposedStatus: null,
      confidence: 0.25,
      reason: "No strong application pipeline signals detected.",
      explicitNegative: false,
    };
  }

  return {
    signal: winner.signal,
    proposedStatus: STATUS_BY_SIGNAL[winner.signal],
    confidence: confidenceFromHits(winner.strongHits, winner.weakHits),
    reason: `Detected ${winner.signal} signal (strong=${winner.strongHits}, weak=${winner.weakHits}, score=${winner.score}).`,
    explicitNegative: winner.signal === "rejection",
  };
};
