import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

export const StatCardSkeleton = () => {
  return (
    <div className="glass rounded-2xl p-5">
      <SkeletonShimmer className="h-4 w-28" />
      <SkeletonShimmer className="mt-3 h-8 w-20" />
      <SkeletonShimmer className="mt-4 h-14 w-full" />
    </div>
  );
};
