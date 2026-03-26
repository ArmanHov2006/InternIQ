import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-xl border bg-card p-5"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <Skeleton className="mb-4 h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton
            key={idx}
            className="h-10 w-32"
            style={{ animationDelay: `${200 + idx * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
