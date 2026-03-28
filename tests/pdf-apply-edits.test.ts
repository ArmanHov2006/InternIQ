import { describe, expect, it } from "vitest";
import { applyTailorSuggestions } from "@/lib/pdf/apply-edits";

describe("applyTailorSuggestions", () => {
  it("applies selected replacements deterministically", () => {
    const source = "Built dashboards with React.\nImproved API latency.";
    const suggestions = [
      {
        id: "1",
        section: "Experience",
        original: "Built dashboards with React.",
        suggested: "Built production dashboards with React and TypeScript.",
        rationale: "Add specificity.",
      },
      {
        id: "2",
        section: "Impact",
        original: "Improved API latency.",
        suggested: "Reduced API latency by 35% across core endpoints.",
        rationale: "Quantify impact.",
      },
    ];

    const result = applyTailorSuggestions(source, suggestions, new Set(["2"]));
    expect(result.applied).toHaveLength(1);
    expect(result.skipped).toHaveLength(1);
    expect(result.mergedText).toContain("Reduced API latency by 35%");
    expect(result.mergedText).toContain("Built dashboards with React.");
  });
});
