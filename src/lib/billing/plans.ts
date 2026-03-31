export type BillingPlanId = "free" | "pro" | "pro_plus";

export type PlanDefinition = {
  id: BillingPlanId;
  name: string;
  monthlyUsd: number;
  annualUsd: number;
  features: string[];
  limits: {
    monthlyAiActions: number;
    applications: number | "unlimited";
    gmailAutomation: boolean;
    batchPrep: boolean;
    prioritizer: boolean;
  };
};

export const BILLING_PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    monthlyUsd: 0,
    annualUsd: 0,
    features: ["Pipeline tracker", "Dashboard and insights", "Limited AI actions"],
    limits: {
      monthlyAiActions: 30,
      applications: 150,
      gmailAutomation: false,
      batchPrep: false,
      prioritizer: false,
    },
  },
  {
    id: "pro",
    name: "Pro",
    monthlyUsd: 12,
    annualUsd: 9,
    features: ["AI fit prioritizer", "Application pack generator", "Follow-up copilot"],
    limits: {
      monthlyAiActions: 300,
      applications: "unlimited",
      gmailAutomation: true,
      batchPrep: true,
      prioritizer: true,
    },
  },
  {
    id: "pro_plus",
    name: "Pro+",
    monthlyUsd: 29,
    annualUsd: 24,
    features: ["Inbox-to-tracker autopilot", "Advanced interview intelligence", "Priority support"],
    limits: {
      monthlyAiActions: 1000,
      applications: "unlimited",
      gmailAutomation: true,
      batchPrep: true,
      prioritizer: true,
    },
  },
];

export const getPlanById = (id: BillingPlanId): PlanDefinition =>
  BILLING_PLANS.find((plan) => plan.id === id) ?? BILLING_PLANS[0];
