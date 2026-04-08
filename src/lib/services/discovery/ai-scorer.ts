import Anthropic from "@anthropic-ai/sdk";

export const DISCOVERY_AI_SCORE_VERSION = 2;
export const DISCOVERY_AI_MODEL = "claude-sonnet-4-20250514";

export type DiscoveryVerdict = "strong_apply" | "apply" | "stretch" | "pass";
export type DiscoveryGatingFlag =
  | "missing_must_have"
  | "seniority_mismatch"
  | "years_mismatch"
  | "location_mismatch"
  | "remote_mismatch";

export type DiscoveryAiScore = {
  version: number;
  run_id?: string;
  heuristic_score: number;
  final_score: number;
  verdict: DiscoveryVerdict;
  confidence: number;
  subscores: {
    must_have: number;
    seniority: number;
    skills: number;
    logistics: number;
    upside: number;
  };
  evidence: string[];
  gaps: string[];
  gating_flags: DiscoveryGatingFlag[];
  reasoning: string;
  recommendation: string;
  scored_at: string;
  model: string;
};

type LegacyDiscoveryAiScore = {
  overall_score: number;
  dimensions?: {
    skills?: number;
    role_fit?: number;
    growth?: number;
    practical?: number;
  };
  reasoning?: string;
  key_strengths?: string[];
  key_gaps?: string[];
  recommendation?: string;
};

type RawDiscoveryAiScore = {
  final_score?: number;
  confidence?: number;
  subscores?: Partial<DiscoveryAiScore["subscores"]>;
  evidence?: string[];
  gaps?: string[];
  gating_flags?: string[];
  reasoning?: string;
  recommendation?: string;
};

export type JobSnippet = {
  id: string;
  title: string;
  company: string;
  location: string;
  heuristicScore: number | null;
  matchedKeywords: string[];
  missingKeywords: string[];
  gatingFlags: DiscoveryGatingFlag[];
  descriptionSnippet: string;
};

const clampPercent = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

export const verdictFromScore = (score: number): DiscoveryVerdict => {
  if (score >= 90) return "strong_apply";
  if (score >= 78) return "apply";
  if (score >= 64) return "stretch";
  return "pass";
};

export const getDiscoveryVerdictLabel = (verdict: DiscoveryVerdict): string => {
  if (verdict === "strong_apply") return "Strong apply";
  if (verdict === "apply") return "Apply";
  if (verdict === "stretch") return "Stretch";
  return "Pass";
};

const isDiscoveryGatingFlag = (value: unknown): value is DiscoveryGatingFlag =>
  value === "missing_must_have" ||
  value === "seniority_mismatch" ||
  value === "years_mismatch" ||
  value === "location_mismatch" ||
  value === "remote_mismatch";

const parseJsonArray = (text: string): RawDiscoveryAiScore[] => {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const raw = JSON.parse(text.slice(start, end + 1)) as unknown;
    return Array.isArray(raw) ? (raw as RawDiscoveryAiScore[]) : [];
  } catch {
    return [];
  }
};

const normalizeGatingFlags = (value: unknown): DiscoveryGatingFlag[] =>
  Array.isArray(value) ? value.filter(isDiscoveryGatingFlag) : [];

