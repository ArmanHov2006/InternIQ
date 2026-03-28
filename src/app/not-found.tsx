import Link from "next/link";
import { Telescope } from "lucide-react";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { GlassCard } from "@/components/ui/glass-card";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[15%] top-[20%] h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute right-[10%] top-[40%] h-72 w-72 rounded-full bg-accent/20 blur-[100px]" />
      </div>
      <GlassCard className="max-w-lg p-8 text-center" tiltEnabled={false}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <Telescope className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-display text-5xl">404</h1>
        <p className="mt-2 text-muted-foreground">This page drifted out of orbit.</p>
        <div className="mt-6 flex justify-center">
          <MagneticButton asChild>
            <Link href="/">Go Home</Link>
          </MagneticButton>
        </div>
      </GlassCard>
    </div>
  );
}
