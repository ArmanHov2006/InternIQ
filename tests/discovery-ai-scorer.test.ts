import { describe, expect, it } from "vitest";
import {
  calibrateDiscoveryAiScore,
  getDiscoveryPrimaryScore,
  parseStoredAi,
} from "@/lib/services/discovery/ai-scorer";

describe("discovery ai scorer", () => {
  it("caps inflated scores when there are serious gating flags", () => {
    const calibrated = calibrateDiscoveryAiScore({
      heuristicScore: 81,
      fallbackGatingFlags: ["seniority_mismatch", "missing_must_have"],
      raw: {
        final_score: 97,
        confidence: 92,
        subscores: {
          must_have: 62,
          seniority: 48,
          skills: 84,
          logistics: 80,
          upside: 77,
        },
        evidence: ["Built Python APIs in production."],
        gaps: ["Role is senior-level.", "Missing several required tools."],
        gating_flags: ["seniority_mismatch"],
        reasoning: "Useful overlap, but the role is too senior and misses must-have depth.",
      },
    });

    expect(calibrated.final_score).toBeLessThanOrEqual(74);
    expect(calibrated.verdict).toBe("pass");
    expect(calibrated.gating_flags).toEqual(
      expect.arrayContaining(["seniority_mismatch", "missing_must_have"])
    );
  });

  it("allows 90+ only for exceptional, clean fits", () => {
    const calibrated = calibrateDiscoveryAiScore({
      heuristicScore: 83,
      raw: {
        final_score: 96,
        confidence: 88,
        subscores: {
          must_have: 96,
          seniority: 95,
          skills: 93,
          logistics: 84,
          upside: 91,
        },
        evidence: [
          "Recent internship shipped Python and FastAPI backend systems.",
          "Resume shows Redis, Docker, and observability work directly aligned to the role.",
        ],
        gaps: [],
        gating_flags: [],
        reasoning: "Strong evidence across skills, seniority, and shipping experience.",
      },
    });

    expect(calibrated.final_score).toBeGreaterThanOrEqual(90);
    expect(calibrated.verdict).toBe("strong_apply");
  });

  it("prefers the AI final score and falls back to the heuristic score", () => {
    expect(
      getDiscoveryPrimaryScore({
        match_score: 82,
        ai_score: {
          final_score: 74,
          subscores: {
            must_have: 74,
            seniority: 71,
            skills: 80,
            logistics: 70,
            upside: 72,
          },
          evidence: ["Good overlap."],
          gaps: ["A few missing tools."],
          gating_flags: [],
          reasoning: "Worth a look.",
        },
      })
    ).toBe(74);

    expect(getDiscoveryPrimaryScore({ match_score: 82, ai_score: {} })).toBe(82);
    expect(parseStoredAi({ ai_score: { overall_score: 88, reasoning: "Legacy." } })?.final_score).toBe(88);
  });
});