const cleanSnippet = (value: string): string =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const calibrateDiscoveryAiScore = (input: {
  heuristicScore: number | null;
  raw: RawDiscoveryAiScore;
  fallbackGatingFlags?: DiscoveryGatingFlag[];
  runId?: string;
}): DiscoveryAiScore => {
  const heuristicScore = clampPercent(input.heuristicScore ?? 0);
  const rawSubscores = input.raw.subscores ?? {};
  const evidence = Array.isArray(input.raw.evidence)
    ? input.raw.evidence.filter((value) => typeof value === "string").slice(0, 4)
    : [];
  const gaps = Array.isArray(input.raw.gaps)
    ? input.raw.gaps.filter((value) => typeof value === "string").slice(0, 4)
    : [];
  const gatingFlags = Array.from(
    new Set(
      [
        ...(Array.isArray(input.raw.gating_flags)
          ? input.raw.gating_flags.filter(isDiscoveryGatingFlag)
          : []),
        ...(input.fallbackGatingFlags ?? []),
      ]
    )
  );

  const subscores: DiscoveryAiScore["subscores"] = {
    must_have:
      typeof rawSubscores.must_have === "number"
        ? clampPercent(rawSubscores.must_have)
        : clampPercent(heuristicScore - (gatingFlags.includes("missing_must_have") ? 15 : 0)),
    seniority:
      typeof rawSubscores.seniority === "number"
        ? clampPercent(rawSubscores.seniority)
        : clampPercent(heuristicScore - (gatingFlags.includes("seniority_mismatch") ? 20 : 0)),
    skills:
      typeof rawSubscores.skills === "number"
        ? clampPercent(rawSubscores.skills)
        : heuristicScore,
    logistics:
      typeof rawSubscores.logistics === "number"
        ? clampPercent(rawSubscores.logistics)
        : clampPercent(heuristicScore - (gatingFlags.some((flag) => flag.endsWith("mismatch")) ? 8 : 0)),
    upside:
      typeof rawSubscores.upside === "number"
        ? clampPercent(rawSubscores.upside)
        : heuristicScore,
  };

  const weightedScore = Math.round(
    subscores.must_have * 0.35 +
      subscores.seniority * 0.2 +
      subscores.skills * 0.25 +
      subscores.logistics * 0.1 +
      subscores.upside * 0.1
  );
  const modelSuggested =
    typeof input.raw.final_score === "number" ? clampPercent(input.raw.final_score) : weightedScore;

  let scoreCap = 89;
  if (gatingFlags.length > 0) scoreCap = Math.min(scoreCap, 79);
  if (gatingFlags.includes("missing_must_have")) scoreCap = Math.min(scoreCap, 74);
  if (gatingFlags.includes("seniority_mismatch")) scoreCap = Math.min(scoreCap, 72);
  if (gatingFlags.includes("years_mismatch")) scoreCap = Math.min(scoreCap, 75);
  if (gatingFlags.includes("missing_must_have") && gatingFlags.includes("seniority_mismatch")) {
    scoreCap = Math.min(scoreCap, 60);
  }
  if (gatingFlags.includes("location_mismatch") || gatingFlags.includes("remote_mismatch")) {
    scoreCap = Math.min(scoreCap, 76);
  }
  if (subscores.must_have < 70) scoreCap = Math.min(scoreCap, 78);
  if (subscores.seniority < 70) scoreCap = Math.min(scoreCap, 76);
  if (subscores.skills < 72) scoreCap = Math.min(scoreCap, 82);
  if (evidence.length === 0) scoreCap = Math.min(scoreCap, 74);
  if (gaps.length >= 3) scoreCap = Math.min(scoreCap, 81);
  if (
    gatingFlags.length === 0 &&
    subscores.must_have >= 92 &&
    subscores.seniority >= 90 &&
    subscores.skills >= 88 &&
    subscores.logistics >= 78 &&
    heuristicScore >= 75
  ) {
    scoreCap = 96;
  }

  const finalScore = clampPercent(Math.min(modelSuggested, scoreCap));

  return {
    version: DISCOVERY_AI_SCORE_VERSION,
    run_id: input.runId,
    heuristic_score: heuristicScore,
    final_score: finalScore,
    verdict: verdictFromScore(finalScore),
    confidence:
      typeof input.raw.confidence === "number"
        ? clampPercent(input.raw.confidence)
        : clampPercent(60 + evidence.length * 8),
    subscores,
    evidence,
    gaps,
    gating_flags: gatingFlags,
    reasoning: typeof input.raw.reasoning === "string" ? input.raw.reasoning : "",
    recommendation:
      typeof input.raw.recommendation === "string"
        ? input.raw.recommendation
        : getDiscoveryVerdictLabel(verdictFromScore(finalScore)),
    scored_at: new Date().toISOString(),
    model: DISCOVERY_AI_MODEL,
  };
};

