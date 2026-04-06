import type {
  ApplicationArtifact,
  ApplicationContact,
  ApplicationTimelineEvent,
  InterviewEvent,
  Opportunity,
} from "@/types/database";

const now = () => new Date().toISOString();

export const createDemoOpportunity = (
  id: string,
  company: string,
  role: string,
  overrides: Partial<Opportunity> = {}
): Opportunity => {
  const createdAt = now();
  return {
    id,
    user_id: "demo-user",
    company,
    role,
    location: "Remote",
    board: "LinkedIn",
    source: "recommendation",
    job_url: `https://example.com/jobs/${id}`,
    external_job_id: id,
    salary_range: "",
    status: "new",
    employment_type: "Full-time",
    job_description:
      "Build product experiences, collaborate with product and design, and ship full-stack features with React and TypeScript.",
    match_score: 82,
    match_summary: "Strong overlap on react, typescript, product, and shipping.",
    matched_keywords: ["react", "typescript", "product", "shipping"],
    missing_keywords: ["experimentation", "graphql"],
    application_id: null,
    created_at: createdAt,
    updated_at: createdAt,
    api_source: null,
    api_job_id: null,
    discovery_run_id: null,
    ai_score: {},
    posted_at: null,
    ...overrides,
  };
};

export const demoOpportunityStore = new Map<string, Opportunity>([
  [
    "opp-demo-1",
    createDemoOpportunity("opp-demo-1", "Linear", "Product Engineer", {
      board: "Company Site",
      location: "New York, NY",
      source: "recommendation",
      api_source: "remotive",
      api_job_id: "remotive-demo-1",
    }),
  ],
  [
    "opp-demo-2",
    createDemoOpportunity("opp-demo-2", "Ramp", "Growth Analyst", {
      board: "LinkedIn",
      location: "Remote",
      match_score: 74,
      matched_keywords: ["analytics", "sql", "stakeholders"],
      missing_keywords: ["experimentation", "python"],
      match_summary: "Strong on analytics and stakeholder work. Missing experimentation depth.",
    }),
  ],
  [
    "opp-demo-3",
    createDemoOpportunity("opp-demo-3", "Vercel", "Developer Experience Engineer", {
      board: "Greenhouse",
      source: "extension",
      match_score: 88,
      matched_keywords: ["developer", "typescript", "docs", "react"],
      missing_keywords: ["node", "community"],
    }),
  ],
]);

export const demoContactStore = new Map<string, ApplicationContact>([
  [
    "contact-demo-1",
    {
      id: "contact-demo-1",
      user_id: "demo-user",
      application_id: "demo-2",
      name: "Avery Chen",
      email: "avery@example.com",
      title: "Recruiter",
      company: "Stripe",
      relationship_type: "recruiter",
      notes: "Reached out after onsite. Mentioned fast-moving backend team.",
      last_contacted_at: now(),
      next_follow_up_at: null,
      created_at: now(),
      updated_at: now(),
    },
  ],
]);

export const demoInterviewStore = new Map<string, InterviewEvent>([
  [
    "interview-demo-1",
    {
      id: "interview-demo-1",
      user_id: "demo-user",
      application_id: "demo-2",
      title: "Backend systems interview",
      interview_type: "technical",
      scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      location: "Google Meet",
      notes: "Expect API design and scaling tradeoffs.",
      created_at: now(),
      updated_at: now(),
    },
  ],
]);

export const demoArtifactStore = new Map<string, ApplicationArtifact>([
  [
    "artifact-demo-1",
    {
      id: "artifact-demo-1",
      user_id: "demo-user",
      application_id: "demo-1",
      artifact_type: "proof_pack",
      title: "Vercel proof pack",
      content: JSON.stringify(
        {
          company: "Vercel",
          role: "Software Engineer Intern",
          headline: "Frontend engineer focused on polished developer experiences",
          recruiterNote:
            "Hi Hiring Team,\n\nI pulled together a focused proof-of-fit pack for the Software Engineer Intern role.\n\nThe strongest evidence is shipping React features quickly and communicating tradeoffs clearly.\n\nHappy to share more detail if useful.",
          evidenceBullets: [
            "Built React features with strong product polish",
            "Shipped full-stack iterations quickly",
            "Comfortable with TypeScript and developer-facing UX",
          ],
          valueNarrative:
            "Strong fit for a product-oriented engineering environment with fast shipping cadence.",
          contact: null,
        },
        null,
        2
      ),
      share_slug: "vercel-software-engineer-intern-demo",
      created_at: now(),
      updated_at: now(),
    },
  ],
]);

export const demoTimelineStore = new Map<string, ApplicationTimelineEvent>([
  [
    "timeline-demo-1",
    {
      id: "timeline-demo-1",
      user_id: "demo-user",
      application_id: "demo-1",
      event_type: "status_change",
      title: "Moved to applied",
      description: "Application submitted from tracker workflow.",
      occurred_at: now(),
      created_at: now(),
      metadata: null,
    },
  ],
  [
    "timeline-demo-2",
    {
      id: "timeline-demo-2",
      user_id: "demo-user",
      application_id: "demo-2",
      event_type: "interview",
      title: "Interview scheduled",
      description: "Backend systems interview added to your loop.",
      occurred_at: now(),
      created_at: now(),
      metadata: null,
    },
  ],
]);

export const addDemoTimelineEvent = (
  input: Omit<ApplicationTimelineEvent, "id" | "created_at">
): ApplicationTimelineEvent => {
  const event: ApplicationTimelineEvent = {
    ...input,
    id: crypto.randomUUID(),
    created_at: now(),
  };
  demoTimelineStore.set(event.id, event);
  return event;
};
