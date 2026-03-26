import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type ProfileOG = {
  full_name: string;
  headline: string;
  username: string;
};

async function getProfile(username: string): Promise<ProfileOG | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=full_name,headline,username&username=eq.${encodeURIComponent(username)}&limit=1`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as ProfileOG[];
  return data[0] ?? null;
}

export default async function OpenGraphImage({
  params,
}: {
  params: { username: string };
}) {
  const profile = await getProfile(params.username);
  const fullName = profile?.full_name || `@${params.username}`;
  const headline = profile?.headline || "Portfolio powered by InternIQ";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(79,70,229,1) 50%, rgba(124,58,237,1) 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              border: "2px solid rgba(255,255,255,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            IQ
          </div>
          <div style={{ fontSize: 38, fontWeight: 800 }}>InternIQ</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.05 }}>{fullName}</div>
          <div style={{ fontSize: 34, opacity: 0.95 }}>{headline}</div>
        </div>

        <div style={{ fontSize: 28, opacity: 0.9 }}>interniq.com/{params.username}</div>
      </div>
    ),
    size
  );
}
