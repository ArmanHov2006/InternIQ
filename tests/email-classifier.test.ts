import { describe, expect, it } from "vitest";
import { classifyInboundEmail } from "@/lib/services/email-ingestion/classifier";

describe("classifyInboundEmail", () => {
  it("detects rejection with high confidence", () => {
    const result = classifyInboundEmail(
      "Update on your application",
      "Unfortunately, we will not be moving forward with your application."
    );
    expect(result.proposedStatus).toBe("rejected");
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.explicitNegative).toBe(true);
  });

  it("detects interview language", () => {
    const result = classifyInboundEmail(
      "Let's schedule your interview",
      "Please share your availability for the next round."
    );
    expect(result.proposedStatus).toBe("interview");
    expect(result.signal).toBe("interview");
  });

  it("returns unknown when no signal is present", () => {
    const result = classifyInboundEmail("Newsletter", "Weekly updates and promotions.");
    expect(result.proposedStatus).toBeNull();
    expect(result.signal).toBe("unknown");
  });

  it("suppresses offer false positive for benefits marketing language", () => {
    const result = classifyInboundEmail(
      "Why our company culture is great",
      "We offer competitive benefits and wellness perks to all employees."
    );
    expect(result.signal).toBe("unknown");
    expect(result.proposedStatus).toBeNull();
  });

  it("detects online assessment via HackerRank as interview stage", () => {
    const result = classifyInboundEmail(
      "Next step: online assessment",
      "Please complete your HackerRank assessment within 5 days."
    );
    expect(result.signal).toBe("interview");
    expect(result.proposedStatus).toBe("interview");
  });

  it("detects CodeSignal link as interview stage", () => {
    const result = classifyInboundEmail(
      "CodeSignal invitation",
      "Your CodeSignal test link is now active."
    );
    expect(result.signal).toBe("interview");
  });

  it("detects take-home challenge as interview stage", () => {
    const result = classifyInboundEmail(
      "Technical exercise",
      "Please complete the take-home challenge by Friday."
    );
    expect(result.signal).toBe("interview");
  });

  it("demotes rejection in reschedule context and classifies as interview", () => {
    const result = classifyInboundEmail(
      "Interview update",
      "Unfortunately your interview has been rescheduled to next week."
    );
    expect(result.signal).toBe("interview");
    expect(result.explicitNegative).toBe(false);
  });

  it("detects application received confirmation", () => {
    const result = classifyInboundEmail(
      "Application received",
      "Thank you for applying to our Software Engineering Intern position."
    );
    expect(result.signal).toBe("applied");
    expect(result.proposedStatus).toBe("applied");
  });

  it("returns unknown for generic non-pipeline team email", () => {
    const result = classifyInboundEmail("Team sync", "Team standup notes for this week.");
    expect(result.signal).toBe("unknown");
  });

  it("detects explicit offer letter with high confidence", () => {
    const result = classifyInboundEmail(
      "Offer decision",
      "We are pleased to extend an offer of employment."
    );
    expect(result.signal).toBe("offer");
    expect(result.proposedStatus).toBe("offer");
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it("suppresses unrelated congratulations marketing email", () => {
    const result = classifyInboundEmail("Congrats!", "Congratulations! You've won a gift card.");
    expect(result.signal).toBe("unknown");
  });

  it("detects submission confirmation as applied", () => {
    const result = classifyInboundEmail(
      "Portal update",
      "This is your submission confirmation for the application."
    );
    expect(result.signal).toBe("applied");
    expect(result.proposedStatus).toBe("applied");
  });
});
