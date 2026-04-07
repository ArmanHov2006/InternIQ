import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { getDiscoveryProfileContext } from "@/lib/server/resume-keywords";

const createSupabaseStub = () =>
  ({
    from: (table: string) => {
      if (table === "resumes") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  {
                    parsed_text: "Python backend engineer building FastAPI services.",
                    is_primary: true,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "skills") {
        return {
          select: () => ({
            eq: async () => ({
              data: [{ name: "Python" }, { name: "PostgreSQL" }],
              error: null,
            }),
          }),
        };
      }

      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  headline: "Backend engineer",
                  bio: "Builds API platforms and data workflows.",
                  location: "Toronto",
                },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "experience") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  {
                    title: "Software Intern",
                    company: "Acme",
                    description: "Built internal APIs and automation.",
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "projects") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  {
                    name: "Sentinel",
                    description: "Security-focused LLM gateway.",
                    tech_stack: ["Python", "FastAPI", "Redis"],
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  }) as unknown as SupabaseClient;

describe("getDiscoveryProfileContext", () => {
  it("builds profile keywords and a rich context corpus", async () => {
    const context = await getDiscoveryProfileContext(createSupabaseStub(), "user-1");

    expect(context.resumeText).toContain("FastAPI");
    expect(context.profileKeywords).toEqual(["Python", "PostgreSQL"]);
    expect(context.profileContextText).toContain("Headline: Backend engineer");
    expect(context.profileContextText).toContain("Software Intern at Acme");
    expect(context.profileContextText).toContain("Tech stack: Python, FastAPI, Redis");
    expect(context.profileLocation).toBe("Toronto");
  });
});
