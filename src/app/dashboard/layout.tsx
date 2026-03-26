import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PageTransition } from "@/components/motion/page-transition";
import { CommandPalette } from "@/components/command-palette";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile for sidebar display
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, username")
    .eq("id", user.id)
    .single();

  return (
    <>
      <DashboardShell
        user={{
          email: user.email || "",
          fullName: profile?.full_name || "",
          avatarUrl: profile?.avatar_url || "",
        }}
      >
        <PageTransition>{children}</PageTransition>
      </DashboardShell>
      <CommandPalette />
    </>
  );
}
