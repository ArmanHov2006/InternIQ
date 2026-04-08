import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

export default function InsightsLoading() {
  return (
    <div className="space-y-8">
      <SkeletonShimmer className="h-14 w-48" />
      <div className="grid gap-4 lg:grid-cols-4">
        <SkeletonShimmer className="h-28" />
        <SkeletonShimmer className="h-28" />
        <SkeletonShimmer className="h-28" />
        <SkeletonShimmer className="h-28" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonShimmer className="h-64" />
        <SkeletonShimmer className="h-64" />
      </div>
      <SkeletonShimmer className="h-48 w-full" />
    </div>
  );
}
