import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function buildSettingsIntegrationsUrl(sp: SearchParams): string {
  const q = new URLSearchParams();
  q.set("section", "integrations");
  for (const key of ["error", "connected"] as const) {
    const v = sp[key];
    if (typeof v === "string" && v) q.set(key, v);
  }
  return `/dashboard/settings?${q.toString()}`;
}

export default function AutomationRedirectPage({ searchParams }: { searchParams: SearchParams }) {
  redirect(buildSettingsIntegrationsUrl(searchParams));
}
