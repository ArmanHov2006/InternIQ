"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { GlassCard } from "@/components/ui/glass-card";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[12%] top-[18%] h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute right-[12%] bottom-[20%] h-72 w-72 rounded-full bg-accent/20 blur-[100px]" />
      </div>
      <GlassCard className="max-w-lg p-8 text-center" tiltEnabled={false}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <AlertTriangle className="h-5 w-5 text-accent-warm" />
        </div>
        <h1 className="font-display text-4xl">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">A temporary issue happened. You can try again safely.</p>
        <div className="mt-6 flex justify-center gap-3">
          <MagneticButton onClick={reset}>Try Again</MagneticButton>
          <MagneticButton asChild variant="outline">
            <Link href="/">Go Home</Link>
          </MagneticButton>
        </div>
      </GlassCard>
    </div>
  );
}
