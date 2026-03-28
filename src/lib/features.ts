export const isGmailAutomationEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_GMAIL_AUTOMATION_ENABLED === "true" ||
  process.env.GMAIL_AUTOMATION_ENABLED === "true";
