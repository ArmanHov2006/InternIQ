import { NextResponse } from "next/server";

const demoWorkflowPayload = {
  account: {
    displayName: "Taylor Morgan",
    university: "State University",
    targetRole: "Product Intern",
  },
  cardsByStage: {
    saved: [
      { id: "saved-ramp", company: "Ramp", role: "Operations Intern" },
      { id: "saved-atlassian", company: "Atlassian", role: "PM Intern" },
    ],
    applied: [{ id: "applied-vercel", company: "Vercel", role: "Frontend Intern" }],
    interview: [{ id: "interview-figma", company: "Figma", role: "Product Intern" }],
    offer: [{ id: "offer-linear", company: "Linear", role: "Strategy Intern" }],
  },
  movingCard: { id: "moving-stripe", company: "Stripe", role: "Product Intern" },
  phases: [
    {
      id: "phase-applied",
      label: "Pipeline",
      stage: "applied",
      durationMs: 2800,
      message: "New role captured and moved into Applied.",
      detail: {
        type: "pipeline",
        note: "Track every application in one board instead of scattered notes.",
      },
    },
    {
      id: "phase-interview",
      label: "Pipeline",
      stage: "interview",
      durationMs: 2600,
      message: "A recruiter replied and the role was advanced to Interview.",
      detail: {
        type: "pipeline",
        note: "Status updates are instant, so your momentum stays visible.",
      },
    },
    {
      id: "phase-fit",
      label: "AI Fit",
      stage: "interview",
      durationMs: 3000,
      message: "AI fit analysis highlights this role as high priority.",
      detail: {
        type: "fit",
        score: 91,
        note: "Fit score combines skills, coursework, projects, and role requirements.",
      },
    },
    {
      id: "phase-offer",
      label: "Pipeline",
      stage: "offer",
      durationMs: 2300,
      message: "After final interviews, this opportunity reaches Offer.",
      detail: {
        type: "pipeline",
        note: "Offer outcomes are surfaced automatically across the dashboard.",
      },
    },
    {
      id: "phase-email",
      label: "AI Email",
      stage: "offer",
      durationMs: 3600,
      message: "InternIQ drafts personalized outreach for similar high-fit roles.",
      detail: {
        type: "email",
        lines: [
          "Hi Nina - I loved Stripe's product rigor in docs + onboarding.",
          "I built a portfolio platform used by 1,200+ students across 20 campuses.",
          "Would you be open to a short intro call about your intern team?",
        ],
        note: "Generated drafts are tailored to your experience and target role.",
      },
    },
    {
      id: "phase-summary",
      label: "Summary",
      stage: "offer",
      durationMs: 2500,
      message: "One system: pipeline tracking, fit guidance, and AI outreach.",
      detail: {
        type: "summary",
        note: "This is the daily loop students run in InternIQ.",
      },
    },
  ],
} as const;

export async function GET() {
  return NextResponse.json(demoWorkflowPayload, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
