import { cn } from "@/lib/utils";

interface SkeletonShimmerProps {
  className?: string;
}

export const SkeletonShimmer = ({ className }: SkeletonShimmerProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted border border-border",
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
    </div>
  );
};
