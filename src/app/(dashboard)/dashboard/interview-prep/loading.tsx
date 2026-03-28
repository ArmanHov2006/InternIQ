import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

export default function InterviewPrepLoading() {
  return (
    <div className="space-y-6">
      <SkeletonShimmer className="h-12 w-72" />
      <SkeletonShimmer className="h-64 w-full" />
      <SkeletonShimmer className="h-40 w-full" />
    </div>
  );
}
