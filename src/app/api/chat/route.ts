import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkAiRateLimit } from "@/lib/rate-limit";

type ChatRequestBody = {
  messages?: { role: string; content: string }[];
  context?: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Tool definitions (mirrors backend/services/claude_client.py)
// ---------------------------------------------------------------------------

const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: "navigate_to_page",
    description:
      "Navigate the user to a specific page in the InternIQ dashboard",
    input_schema: {
      type: "object" as const,
      properties: {
        page: {
          type: "string",
          enum: [
            "overview",
            "tracker",
            "profile",
            "analyze",
            "email",
            "automation",
            "interview-prep",
            "cover-letter",
            "resume-tailor",
          ],
          description: "The dashboard page to navigate to",
        },
      },
      required: ["page"],
    },
  },
  {
    name: "add_application",
    description:
      "Add a new internship/job application to the user's tracker board. Use this whenever the user mentions applying somewhere, getting an interview, receiving an offer, being rejected, or wanting to track/save a job. Extract company, role, status, location, and any pay/salary info from their message.",
    input_schema: {
      type: "object" as const,
      properties: {
        company: { type: "string", description: "Company name" },
        role: {
          type: "string",
          description:
            "Job/internship title. If not specified, use 'General Application'",
        },
        status: {
          type: "string",
          enum: ["saved", "applied", "interview", "offer", "rejected"],
          description:
            "Application status. Infer from context: 'applied to' = applied, 'got an interview' = interview, 'got an offer' = offer, 'got rejected' = rejected, 'interested in'/'saving' = saved",
        },
        location: {
          type: "string",
          description: "Job location if mentioned",
        },
        job_url: {
          type: "string",
          description: "URL of the job posting if mentioned",
        },
        notes: {
          type: "string",
          description:
            "Any additional details like pay rate, salary, team, deadline, referral info, etc.",
        },
      },
      required: ["company", "role"],
    },
  },
  {
    name: "update_application",
    description:
      "Update an existing application's status or details. Use when user says things like 'move Google to interview', 'I got rejected from Meta', 'update my Stripe notes'. Match by company name from the context.",
    input_schema: {
      type: "object" as const,
      properties: {
        company: {
          type: "string",
          description:
            "Company name to match against existing applications",
        },
        status: {
          type: "string",
          enum: ["saved", "applied", "interview", "offer", "rejected"],
          description: "New status to set",
        },
        notes: { type: "string", description: "Notes to append" },
      },
      required: ["company"],
    },
  },
  {
    name: "open_add_dialog",
    description:
      "Open the Quick Add Application dialog for the user to fill in details manually. Use when the user wants to add an application but hasn't given enough details.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "set_tracker_filter",
    description:
      "Set a search query or status filter on the application tracker and navigate there. Use when user wants to find specific applications or see apps in a certain stage.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Search query for company or role",
        },
        status_filter: {
          type: "string",
          enum: ["saved", "applied", "interview", "offer", "rejected"],
          description: "Filter by application status",
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// System prompt (enhanced, matches backend/services/prompts.py)
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are the InternIQ AI assistant, embedded inside a premium internship application tracking platform for students.

CAPABILITIES (via tools):
- Navigate to any dashboard page
- Add new applications to the tracker (extract ALL details from natural language)
- Update existing application statuses
- Open the Quick Add dialog
- Filter/search applications on the tracker

CRITICAL RULES FOR APPLICATION MANAGEMENT:
1. When a user mentions ANY interaction with a company (applied, interviewing, got offer, rejected, saving, interested), ALWAYS use the add_application or update_application tool.
2. Extract EVERY detail: company name, role/position, status, location, pay/salary, and any notes.
3. Infer the correct status from natural language:
   - "applied to", "submitted to", "sent my resume to" -> status: "applied"
   - "got an interview", "interviewing at", "have an interview with", "phone screen with", "heard back from" -> status: "interview"
   - "got an offer from", "received offer", "they offered me" -> status: "offer"
   - "got rejected", "didn't get", "turned down by" -> status: "rejected"
   - "interested in", "looking at", "bookmarked", "want to apply" -> status: "saved"
4. If the user mentions pay/salary ("$25/hr", "$80k", "25 dollars an hour"), put it in notes.
5. If role isn't explicitly stated, use "General Application" -- don't ask unless it feels natural.
6. Check the CURRENT USER CONTEXT to see if the company already exists before adding a duplicate. If it exists, use update_application instead.

GENERAL RULES:
- ALWAYS use a tool when you can -- don't just describe what you would do.
- Be concise and warm -- students are busy and job hunting is stressful.
- For AI features (resume analysis, email generation, etc.), navigate the user to the relevant page.
- Use an encouraging, supportive tone.
- If asked about data not in context, say so honestly.
- When adding/updating applications, confirm what you did with the details.`;

// ---------------------------------------------------------------------------
// Tier 2: Claude via Anthropic TypeScript SDK (runs in Next.js)
// ---------------------------------------------------------------------------

async function callClaudeDirect(
  messages: { role: string; content: string }[],
  context: Record<string, unknown>
): Promise<{ reply: string; actions: { type: string; payload: Record<string, unknown> }[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("NO_API_KEY");

  const anthropic = new Anthropic({ apiKey });
  const systemWithContext =
    SYSTEM_PROMPT +
    (Object.keys(context).length
      ? `\n\nCURRENT USER CONTEXT:\n${JSON.stringify(context, null, 2)}`
      : "");

  const apiMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 800,
    system: systemWithContext,
    messages: apiMessages,
    tools: CHAT_TOOLS,
  });

  const replyParts: string[] = [];
  const actions: { type: string; payload: Record<string, unknown> }[] = [];
  const toolUseBlocks: Anthropic.ContentBlock[] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      replyParts.push(block.text);
    } else if (block.type === "tool_use") {
      actions.push({
        type: block.name,
        payload: (block.input ?? {}) as Record<string, unknown>,
      });
      toolUseBlocks.push(block);
    }
  }

  if (response.stop_reason === "tool_use" && toolUseBlocks.length > 0) {
    const assistantContent: Anthropic.ContentBlockParam[] = response.content.map(
      (block) => {
        if (block.type === "text") {
          return { type: "text" as const, text: block.text };
        }
        if (block.type === "tool_use") {
          return {
            type: "tool_use" as const,
            id: block.id,
            name: block.name,
            input: block.input,
          };
        }
        return { type: "text" as const, text: "" };
      }
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(
      (b) => ({
        type: "tool_result" as const,
        tool_use_id: (b as Anthropic.ToolUseBlock).id,
        content: `Action '${(b as Anthropic.ToolUseBlock).name}' queued for client execution.`,
      })
    );

    const followUp = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: systemWithContext,
      messages: [
        ...apiMessages,
        { role: "assistant" as const, content: assistantContent },
        { role: "user" as const, content: toolResults },
      ],
      tools: CHAT_TOOLS,
    });

    const followUpParts = followUp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text);

    if (followUpParts.length > 0) {
      return { reply: followUpParts.join("\n").trim() || "Done!", actions };
    }
  }

  return { reply: replyParts.join("\n").trim() || "Done!", actions };
}

// ---------------------------------------------------------------------------
// Tier 3: Local regex fallback (no AI backend, no API key)
// ---------------------------------------------------------------------------

const PAGE_KEYWORDS: Record<string, { page: string; label: string }> = {
  tracker: { page: "tracker", label: "Tracker" },
  kanban: { page: "tracker", label: "Tracker" },
  board: { page: "tracker", label: "Tracker" },
  overview: { page: "overview", label: "Overview" },
  dashboard: { page: "overview", label: "Overview" },
  profile: { page: "profile", label: "Profile" },
  analyze: { page: "analyze", label: "AI Analyzer" },
  analyzer: { page: "analyze", label: "AI Analyzer" },
  resume: { page: "resume-tailor", label: "Resume Tailor" },
  email: { page: "email", label: "Cold Email" },
  interview: { page: "interview-prep", label: "Interview Prep" },
  cover: { page: "cover-letter", label: "Cover Letter" },
  automation: { page: "automation", label: "Automation" },
};

const STATUS_PATTERNS: { pattern: RegExp; status: string }[] = [
  { pattern: /\b(got|received|have)\s+(an?\s+)?offer\b/, status: "offer" },
  { pattern: /\boffer(ed)?\b/, status: "offer" },
  { pattern: /\b(applied|submitted|sent)\b/, status: "applied" },
  { pattern: /\binterview(ing)?\b/, status: "interview" },
  { pattern: /\bphone\s*screen\b/, status: "interview" },
  { pattern: /\bheard\s+back\b/, status: "interview" },
  { pattern: /\brejected\b/, status: "rejected" },
  { pattern: /\bdidn'?t\s+get\b/, status: "rejected" },
  { pattern: /\bturned\s+down\b/, status: "rejected" },
  { pattern: /\bsav(ed?|ing)\b/, status: "saved" },
  { pattern: /\binterested\s+in\b/, status: "saved" },
  { pattern: /\bbookmarked?\b/, status: "saved" },
];

function detectStatus(msg: string): string {
  for (const { pattern, status } of STATUS_PATTERNS) {
    if (pattern.test(msg)) return status;
  }
  return "saved";
}

function extractPay(msg: string): string | null {
  const m =
    msg.match(
      /\$[\d,.]+\s*(?:\/\s*h(?:ou)?r|per\s+hour|an\s+hour|hr)/i
    ) ||
    msg.match(
      /\$[\d,.]+\s*(?:k|\/\s*y(?:ea)?r|per\s+year|a\s+year|annually)/i
    ) ||
    msg.match(/(\d+)\s+dollars?\s+(an?\s+hour|per\s+hour|\/?\s*hr)/i) ||
    msg.match(/\$[\d,.]+/);
  if (!m) return null;
  if (m[1] && !m[0].startsWith("$")) return `$${m[1]}/${m[2]?.includes("hour") || m[2]?.includes("hr") ? "hr" : "yr"}`;
  return m[0];
}

function extractApplicationDetails(msg: string) {
  const original = msg;
  let company = "";
  let role = "";
  let location = "";
  const pay = extractPay(original);

  const toForMatch = original.match(
    /(?:applied|applying|submitted|app|add|got\s+(?:an?\s+)?(?:offer|interview)|interviewing?|rejected|heard\s+back|saving|interested\s+in)\s+(?:to|at|from|with|for|by)\s+(.+?)(?:\s+(?:for|as)\s+(.+?))?(?:\s+(?:at|in)\s+(.+?))?$/i
  );

  if (toForMatch) {
    company = toForMatch[1] || "";
    role = toForMatch[2] || "";
    location = toForMatch[3] || "";
  } else {
    const simpleMatch = original.match(
      /(?:applied|applying|submitted|add|track|got\s+(?:an?\s+)?(?:offer|interview)|interviewing?|rejected|heard\s+back|saving)\s+(?:to|at|from|with|for|by)\s+(.+)/i
    );
    if (simpleMatch) company = simpleMatch[1] || "";
  }

  const cleanField = (s: string) =>
    s
      .replace(
        /\$[\d,.]+\s*(?:\/?\s*(?:h(?:ou)?r|per\s+hour|an\s+hour|k|\/?\s*y(?:ea)?r|per\s+year|a\s+year|annually))?/gi,
        ""
      )
      .replace(/\d+\s+dollars?\s+(?:an?\s+hour|per\s+hour|\/?\s*hr)/gi, "")
      .replace(/\b(for|as|at|in|per|an|a)\s*$/i, "")
      .replace(/[,.\s]+$/, "")
      .trim();

  company = cleanField(company);
  role = cleanField(role);
  location = cleanField(location);

  const titleCase = (s: string) =>
    s.replace(/\b\w/g, (c) => c.toUpperCase());

  company = titleCase(company);
  role = titleCase(role);
  location = titleCase(location);

  return { company, role, location, pay };
}

function extractAddWithStatus(msg: string): {
  company: string;
  role: string;
  status: string;
  location: string;
  notes: string;
} | null {
  const m = msg.match(
    /\badd\b.*?\b(?:application|app)?\s*(?:towards?|to|for|in|at|under)\s+(\w+)\s*(?:stage|status|column)?\s*(?:for|at|from|with)?\s*(.*)?$/i
  );
  if (!m) return null;

  const rawStatus = m[1]?.toLowerCase() || "";
  const rest = (m[2] || "").trim();

  const statusMap: Record<string, string> = {
    saved: "saved",
    applied: "applied",
    interview: "interview",
    interviewing: "interview",
    offer: "offer",
    rejected: "rejected",
  };
  const status = statusMap[rawStatus];
  if (!status) return null;

  let company = "";
  let role = "";
  let location = "";
  if (rest) {
    const parts = rest.match(/^(.+?)(?:\s+(?:for|as)\s+(.+?))?(?:\s+(?:at|in)\s+(.+?))?$/i);
    if (parts) {
      company = parts[1]?.trim() || "";
      role = parts[2]?.trim() || "";
      location = parts[3]?.trim() || "";
    } else {
      company = rest;
    }
  }

  const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  company = titleCase(company);
  role = titleCase(role);
  location = titleCase(location);

  return { company, role: role || "General Application", status, location, notes: "" };
}

function handleLocalChat(msg: string, context: Record<string, unknown>) {
  const appTriggers =
    /\b(applied|applying|submitted|add|track|got\s+(?:an?\s+)?(?:offer|interview)|interviewing?|rejected|heard\s+back|saving|interested\s+in)\s+(?:to|at|from|with|for|by)\s+/i;

  if (appTriggers.test(msg)) {
    const { company, role, location, pay } = extractApplicationDetails(msg);
    const status = detectStatus(msg);

    if (company) {
      const notes = pay ? `Pay: ${pay}` : "";
      const details = [
        `Company: **${company}**`,
        role ? `Role: **${role}**` : null,
        `Status: **${status}**`,
        location ? `Location: ${location}` : null,
        pay ? `Pay: ${pay}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      return {
        reply: `Added your application!\n\n${details}`,
        actions: [
          {
            type: "add_application",
            payload: {
              company,
              role: role || "General Application",
              status,
              location,
              notes,
            },
          },
        ],
      };
    }
  }

  const statusAdd = extractAddWithStatus(msg);
  if (statusAdd) {
    if (statusAdd.company) {
      const details = [
        `Company: **${statusAdd.company}**`,
        `Role: **${statusAdd.role}**`,
        `Status: **${statusAdd.status}**`,
        statusAdd.location ? `Location: ${statusAdd.location}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      return {
        reply: `Added your application!\n\n${details}`,
        actions: [
          { type: "add_application", payload: statusAdd },
        ],
      };
    }
    return {
      reply: "Opening the Add Application dialog — set the status to **" +
        statusAdd.status.charAt(0).toUpperCase() + statusAdd.status.slice(1) +
        "** when you fill it in!",
      actions: [{ type: "open_add_dialog", payload: {} }],
    };
  }

  for (const [keyword, target] of Object.entries(PAGE_KEYWORDS)) {
    if (
      msg.includes(keyword) &&
      (msg.includes("go to") ||
        msg.includes("open") ||
        msg.includes("show") ||
        msg.includes("take me") ||
        msg.includes("navigate") ||
        msg.includes("switch"))
    ) {
      return {
        reply: `Taking you to ${target.label}!`,
        actions: [
          { type: "navigate_to_page", payload: { page: target.page } },
        ],
      };
    }
  }

  if (
    msg.includes("add") &&
    (msg.includes("application") ||
      msg.includes("app") ||
      msg.includes("job"))
  ) {
    return {
      reply: "Opening the Add Application dialog for you!",
      actions: [{ type: "open_add_dialog", payload: {} }],
    };
  }

  if (
    msg.includes("stats") ||
    msg.includes("how many") ||
    msg.includes("breakdown") ||
    msg.includes("summary") ||
    msg.includes("response rate")
  ) {
    const total = (context.total_applications as number) ?? 0;
    const byStatus = (context.by_status as Record<string, number>) ?? {};
    const parts = Object.entries(byStatus)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    return {
      reply:
        total > 0
          ? `You have ${total} application${total !== 1 ? "s" : ""}. Breakdown: ${parts || "none tracked yet"}.`
          : "You don't have any applications tracked yet. Want to add one?",
      actions: [],
    };
  }

  if (
    msg.includes("analyze") ||
    msg.includes("fit score") ||
    msg.includes("fit check")
  ) {
    return {
      reply:
        "Let me take you to the Resume Analyzer where you can upload your resume and paste a job description.",
      actions: [
        { type: "navigate_to_page", payload: { page: "analyze" } },
      ],
    };
  }

  return {
    reply:
      'I can help you navigate the app, add applications, check your stats, analyze resumes, generate emails, and more.\n\nTry something like:\n\u2022 "I applied to Google for SWE intern"\n\u2022 "Show my stats"\n\u2022 "Go to tracker"',
    actions: [],
  };
}

// ---------------------------------------------------------------------------
// Route handler: Tier 1 (FastAPI) -> Tier 2 (Claude SDK) -> Tier 3 (regex)
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required." },
        { status: 400 }
      );
    }

    let accessToken: string | null = null;
    let userId: string | null = null;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      accessToken = session?.access_token ?? null;
    } catch {
      // Auth unavailable
    }

    const rateLimited = checkAiRateLimit(request, userId);
    if (rateLimited) return rateLimited;

    const fastApiUrl =
      process.env.NEXT_PUBLIC_FASTAPI_URL || process.env.FASTAPI_URL;

    // --- Tier 1: FastAPI backend ---
    if (fastApiUrl && accessToken) {
      try {
        const response = await fetch(`${fastApiUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            messages: body.messages,
            context: body.context ?? {},
          }),
        });

        const payload = await response.json();
        if (response.ok) {
          return NextResponse.json(payload);
        }
      } catch {
        // Backend unreachable — fall through
      }
    }

    // --- Tier 2: Claude directly via Anthropic SDK ---
    try {
      const result = await callClaudeDirect(
        body.messages,
        (body.context ?? {}) as Record<string, unknown>
      );
      return NextResponse.json(result);
    } catch (err) {
      const isNoKey =
        err instanceof Error && err.message === "NO_API_KEY";
      if (!isNoKey) {
        console.error("Claude SDK chat error:", err);
      }
      // Fall through to regex
    }

    // --- Tier 3: Local regex fallback ---
    const lastMsg =
      body.messages[body.messages.length - 1]?.content?.toLowerCase() ?? "";
    const context = (body.context ?? {}) as Record<string, unknown>;
    return NextResponse.json(handleLocalChat(lastMsg, context));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
