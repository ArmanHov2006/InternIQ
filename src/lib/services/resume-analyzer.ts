const TECH_TERMS = [
  "typescript",
  "javascript",
  "react",
  "next",
  "node",
  "python",
  "java",
  "sql",
  "postgresql",
  "mongodb",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "tailwind",
  "graphql",
  "rest",
  "redis",
  "supabase",
  "zustand",
  "git",
  "linux",
  "ci",
  "cd",
  "testing",
  "jest",
  "vitest",
  "cypress",
  "figma",
  "framer",
] as const;

const ACTION_VERBS = [
  "built",
  "developed",
  "implemented",
  "designed",
  "led",
  "improved",
  "optimized",
  "launched",
  "delivered",
  "created",
  "analyzed",
  "collaborated",
  "managed",
  "automated",
  "architected",
] as const;

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "for",
  "in",
  "of",
  "on",
  "with",
  "from",
  "at",
  "is",
  "are",
  "be",
  "as",
  "by",
  "that",
  "this",
  "you",
  "your",
  "we",
  "our",
  "will",
]);

export type AnalyzeComputation = {
  fitScore: number;
  missingKeywords: string[];
  suggestions: string[];
  highlights: string[];
  matchedKeywords: string[];
  actionVerbCoverage: number;
};

const normalize = (text: string): string => text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ");

const tokenize = (text: string): string[] =>
  normalize(text)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));

const frequencyMap = (tokens: string[]): Map<string, number> => {
  const map = new Map<string, number>();
  for (const token of tokens) {
    map.set(token, (map.get(token) ?? 0) + 1);
  }
  return map;
};

const scoreFromOverlap = (resumeFreq: Map<string, number>, jobFreq: Map<string, number>): number => {
  const jobUnique = Array.from(jobFreq.keys());
  if (jobUnique.length === 0) return 0;
  const matched = jobUnique.filter((term) => resumeFreq.has(term)).length;
  return Math.round((matched / jobUnique.length) * 100);
};

const extractTechTerms = (text: string): string[] => {
  const normalizedText = normalize(text);
  return TECH_TERMS.filter((term) => normalizedText.includes(term));
};

const topKeywords = (freq: Map<string, number>, limit = 15): string[] =>
  Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);

const unique = (arr: string[]): string[] => Array.from(new Set(arr));

export function analyzeResumeFit(resumeText: string, jobInput: string): AnalyzeComputation {
  const resumeTokens = tokenize(resumeText);
  const jobTokens = tokenize(jobInput);
  const resumeFreq = frequencyMap(resumeTokens);
  const jobFreq = frequencyMap(jobTokens);

  const overlapScore = scoreFromOverlap(resumeFreq, jobFreq);
  const jobTechTerms = extractTechTerms(jobInput);
  const resumeTechTerms = extractTechTerms(resumeText);
  const matchedTechTerms = jobTechTerms.filter((term) => resumeTechTerms.includes(term));
  const missingTechTerms = jobTechTerms.filter((term) => !resumeTechTerms.includes(term));
  const actionVerbHits = ACTION_VERBS.filter((verb) => normalize(resumeText).includes(verb)).length;
  const actionVerbCoverage = Math.round((actionVerbHits / ACTION_VERBS.length) * 100);

  const jobTopTerms = topKeywords(jobFreq, 20);
  const missingTopTerms = jobTopTerms.filter((term) => !resumeFreq.has(term)).slice(0, 12);
  const missingKeywords = unique([...missingTechTerms, ...missingTopTerms]).slice(0, 12);

  const fitScore = Math.max(
    0,
    Math.min(100, Math.round(overlapScore * 0.65 + (matchedTechTerms.length / Math.max(jobTechTerms.length, 1)) * 25 + actionVerbCoverage * 0.1))
  );

  const suggestions: string[] = [];
  if (missingTechTerms.length > 0) {
    suggestions.push(`Add evidence of ${missingTechTerms.slice(0, 4).join(", ")} in projects or experience bullets.`);
  }
  if (actionVerbCoverage < 30) {
    suggestions.push("Use stronger action verbs (built, optimized, implemented, led) in your bullet points.");
  }
  if (overlapScore < 50) {
    suggestions.push("Mirror more of the job-post language in your summary and skill sections.");
  }
  if (suggestions.length === 0) {
    suggestions.push("Great baseline match. Add measurable outcomes (percent improvements, scale, impact) to maximize fit.");
  }

  const highlights = [
    `Keyword overlap: ${overlapScore}%`,
    `Technical stack match: ${matchedTechTerms.length}/${Math.max(jobTechTerms.length, 1)}`,
    `Action-verb strength: ${actionVerbCoverage}%`,
  ];

  return {
    fitScore,
    missingKeywords,
    suggestions,
    highlights,
    matchedKeywords: matchedTechTerms.slice(0, 12),
    actionVerbCoverage,
  };
}
