import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      <SkeletonShimmer className="h-12 w-64" />
      <div className="grid gap-6 xl:grid-cols-2">
        <SkeletonShimmer className="h-[720px] w-full rounded-2xl" />
        <SkeletonShimmer className="h-[720px] w-full rounded-2xl" />
      </div>
    </div>
  );
}
