import { cn } from "@/lib/utils";

interface SkeletonShimmerProps {
  className?: string;
}

export const SkeletonShimmer = ({ className }: SkeletonShimmerProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-white/[0.04] border border-white/[0.08]",
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
};
