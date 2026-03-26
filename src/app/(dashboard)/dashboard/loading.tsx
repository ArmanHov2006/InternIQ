import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";
import { StatCardSkeleton } from "@/components/dashboard/stat-card-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <SkeletonShimmer className="h-14 w-64" />
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <SkeletonShimmer className="h-12 w-full" />
      <SkeletonShimmer className="h-48 w-full" />
    </div>
  );
}
