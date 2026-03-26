"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StatusId = "saved" | "applied" | "phone_screen" | "interview" | "offer" | "rejected";

export interface KanbanCardData {
  id: string;
  company: string;
  role: string;
  date: string;
  location: string;
  tags: string[];
  notes?: string;
  fitScore?: number;
}

interface ColumnData {
  id: StatusId;
  title: string;
  color: string;
  cardIds: string[];
}

interface KanbanState {
  columns: Record<StatusId, ColumnData>;
  cards: Record<string, KanbanCardData>;
  search: string;
  filter: string | null;
  moveCard: (cardId: string, from: StatusId, to: StatusId, newIndex: number) => void;
  reorderCard: (cardId: string, column: StatusId, newIndex: number) => void;
  setSearch: (search: string) => void;
  setFilter: (filter: string | null) => void;
}

const seedCards: KanbanCardData[] = [
  { id: "1", company: "Google", role: "SWE Intern", date: "Mar 18", location: "Remote", tags: ["backend"], fitScore: 91 },
  { id: "2", company: "Meta", role: "PM Intern", date: "Mar 15", location: "Menlo Park", tags: ["product"], fitScore: 78 },
  { id: "3", company: "Apple", role: "Design Intern", date: "Mar 12", location: "Cupertino", tags: ["design"], fitScore: 82 },
  { id: "4", company: "Stripe", role: "Data Intern", date: "Mar 10", location: "SF", tags: ["data"], fitScore: 74 },
  { id: "5", company: "Vercel", role: "Frontend Intern", date: "Mar 8", location: "Remote", tags: ["frontend"], fitScore: 88 },
  { id: "6", company: "Notion", role: "Product Intern", date: "Mar 7", location: "Remote", tags: ["product"], fitScore: 80 },
  { id: "7", company: "Datadog", role: "Infra Intern", date: "Mar 5", location: "NYC", tags: ["infra"], fitScore: 73 },
  { id: "8", company: "HubSpot", role: "Growth Intern", date: "Mar 4", location: "Boston", tags: ["growth"], fitScore: 76 },
];

const cardsById = Object.fromEntries(seedCards.map((card) => [card.id, card])) as Record<string, KanbanCardData>;

const columnsSeed: Record<StatusId, ColumnData> = {
  saved: { id: "saved", title: "Saved", color: "oklch(0.65 0.25 265)", cardIds: ["1", "2"] },
  applied: { id: "applied", title: "Applied", color: "oklch(0.58 0.19 280)", cardIds: ["3", "4"] },
  phone_screen: { id: "phone_screen", title: "Phone Screen", color: "oklch(0.82 0.18 95)", cardIds: ["5"] },
  interview: { id: "interview", title: "Interview", color: "oklch(0.7 0.2 300)", cardIds: ["6", "7"] },
  offer: { id: "offer", title: "Offer", color: "oklch(0.78 0.2 145)", cardIds: ["8"] },
  rejected: { id: "rejected", title: "Rejected", color: "oklch(0.66 0.23 30)", cardIds: [] },
};

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set) => ({
      columns: columnsSeed,
      cards: cardsById,
      search: "",
      filter: null,
      setSearch: (search) => set({ search }),
      setFilter: (filter) => set({ filter }),
      moveCard: (cardId, from, to, newIndex) =>
        set((state) => {
          const source = state.columns[from];
          const destination = state.columns[to];
          const sourceIds = source.cardIds.filter((id) => id !== cardId);
          const destinationIds = [...destination.cardIds];
          destinationIds.splice(newIndex, 0, cardId);
          return {
            columns: {
              ...state.columns,
              [from]: { ...source, cardIds: sourceIds },
              [to]: { ...destination, cardIds: destinationIds },
            },
          };
        }),
      reorderCard: (cardId, column, newIndex) =>
        set((state) => {
          const current = [...state.columns[column].cardIds].filter((id) => id !== cardId);
          current.splice(newIndex, 0, cardId);
          return { columns: { ...state.columns, [column]: { ...state.columns[column], cardIds: current } } };
        }),
    }),
    { name: "interniq-kanban-v2" }
  )
);
