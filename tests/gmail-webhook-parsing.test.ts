import { describe, expect, it } from "vitest";
import { parsePubSubWebhookBody } from "@/lib/services/email-ingestion/gmail-client";

describe("parsePubSubWebhookBody", () => {
  it("extracts emailAddress and historyId from pubsub payload", () => {
    const encoded = Buffer.from(
      JSON.stringify({ emailAddress: "student@example.com", historyId: "12345" }),
      "utf8"
    ).toString("base64");
    const parsed = parsePubSubWebhookBody({ message: { data: encoded } });
    expect(parsed).toEqual({ emailAddress: "student@example.com", historyId: "12345" });
  });

  it("returns null for malformed payload", () => {
    const parsed = parsePubSubWebhookBody({ message: { data: "not-base64" } });
    expect(parsed).toBeNull();
  });
});