export const parseStoredAi = (row: { ai_score?: unknown }): DiscoveryAiScore | null => {
  const raw = row.ai_score;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const record = raw as Record<string, unknown>;
  if (typeof record.final_score === "number") {
    const subscoresRaw =
      record.subscores && typeof record.subscores === "object" && !Array.isArray(record.subscores)
        ? (record.subscores as Record<string, unknown>)
        : {};
    return {
      version:
        typeof record.version === "number"
          ? Math.max(1, Math.round(record.version))
          : DISCOVERY_AI_SCORE_VERSION,
      run_id: typeof record.run_id === "string" ? record.run_id : undefined,
      heuristic_score:
        typeof record.heuristic_score === "number" ? clampPercent(record.heuristic_score) : 0,
      final_score: clampPercent(record.final_score),
      verdict:
        record.verdict === "strong_apply" ||
        record.verdict === "apply" ||
        record.verdict === "stretch" ||
        record.verdict === "pass"
          ? record.verdict
          : verdictFromScore(clampPercent(record.final_score)),
      confidence:
        typeof record.confidence === "number" ? clampPercent(record.confidence) : 60,
      subscores: {
        must_have:
          typeof subscoresRaw.must_have === "number" ? clampPercent(subscoresRaw.must_have) : 0,
        seniority:
          typeof subscoresRaw.seniority === "number" ? clampPercent(subscoresRaw.seniority) : 0,
        skills: typeof subscoresRaw.skills === "number" ? clampPercent(subscoresRaw.skills) : 0,
        logistics:
          typeof subscoresRaw.logistics === "number" ? clampPercent(subscoresRaw.logistics) : 0,
        upside: typeof subscoresRaw.upside === "number" ? clampPercent(subscoresRaw.upside) : 0,
      },
      evidence: Array.isArray(record.evidence)
        ? (record.evidence.filter((value) => typeof value === "string") as string[]).slice(0, 4)
        : [],
      gaps: Array.isArray(record.gaps)
        ? (record.gaps.filter((value) => typeof value === "string") as string[]).slice(0, 4)
        : [],
      gating_flags: normalizeGatingFlags(record.gating_flags),
      reasoning: typeof record.reasoning === "string" ? record.reasoning : "",
      recommendation: typeof record.recommendation === "string" ? record.recommendation : "",
      scored_at: typeof record.scored_at === "string" ? record.scored_at : "",
      model: typeof record.model === "string" ? record.model : DISCOVERY_AI_MODEL,
    };
  }

  const legacy = record as LegacyDiscoveryAiScore;
  if (typeof legacy.overall_score !== "number") return null;

  const finalScore = clampPercent(legacy.overall_score);
  return {
    version: 1,
    run_id: typeof record.run_id === "string" ? record.run_id : undefined,
    heuristic_score: 0,
    final_score: finalScore,
    verdict: verdictFromScore(finalScore),
    confidence: 55,
    subscores: {
      must_have:
        typeof legacy.dimensions?.skills === "number"
          ? clampPercent(legacy.dimensions.skills)
          : finalScore,
      seniority:
        typeof legacy.dimensions?.role_fit === "number"
          ? clampPercent(legacy.dimensions.role_fit)
          : finalScore,
      skills:
        typeof legacy.dimensions?.skills === "number"
          ? clampPercent(legacy.dimensions.skills)
          : finalScore,
      logistics:
        typeof legacy.dimensions?.practical === "number"
          ? clampPercent(legacy.dimensions.practical)
          : finalScore,
      upside:
        typeof legacy.dimensions?.growth === "number"
          ? clampPercent(legacy.dimensions.growth)
          : finalScore,
    },
    evidence: Array.isArray(legacy.key_strengths)
      ? legacy.key_strengths.filter((value) => typeof value === "string").slice(0, 4)
      : [],
    gaps: Array.isArray(legacy.key_gaps)
      ? legacy.key_gaps.filter((value) => typeof value === "string").slice(0, 4)
      : [],
    gating_flags: [],
    reasoning: typeof legacy.reasoning === "string" ? legacy.reasoning : "",
    recommendation:
      typeof legacy.recommendation === "string" ? legacy.recommendation : getDiscoveryVerdictLabel(verdictFromScore(finalScore)),
    scored_at: "",
    model: DISCOVERY_AI_MODEL,
  };
};

