import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      <SkeletonShimmer className="h-14 w-48" />
      <div className="space-y-6">
        <SkeletonShimmer className="h-64 w-full" />
        <SkeletonShimmer className="h-48 w-full" />
        <SkeletonShimmer className="h-48 w-full" />
      </div>
    </div>
  );
}
