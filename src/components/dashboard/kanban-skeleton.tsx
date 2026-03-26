import { Skeleton } from "@/components/ui/skeleton";

export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {Array.from({ length: 6 }).map((_, columnIdx) => (
        <div
          key={columnIdx}
          className="w-full min-w-[280px] max-w-[320px] rounded-xl border bg-muted/20 p-3"
          style={{ animationDelay: `${columnIdx * 60}ms` }}
        >
          <Skeleton className="mb-4 h-6 w-20" />
          <div className="space-y-2">
            {Array.from({ length: columnIdx % 2 === 0 ? 3 : 2 }).map((_, cardIdx) => (
              <Skeleton
                key={cardIdx}
                className="w-full rounded-lg"
                style={{
                  height: cardIdx % 2 === 0 ? "96px" : "84px",
                  animationDelay: `${columnIdx * 60 + cardIdx * 80}ms`,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
