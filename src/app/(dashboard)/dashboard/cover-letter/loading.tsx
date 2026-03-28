import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

export default function CoverLetterLoading() {
  return (
    <div className="space-y-6">
      <SkeletonShimmer className="h-12 w-72" />
      <SkeletonShimmer className="h-64 w-full" />
      <SkeletonShimmer className="h-72 w-full" />
    </div>
  );
}
