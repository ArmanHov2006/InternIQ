import { describe, expect, it } from "vitest";
import { validateExportPayload } from "@/lib/pdf/export-schema";

describe("validateExportPayload", () => {
  it("accepts a valid payload", () => {
    const payload = {
      feature: "analyze",
      template: "premium-default",
      filename: "analyze-report",
      includeMetadata: true,
      document: {
        title: "Analyze Report",
        subtitle: "Fit analysis",
        metadata: [{ label: "Generated", value: "today" }],
        sections: [{ title: "Summary", body: "Great fit." }],
      },
    };
    const validated = validateExportPayload(payload);
    expect(validated.valid).toBe(true);
  });

  it("rejects invalid feature and oversized body", () => {
    const payload = {
      feature: "bad",
      template: "premium-default",
      filename: "x",
      includeMetadata: true,
      document: {
        title: "x",
        sections: [{ title: "s", body: "a".repeat(30000) }],
      },
    };
    const validated = validateExportPayload(payload);
    expect(validated.valid).toBe(false);
  });
});
