import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

export const KanbanSkeleton = () => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="glass min-w-[280px] flex-1 rounded-2xl p-3">
          <SkeletonShimmer className="mb-3 h-6 w-28" />
          <div className="space-y-2">
            <SkeletonShimmer className="h-24 w-full" />
            <SkeletonShimmer className="h-24 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};
