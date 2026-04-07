import { describe, expect, it } from "vitest";
import {
  buildDiscoveryPreferencesResponse,
  buildDiscoverySearchContext,
  buildResumeContextPreview,
  defaultDiscoveryPreferencesRow,
} from "@/lib/services/discovery/resume-context";

const profileContext = {
  resumeText:
    "Software Intern building Python FastAPI Redis Docker systems for LLM and RAG workflows.",
  profileKeywords: ["Python", "PostgreSQL"],
  profileContextText:
    "Headline: Backend engineer\nBio: Builds AI platform tooling.\nLocation: Toronto\nSoftware Intern at Acme\nTech stack: Python, FastAPI, Redis, Docker",
  profileLocation: "Toronto",
};

describe("discovery resume context", () => {
  it("returns detected and effective context when a resume exists", () => {
    const preview = buildResumeContextPreview({
      profileContext,
      preferences: defaultDiscoveryPreferencesRow(),
    });

    expect(preview.has_resume).toBe(true);
    expect(preview.detected_skills).toEqual(
      expect.arrayContaining(["Python", "FastAPI", "Redis", "Docker"])
    );
    expect(preview.detected_locations).toEqual(["Toronto"]);
    expect(preview.detected_role_types).toEqual(["intern", "entry-level", "junior"]);
    expect(preview.effective_skills).toEqual(preview.detected_skills);
  });

  it("falls back to resume text for location when profile location is missing", () => {
    const preview = buildResumeContextPreview({
      profileContext: {
        ...profileContext,
        profileLocation: "",
        profileContextText:
          "Headline: Backend engineer\nBio: Builds AI platform tooling.\nSoftware Intern at Acme",
        resumeText:
          "Software Intern building Python FastAPI systems in Toronto, ON for AI infrastructure work.",
      },
      preferences: defaultDiscoveryPreferencesRow(),
    });

    expect(preview.detected_locations).toEqual(["Toronto, ON"]);
  });

  it("falls back cleanly when no resume exists", () => {
    const response = buildDiscoveryPreferencesResponse({
      userId: "user-1",
      row: {
        ...defaultDiscoveryPreferencesRow(),
        resume_context_enabled: true,
      },
      profileContext: null,
    });

    expect(response.resume_context_preview?.has_resume).toBe(false);
    expect(response.resume_context_preview?.detected_skills).toEqual([]);
    expect(response.resume_context_preview?.summary).toContain("No resume detected yet");
  });

  it("uses saved overrides without mutating detected context", () => {
    const response = buildDiscoveryPreferencesResponse({
      userId: "user-1",
      row: {
        ...defaultDiscoveryPreferencesRow(),
        resume_context_enabled: true,
        resume_context_customized: true,
        resume_context_overrides: {
          skills: ["Python", "FastAPI", "OpenAI"],
          locations: ["Remote"],
          role_types: ["intern"],
          note: "AI infrastructure internships",
        },
      },
      profileContext,
    });

    expect(response.resume_context_preview?.detected_locations).toEqual(["Toronto"]);
    expect(response.resume_context_preview?.effective_locations).toEqual(["Remote"]);
    expect(response.resume_context_preview?.effective_skills).toEqual([
      "Python",
      "FastAPI",
      "OpenAI",
    ]);
  });

  it("restores effective context to detected context when reset", () => {
    const preview = buildResumeContextPreview({
      profileContext,
      preferences: {
        ...defaultDiscoveryPreferencesRow(),
        resume_context_enabled: true,
        resume_context_customized: false,
        resume_context_overrides: {
          skills: [],
          locations: [],
          role_types: [],
          note: "",
        },
      },
    });

    expect(preview.effective_skills).toEqual(preview.detected_skills);
    expect(preview.effective_locations).toEqual(preview.detected_locations);
  });

  it("builds merged search inputs from effective context and advanced filters", () => {
    const preview = buildResumeContextPreview({
      profileContext,
      preferences: defaultDiscoveryPreferencesRow(),
    });
    const searchContext = buildDiscoverySearchContext({
      preferences: {
        ...defaultDiscoveryPreferencesRow(),
        keywords: ["platform"],
        locations: ["Remote"],
        role_types: ["co-op"],
        resume_context_customized: true,
        resume_context_overrides: {
          skills: ["Python", "FastAPI"],
          locations: ["Toronto"],
          role_types: ["intern"],
          note: "AI infra",
        },
      },
      preview,
    });

    expect(searchContext.keywords).toEqual(
      expect.arrayContaining(["Python", "FastAPI", "platform", "AI infra"])
    );
    expect(searchContext.locations).toEqual(expect.arrayContaining(["Toronto", "Remote"]));
    expect(searchContext.roleTypes).toEqual(expect.arrayContaining(["intern", "co-op"]));
  });
});
