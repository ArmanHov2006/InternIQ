import type { EmailTemplateId } from "@/types/local-features";

export type EmailTemplateInput = {
  recipientName: string;
  company: string;
  role: string;
  sellingPoints: string;
};

export type EmailTemplateDefinition = {
  id: EmailTemplateId;
  label: string;
  description: string;
  buildSubject: (input: EmailTemplateInput) => string;
  buildBody: (input: EmailTemplateInput) => string;
};

const safeName = (name: string): string => name.trim() || "there";
const safeCompany = (company: string): string => company.trim() || "your team";
const safeRole = (role: string): string => role.trim() || "this role";
const safeSellingPoints = (sellingPoints: string): string =>
  sellingPoints.trim() || "hands-on project experience, strong communication, and fast execution";

export const EMAIL_TEMPLATES: EmailTemplateDefinition[] = [
  {
    id: "networking_intro",
    label: "Networking Intro",
    description: "Warm intro to connect and learn from someone at the company.",
    buildSubject: ({ company }) => `Quick hello from an aspiring intern (${safeCompany(company)})`,
    buildBody: ({ recipientName, company, role, sellingPoints }) => `Hi ${safeName(recipientName)},

I hope your week is going well. I am exploring internship opportunities and wanted to introduce myself because I admire the work happening at ${safeCompany(company)}.

I am especially interested in ${safeRole(role)} and would value your perspective on what skills matter most for interns on your team.

A few strengths I would bring:
${safeSellingPoints(sellingPoints)}

If you are open to it, I would be grateful for a short 10-15 minute chat.

Thanks for your time,
[Your Name]`,
  },
  {
    id: "application_followup",
    label: "Application Follow-up",
    description: "Follow up after submitting an internship application.",
    buildSubject: ({ role }) => `Following up on my ${safeRole(role)} application`,
    buildBody: ({ recipientName, company, role, sellingPoints }) => `Hi ${safeName(recipientName)},

I recently applied for the ${safeRole(role)} position at ${safeCompany(company)} and wanted to follow up.

I am excited about this opportunity and believe my background aligns well, especially in:
${safeSellingPoints(sellingPoints)}

If helpful, I can share additional project details or walk through how I would contribute quickly in this role.

Thank you for your consideration,
[Your Name]`,
  },
  {
    id: "referral_request",
    label: "Referral Request",
    description: "Ask for a referral in a respectful, low-pressure way.",
    buildSubject: ({ role, company }) => `Referral request for ${safeRole(role)} at ${safeCompany(company)}`,
    buildBody: ({ recipientName, company, role, sellingPoints }) => `Hi ${safeName(recipientName)},

I hope you are doing well. I am applying to the ${safeRole(role)} role at ${safeCompany(company)} and wanted to ask if you would feel comfortable referring me.

I understand referrals are a big ask, so no pressure at all. For context, my strongest fit points are:
${safeSellingPoints(sellingPoints)}

I can send my resume and any additional context if useful.

Thanks either way for your time,
[Your Name]`,
  },
  {
    id: "informational_interview",
    label: "Informational Interview",
    description: "Request a short conversation to learn about team and role expectations.",
    buildSubject: ({ company }) => `Would you be open to a quick chat about ${safeCompany(company)}?`,
    buildBody: ({ recipientName, company, role, sellingPoints }) => `Hi ${safeName(recipientName)},

I am currently preparing for internship recruiting and would love to learn more about your experience at ${safeCompany(company)}.

I am targeting opportunities like ${safeRole(role)} and have been building relevant experience through:
${safeSellingPoints(sellingPoints)}

If you are open to it, I would appreciate 15 minutes for an informational conversation.

Thanks so much,
[Your Name]`,
  },
];

export function buildEmailFromTemplate(templateId: EmailTemplateId, input: EmailTemplateInput) {
  const template = EMAIL_TEMPLATES.find((item) => item.id === templateId) ?? EMAIL_TEMPLATES[0];
  return {
    subject: template.buildSubject(input).trim(),
    body: template.buildBody(input).trim(),
  };
}
