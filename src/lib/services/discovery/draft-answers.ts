import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-20250514";

export const generateDraftAnswersMarkdown = async (input: {
  company: string;
  role: string;
  jobDescription: string;
  resumeText: string;
}): Promise<string> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const anthropic = new Anthropic({ apiKey });
  const prompt = `Write concise draft answers the candidate can paste into external job application forms. Do not fabricate employers or degrees. Use STAR-style hints where useful.

Company: ${input.company}
Role: ${input.role}

Job description (truncated):
${input.jobDescription.slice(0, 6000)}

Resume / profile text (truncated):
${input.resumeText.slice(0, 6000)}

Produce markdown with these sections:
## Why this company
## Why this role
## Relevant experience (bullet points with proof points)
## Key skills alignment
Keep each section tight (under 120 words).`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
};
