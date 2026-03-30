import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const base = [
    "",
    "/login",
    "/signup",
    "/dashboard",
    "/dashboard/pipeline",
    "/dashboard/insights",
    "/dashboard/settings",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }));

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("username, updated_at")
      .not("username", "is", null)
      .limit(500);

    const profilePages =
      data?.flatMap((item) => {
        if (!item.username) return [];
        return [
          {
            url: `${siteUrl}/${item.username}`,
            lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.7,
          },
        ];
      }) ?? [];

    return [...base, ...profilePages];
  } catch {
    return base;
  }
}
