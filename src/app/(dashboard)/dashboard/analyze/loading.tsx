import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

export default function AnalyzeLoading() {
  return (
    <div className="space-y-6">
      <SkeletonShimmer className="h-12 w-72" />
      <SkeletonShimmer className="h-72 w-full rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonShimmer className="h-56 w-full rounded-2xl" />
        <SkeletonShimmer className="h-56 w-full rounded-2xl" />
      </div>
    </div>
  );
}
