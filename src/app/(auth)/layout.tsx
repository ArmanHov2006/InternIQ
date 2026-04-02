import type { Metadata } from "next";

/** Avoid static prerender during `next build` when Supabase env vars are absent (CI, preview). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
