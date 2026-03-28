"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { MagneticButton } from "@/components/ui/magnetic-button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="glass-strong rounded-2xl border border-white/10 p-8">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-300" />
        <h2 className="font-display text-2xl">Dashboard error</h2>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        This dashboard section hit an unexpected error. You can retry without losing your session.
      </p>
      <MagneticButton className="mt-5" onClick={reset}>
        Try again
      </MagneticButton>
    </div>
  );
}
