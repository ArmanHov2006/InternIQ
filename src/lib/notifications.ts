import type { Application } from "@/types/database";

export interface AppNotification {
  id: string;
  type: "milestone" | "reminder" | "status_change" | "tip";
  title: string;
  description: string;
  read: boolean;
  createdAt: Date;
  href?: string;
}

export function generateNotifications(applications: Application[]): AppNotification[] {
  const notifications: AppNotification[] = [];
  const now = new Date();

  const applied = applications.filter((app) => app.status !== "saved");
  if (applied.length >= 10) {
    notifications.push({
      id: "milestone-10",
      type: "milestone",
      title: "10 Applications Sent!",
      description: "You've applied to 10 companies. Keep the momentum going!",
      read: false,
      createdAt: now,
      href: "/dashboard/tracker",
    });
  }

  const latestApp = [...applications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
  if (latestApp) {
    const daysSince = Math.floor((Date.now() - new Date(latestApp.created_at).getTime()) / 86_400_000);
    if (daysSince >= 3) {
      notifications.push({
        id: "tip-inactive",
        type: "tip",
        title: "Keep Your Streak Alive",
        description: `It's been ${daysSince} days since your last application. Consistency is key!`,
        read: false,
        createdAt: now,
        href: "/dashboard/tracker",
      });
    }
  }

  const offerApps = applications
    .filter((app) => app.status === "offer")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 2);
  for (const offer of offerApps) {
    notifications.push({
      id: `offer-${offer.id}`,
      type: "status_change",
      title: "Offer Received",
      description: `${offer.company} — ${offer.role}`,
      read: false,
      createdAt: new Date(offer.updated_at),
      href: "/dashboard/tracker",
    });
  }

  return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
