import { describe, expect, it } from "vitest";
import {
  buildOpportunityDedupeKey,
  buildProofPack,
  computeMatchInsight,
  inferBoardFromUrl,
  parseProofPackArtifact,
} from "@/lib/services/career-os";
import type { Application } from "@/types/database";

describe("career os utilities", () => {
  it("infers a board and builds stable dedupe keys", () => {
    expect(inferBoardFromUrl("https://www.linkedin.com/jobs/view/123")).toBe("LinkedIn");
    expect(
      buildOpportunityDedupeKey({
        company: "Vercel",
        role: "Engineer",
        job_url: "https://company.com/jobs/1",
      })
    ).toBe("url:https://company.com/jobs/1");
  });

  it("computes keyword-based match insight", () => {
    const insight = computeMatchInsight({
      jobDescription:
        "Looking for a React TypeScript engineer with experimentation and analytics experience.",
      resumeText:
        "Built React and TypeScript product features and partner closely with analytics teams.",
    });

    expect(insight.score).toBeGreaterThan(50);
    expect(insight.matched_keywords).toContain("react");
    expect(insight.missing_keywords).toContain("experimentation");
  });

  it("builds a parseable proof pack artifact payload", () => {
    const application: Application = {
      id: "app-1",
      user_id: "user-1",
      company: "Stripe",
      role: "Backend Intern",
      job_url: "https://jobs.stripe.com",
      job_description: "Build backend systems with strong API design.",
      status: "interview",
      source: "manual",
      board: "Company Site",
      external_job_id: "",
      applied_date: "2026-03-30",
      salary_range: "",
      location: "Remote",
      notes: "",
      fit_score: null,
      match_score: 81,
      fit_analysis: "",
      contact_name: "",
      contact_email: "",
      generated_email: "",
      next_action_at: null,
      last_contacted_at: null,
      resume_version_id: null,
      display_order: 0,
      last_status_change_source: "manual",
      last_status_change_reason: "",
      last_status_change_at: "2026-03-30T00:00:00.000Z",
      created_at: "2026-03-30T00:00:00.000Z",
      updated_at: "2026-03-30T00:00:00.000Z",
      ai_metadata: {},
    };

    const proofPack = buildProofPack({
      application,
      profile: {
        id: "user-1",
        username: "jane",
        full_name: "Jane Doe",
        headline: "Backend engineer who likes clean APIs",
        bio: "Built shipping products with TypeScript and Node.",
        avatar_url: "",
        resume_url: "",
        website_url: "",
        github_url: "",
        linkedin_url: "",
        twitter_url: "",
        location: "Remote",
        is_open_to_work: true,
        created_at: "2026-03-30T00:00:00.000Z",
        updated_at: "2026-03-30T00:00:00.000Z",
      },
      projects: [
        {
          id: "project-1",
          user_id: "user-1",
          name: "API Platform",
          description: "Built an internal API platform",
          tech_stack: ["TypeScript", "Node.js"],
          live_url: "",
          github_url: "",
          image_url: "",
          start_date: null,
          end_date: null,
          display_order: 0,
          created_at: "2026-03-30T00:00:00.000Z",
        },
      ],
      experience: [
        {
          id: "exp-1",
          user_id: "user-1",
          company: "Acme",
          title: "Software Intern",
          location: "Remote",
          start_date: null,
          end_date: null,
          description: "",
          is_internship: true,
          display_order: 0,
          created_at: "2026-03-30T00:00:00.000Z",
        },
      ],
      resume: {
        id: "resume-1",
        user_id: "user-1",
        file_name: "resume.pdf",
        file_url: "",
        parsed_text: "TypeScript Node backend work",
        is_primary: true,
        created_at: "2026-03-30T00:00:00.000Z",
      },
      contacts: [],
    });

    const parsed = parseProofPackArtifact({
      id: "artifact-1",
      user_id: "user-1",
      application_id: "app-1",
      artifact_type: "proof_pack",
      title: proofPack.artifactTitle,
      content: proofPack.packContent,
      share_slug: proofPack.shareSlug,
      created_at: "2026-03-30T00:00:00.000Z",
      updated_at: "2026-03-30T00:00:00.000Z",
    });

    expect(proofPack.shareSlug).toContain("stripe-backend-intern");
    expect(parsed?.recruiterNote).toContain("Stripe");
    expect(parsed?.evidenceBullets?.length).toBeGreaterThan(0);
  });
});
