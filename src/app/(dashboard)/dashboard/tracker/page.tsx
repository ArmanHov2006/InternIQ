import { KanbanBoard } from "@/components/kanban/kanban-board";

export default function TrackerPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-5xl">Tracker</h1>
      <KanbanBoard />
    </div>
  );
}
