import { beforeEach, describe, expect, it, vi } from "vitest";

const { withAuthMock, scoreDiscoveryShortlistForUserMock } = vi.hoisted(() => ({
  withAuthMock: vi.fn(),
  scoreDiscoveryShortlistForUserMock: vi.fn(),
}));

vi.mock("@/lib/features", () => ({
  isJobDiscoveryEnabled: () => true,
}));

vi.mock("@/lib/server/route-utils", () => ({
  isSupabaseConfigured: true,
  withAuth: withAuthMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkAiRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/services/discovery/score-discovery", () => ({
  scoreDiscoveryShortlistForUser: scoreDiscoveryShortlistForUserMock,
}));

import { POST } from "@/app/api/discovery/score/route";

describe("discovery score route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withAuthMock.mockResolvedValue({
      supabase: {},
      user: { id: "user-1" },
    });
  });

  it("returns batched scoring progress", async () => {
    scoreDiscoveryShortlistForUserMock.mockResolvedValue({
      runId: "run-1",
      scored: 10,
      candidates: 25,
      remaining: 15,
      done: false,
    });

    const response = await POST(
      new Request("http://localhost/api/discovery/score", {
        method: "POST",
        body: JSON.stringify({ runId: "run-1", limit: 10 }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      runId: "run-1",
      scored: 10,
      candidates: 25,
      remaining: 15,
      done: false,
    });
  });

  it("returns an empty eligible response when everything is already scored", async () => {
    scoreDiscoveryShortlistForUserMock.mockResolvedValue({
      runId: "run-1",
      scored: 0,
      candidates: 0,
      remaining: 0,
      done: true,
    });

    const response = await POST(
      new Request("http://localhost/api/discovery/score", {
        method: "POST",
        body: JSON.stringify({ runId: "run-1" }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      runId: "run-1",
      scored: 0,
      candidates: 0,
      remaining: 0,
      done: true,
      message: "No eligible jobs.",
    });
  });
});
