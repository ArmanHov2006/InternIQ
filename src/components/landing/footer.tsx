import Link from "next/link";
import { ArrowNudgeIcon, BrandMarkIcon, IconFrame } from "@/components/ui/icons/premium-icons";

export const Footer = () => {
  return (
    <footer className="border-t border-white/10 px-4 py-12">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
        <div>
          <p className="inline-flex items-center gap-2 font-display text-xl">
            <IconFrame className="h-7 w-7 rounded-md">
              <BrandMarkIcon />
            </IconFrame>
            InternIQ
          </p>
          <p className="mt-2 text-sm text-muted-foreground">The premium career workspace.</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Product</p>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/dashboard/tracker" className="hover:text-foreground">
                Tracker
              </Link>
            </li>
            <li>
              <Link href="/dashboard/profile" className="hover:text-foreground">
                Portfolio
              </Link>
            </li>
            <li>
              <Link href="/dashboard/analyze" className="hover:text-foreground">
                AI Tools
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Resources</p>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li>Guides</li>
            <li>Docs</li>
            <li>Blog</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Legal</p>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li>Privacy</li>
            <li>Terms</li>
            <li>Security</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-7xl items-center justify-between border-t border-white/10 pt-6 text-sm text-muted-foreground">
        <p>© 2026 InternIQ</p>
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-foreground">
          Open app
          <ArrowNudgeIcon />
        </Link>
      </div>
    </footer>
  );
};
