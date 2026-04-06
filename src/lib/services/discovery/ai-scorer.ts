import Anthropic from "@anthropic-ai/sdk";

export type DiscoveryAiScore = {
  overall_score: number;
  dimensions: {
    skills: number;
    role_fit: number;
    growth: number;
    practical: number;
  };
  reasoning: string;
  key_strengths: string[];
  key_gaps: string[];
  recommendation: string;
};

export const parseStoredAi = (row: { ai_score?: unknown }): DiscoveryAiScore | null => {
  const raw = row.ai_score;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.overall_score !== "number") return null;
  const dims = o.dimensions;
  let dimensions: DiscoveryAiScore["dimensions"] | undefined;
  if (dims && typeof dims === "object" && !Array.isArray(dims)) {
    const d = dims as Record<string, unknown>;
    if (
      typeof d.skills === "number" &&
      typeof d.role_fit === "number" &&
      typeof d.growth === "number" &&
      typeof d.practical === "number"
    ) {
      dimensions = {
        skills: d.skills,
        role_fit: d.role_fit,
        growth: d.growth,
        practical: d.practical,
      };
    }
  }
  return {
    overall_score: o.overall_score,
    dimensions: dimensions ?? { skills: 0, role_fit: 0, growth: 0, practical: 0 },
    reasoning: typeof o.reasoning === "string" ? o.reasoning : "",
    key_strengths: Array.isArray(o.key_strengths) ? (o.key_strengths.filter((x) => typeof x === "string") as string[]) : [],
    key_gaps: Array.isArray(o.key_gaps) ? (o.key_gaps.filter((x) => typeof x === "string") as string[]) : [],
    recommendation: typeof o.recommendation === "string" ? o.recommendation : "",
  };
};

export type JobSnippet = {
  id: string;
  title: string;
  company: string;
  descriptionSnippet: string;
};

const MODEL = "claude-sonnet-4-20250514";

const parseJsonArray = (text: string): DiscoveryAiScore[] => {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const raw = JSON.parse(text.slice(start, end + 1)) as unknown;
    return Array.isArray(raw) ? (raw as DiscoveryAiScore[]) : [];
  } catch {
    return [];
  }
};

export const scoreJobSnippetsWithClaude = async (input: {
  resumeText: string;
  profileSkills: string[];
  jobs: JobSnippet[];
}): Promise<Map<string, DiscoveryAiScore>> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const anthropic = new Anthropic({ apiKey });
  const skillsLine = input.profileSkills.slice(0, 40).join(", ") || "(none listed)";

  const jobBlocks = input.jobs
    .map(
      (j) =>
        `ID: ${j.id}\nTitle: ${j.title}\nCompany: ${j.company}\nDescription (truncated):\n${j.descriptionSnippet}\n`
    )
    .join("\n---\n");

  const prompt = `You evaluate internship and entry-level job fit. Resume summary (may be truncated):\n${input.resumeText.slice(0, 4000)}\n\nProfile skills: ${skillsLine}\n\nJobs:\n${jobBlocks}\n\nReturn a JSON array only (no markdown), one object per job ID above, same order. Each object must have:
- overall_score: 0-100 integer
- dimensions: { skills: 0-100, role_fit: 0-100, growth: 0-100, practical: 0-100 } — weights: skills 35%, role_fit 25%, growth 25%, practical 15% (overall_score should reflect these weights approximately)
- reasoning: one concise sentence
- key_strengths: string array, max 3 items
- key_gaps: string array, max 3 items
- recommendation: one of "strong_match" | "worth_applying" | "low_priority"`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const text = textBlock && textBlock.type === "text" ? textBlock.text : "";
  const arr = parseJsonArray(text);
  const map = new Map<string, DiscoveryAiScore>();

  input.jobs.forEach((job, i) => {
    const scored = arr[i];
    if (scored && typeof scored.overall_score === "number") {
      map.set(job.id, scored);
    }
  });

  return map;
};
