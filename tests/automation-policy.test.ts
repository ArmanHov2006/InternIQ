import { describe, expect, it } from "vitest";
import { emailAutomationInternals } from "@/lib/services/email-ingestion/processor";

describe("email automation transition policy", () => {
  it("blocks downgrade unless explicit negative signal", () => {
    expect(emailAutomationInternals.canPromoteToStatus("offer", "interview", false)).toBe(false);
    expect(emailAutomationInternals.canPromoteToStatus("offer", "rejected", true)).toBe(true);
  });

  it("protects recent manual edits", () => {
    const recent = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const old = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

    expect(
      emailAutomationInternals.shouldProtectRecentManualEdit({
        id: "1",
        company: "Acme",
        status: "applied",
        contact_email: "jobs@acme.com",
        last_status_change_source: "manual",
        last_status_change_at: recent,
      })
    ).toBe(true);

    expect(
      emailAutomationInternals.shouldProtectRecentManualEdit({
        id: "2",
        company: "Acme",
        status: "applied",
        contact_email: "jobs@acme.com",
        last_status_change_source: "manual",
        last_status_change_at: old,
      })
    ).toBe(false);
  });
});
