import { KanbanSkeleton } from "@/components/dashboard/kanban-skeleton";

export default function TrackerLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="h-10 w-48 rounded-xl bg-white/10" />
        <div className="h-10 w-40 rounded-xl bg-white/10" />
      </div>
      <KanbanSkeleton />
    </div>
  );
}
