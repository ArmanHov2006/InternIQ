export const isGmailAutomationEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_GMAIL_AUTOMATION_ENABLED === "true" ||
  process.env.GMAIL_AUTOMATION_ENABLED === "true";

export const isJobDiscoveryEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_JOB_DISCOVERY_ENABLED === "true" ||
  process.env.JOB_DISCOVERY_ENABLED === "true";
