import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

export default function EmailLoading() {
  return (
    <div className="space-y-6">
      <SkeletonShimmer className="h-12 w-72" />
      <SkeletonShimmer className="h-80 w-full rounded-2xl" />
      <SkeletonShimmer className="h-64 w-full rounded-2xl" />
    </div>
  );
}