export const getDiscoveryPrimaryScore = (row: {
  match_score?: number | null;
  ai_score?: unknown;
}): number | null => {
  const ai = parseStoredAi(row);
  if (ai) return ai.final_score;
  return typeof row.match_score === "number" ? clampPercent(row.match_score) : null;
};

export const scoreJobSnippetsWithClaude = async (input: {
  resumeText: string;
  profileContextText?: string;
  profileSkills: string[];
  jobs: JobSnippet[];
}): Promise<Map<string, DiscoveryAiScore>> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const anthropic = new Anthropic({ apiKey });
  const skillsLine = input.profileSkills.slice(0, 40).join(", ") || "(none listed)";
  const profileContext = input.profileContextText?.trim()
    ? cleanSnippet(input.profileContextText).slice(0, 1200)
    : "(none provided)";

  const jobBlocks = input.jobs
    .map((job) =>
      [
        `ID: ${job.id}`,
        `Title: ${job.title}`,
        `Company: ${job.company}`,
        `Location: ${job.location || "(unknown)"}`,
        `Heuristic score: ${job.heuristicScore ?? 0}`,
        `Matched keywords: ${job.matchedKeywords.join(", ") || "(none)"}`,
        `Missing keywords: ${job.missingKeywords.join(", ") || "(none)"}`,
        `Known gating flags: ${job.gatingFlags.join(", ") || "(none)"}`,
        "Description (cleaned, truncated):",
        job.descriptionSnippet,
      ].join("\n")
    )
    .join("\n---\n");

  const prompt = `You evaluate internship and entry-level job fit conservatively.

Reserve 90+ only for near-exact matches with strong evidence and no major risks.
If there is a seniority mismatch, years-of-experience mismatch, missing must-have skills, or clear location/remote conflict, do not score the role above the low 80s.
Use only integers from 0 to 100.

Resume summary (may be truncated):
${cleanSnippet(input.resumeText).slice(0, 5000)}

Profile context:
${profileContext}

Profile skills:
${skillsLine}

Jobs:
${jobBlocks}

Return a JSON array only (no markdown), one object per job ID above, same order.
Each object must have:
- final_score: 0-100 integer
- confidence: 0-100 integer
- subscores: { must_have: 0-100, seniority: 0-100, skills: 0-100, logistics: 0-100, upside: 0-100 }
- evidence: string array, 1-3 concise evidence bullets grounded in the resume/profile
- gaps: string array, 0-3 concrete missing or weak-fit items
- gating_flags: string array using only "missing_must_have", "seniority_mismatch", "years_mismatch", "location_mismatch", "remote_mismatch"
- reasoning: one concise sentence
- recommendation: one short sentence telling the candidate whether to apply`;

  const response = await anthropic.messages.create({
    model: DISCOVERY_AI_MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const text = textBlock && textBlock.type === "text" ? textBlock.text : "";
  const arr = parseJsonArray(text);
  const map = new Map<string, DiscoveryAiScore>();

  input.jobs.forEach((job, index) => {
    const raw = arr[index];
    if (!raw) return;
    map.set(
      job.id,
      calibrateDiscoveryAiScore({
        heuristicScore: job.heuristicScore,
        raw,
        fallbackGatingFlags: job.gatingFlags,
        runId: undefined,
      })
    );
  });

  return map;
};
