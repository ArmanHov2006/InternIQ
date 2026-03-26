import {
  BarChart3,
  Brain,
  Kanban,
  LayoutDashboard,
  Mail,
  Search,
  User,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  section: "core" | "ai";
  shortcut: string;
  mobileLabel: string;
  showInMobile: boolean;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    section: "core",
    shortcut: "D",
    mobileLabel: "Home",
    showInMobile: true,
  },
  {
    href: "/dashboard/tracker",
    label: "Tracker",
    icon: Kanban,
    section: "core",
    shortcut: "T",
    mobileLabel: "Tracker",
    showInMobile: true,
  },
  {
    href: "/dashboard/insights",
    label: "Insights",
    icon: BarChart3,
    section: "core",
    shortcut: "I",
    mobileLabel: "Insights",
    showInMobile: true,
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: User,
    section: "core",
    shortcut: "P",
    mobileLabel: "Profile",
    showInMobile: true,
  },
  {
    href: "/dashboard/analyze",
    label: "Analyze",
    icon: Search,
    section: "ai",
    shortcut: "A",
    mobileLabel: "Analyze",
    showInMobile: true,
  },
  {
    href: "/dashboard/email",
    label: "Email Generator",
    icon: Mail,
    section: "ai",
    shortcut: "E",
    mobileLabel: "Email",
    showInMobile: false,
  },
];

export const DASHBOARD_SHORTCUT_ROUTES = DASHBOARD_NAV_ITEMS.reduce<
  Record<string, string>
>((acc, item) => {
  acc[item.shortcut.toLowerCase()] = item.href;
  return acc;
}, {});

export const DASHBOARD_PALETTE_NAV = DASHBOARD_NAV_ITEMS.map((item) => ({
  href: item.href,
  label: item.label,
  icon: item.href === "/dashboard/analyze" ? Brain : item.icon,
}));
