"use client";

type Variant = "tracker" | "profile" | "ai";

type Props = {
  variant: Variant;
};

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xl">
      <div className="flex h-10 items-center gap-2 border-b border-border bg-muted/50 px-4">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <div className="ml-4 flex h-6 flex-1 items-center rounded-md border border-border bg-background px-3 text-xs text-muted-foreground">
          app.interniq.com
        </div>
      </div>
      <div className="bg-background p-3">{children}</div>
    </div>
  );
}

function TrackerMockup() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: "Saved", tone: "bg-blue-500/10 border-blue-500/20" },
        { label: "Applied", tone: "bg-indigo-500/10 border-indigo-500/20" },
        { label: "Interview", tone: "bg-purple-500/10 border-purple-500/20" },
        { label: "Offer", tone: "bg-green-500/10 border-green-500/20" },
      ].map((col, idx) => (
        <div key={col.label} className={`rounded-lg border p-2 ${col.tone}`}>
          <p className="mb-2 text-[10px] font-semibold text-foreground/80">{col.label}</p>
          <div className="space-y-1.5">
            {Array.from({ length: idx === 3 ? 2 : 3 }).map((_, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-1.5">
                <div className="mb-1 h-2 w-4/5 rounded bg-foreground/20" />
                <div className="h-1.5 w-2/3 rounded bg-foreground/10" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileMockup() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
        <div className="flex-1">
          <div className="mb-1 h-3 w-40 rounded bg-foreground/20" />
          <div className="h-2 w-56 rounded bg-foreground/10" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {["React", "TypeScript", "SQL", "Figma"].map((skill) => (
          <span key={skill} className="rounded-full bg-blue-500/15 px-2 py-1 text-[10px] font-medium text-blue-600 dark:text-blue-300">
            {skill}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="rounded-lg border border-border bg-muted/40 p-2">
            <div className="mb-1 h-2.5 w-1/2 rounded bg-foreground/20" />
            <div className="h-2 w-3/4 rounded bg-foreground/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AIMockup() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="mb-2 h-3 w-28 rounded bg-foreground/20" />
        <div className="space-y-1.5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-2 rounded bg-foreground/10" />
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 border-green-500/70 text-sm font-bold text-green-600 dark:text-green-300">
          87%
        </div>
        <div className="space-y-1.5">
          <div className="h-2 rounded bg-green-500/50" />
          <div className="h-2 rounded bg-yellow-500/50" />
          <div className="h-2 rounded bg-red-500/40" />
        </div>
      </div>
    </div>
  );
}

export function FeatureMockup({ variant }: Props) {
  return (
    <BrowserFrame>
      {variant === "tracker" ? <TrackerMockup /> : null}
      {variant === "profile" ? <ProfileMockup /> : null}
      {variant === "ai" ? <AIMockup /> : null}
    </BrowserFrame>
  );
}
