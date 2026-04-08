"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Application } from "@/types/database";

export type StatusId = "saved" | "applied" | "interview" | "offer" | "rejected";

export interface KanbanCardData {
  id: string;
  company: string;
  role: string;
  date: string;
  location: string;
  tags: string[];
  notes?: string;
  fitScore?: number;
  status?: StatusId;
  lastStatusChangeSource?: "manual" | "gmail_auto" | "gmail_confirmed" | "system";
  lastStatusChangeReason?: string;
  lastStatusChangeAt?: string;
  aiCompletedCount?: number;
  hasMaterials?: boolean;
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
  /** Full rows from last API hydrate — not persisted; used for Application Drawer */
  applicationsById: Record<string, Application>;
  isHydrated: boolean;
  search: string;
  filter: string | null;
  restoreBoard: (columns: Record<StatusId, ColumnData>, cards: Record<string, KanbanCardData>) => void;
  hydrateFromApplications: (applications: Application[]) => void;
  addOrUpdateFromApplication: (application: Application) => void;
  setApplicationRecord: (application: Application) => void;
  removeById: (id: string) => void;
  moveCard: (cardId: string, from: StatusId, to: StatusId, newIndex: number) => void;
  reorderCard: (cardId: string, column: StatusId, newIndex: number) => void;
  setSearch: (search: string) => void;
  setFilter: (filter: string | null) => void;
  setCardNotes: (id: string, notes: string) => void;
}

const STATUS_IDS: StatusId[] = ["saved", "applied", "interview", "offer", "rejected"];
const isStatusId = (value: unknown): value is StatusId =>
  typeof value === "string" && STATUS_IDS.includes(value as StatusId);
const toSafeStatus = (value: unknown): StatusId => {
  if (value === "phone_screen" || value === "phone-screen" || value === "phone screen") {
    return "interview";
  }
  return isStatusId(value) ? value : "saved";
};

const getAiCompletedCount = (application: Application): number => {
  let count = 0;
  if (typeof application.fit_score === "number") count += 1;
  if (application.generated_email?.trim()) count += 1;
  const meta = application.ai_metadata;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const typed = meta as Record<string, unknown>;
    if (typed.coverLetter) count += 1;
    if (typed.interviewPrep) count += 1;
    if (typed.resumeTailor) count += 1;
  }
  return count;
};

const getHasMaterials = (application: Application): boolean => {
  if (application.generated_email?.trim()) return true;
  const meta = application.ai_metadata;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const typed = meta as Record<string, unknown>;
    if (typed.coverLetter) return true;
  }
  return false;
};

const columnsSeed: Record<StatusId, ColumnData> = {
  saved: { id: "saved", title: "Saved", color: "#FF7A3D", cardIds: [] },
  applied: { id: "applied", title: "Applied", color: "#FF8A50", cardIds: [] },
  interview: { id: "interview", title: "Interview", color: "#FFB380", cardIds: [] },
  offer: { id: "offer", title: "Offer", color: "#4ADE80", cardIds: [] },
  rejected: { id: "rejected", title: "Rejected", color: "#F87171", cardIds: [] },
};

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set) => ({
      columns: columnsSeed,
      cards: {},
      applicationsById: {},
      isHydrated: false,
      search: "",
      filter: null,
      restoreBoard: (columns, cards) => set({ columns, cards }),
      setApplicationRecord: (application) =>
        set((state) => ({
          applicationsById: { ...state.applicationsById, [application.id]: application },
        })),
      setSearch: (search) => set({ search }),
      setFilter: (filter) => set({ filter }),
      setCardNotes: (id, notes) =>
        set((state) => {
          const existing = state.cards[id];
          if (!existing) return state;
          return {
            cards: {
              ...state.cards,
              [id]: {
                ...existing,
                notes,
              },
            },
          };
        }),
      hydrateFromApplications: (applications) =>
        set(() => {
          const applicationsById: Record<string, Application> = {};
          const cards: Record<string, KanbanCardData> = {};
          const nextColumns: Record<StatusId, ColumnData> = {
            ...columnsSeed,
            saved: { ...columnsSeed.saved, cardIds: [] },
            applied: { ...columnsSeed.applied, cardIds: [] },
            interview: { ...columnsSeed.interview, cardIds: [] },
            offer: { ...columnsSeed.offer, cardIds: [] },
            rejected: { ...columnsSeed.rejected, cardIds: [] },
          };

          for (const app of applications) {
            applicationsById[app.id] = app;
            cards[app.id] = {
              id: app.id,
              company: app.company,
              role: app.role,
              date: app.applied_date || "",
              location: app.location || "Unknown",
              tags: [],
              notes: app.notes || "",
              fitScore: app.fit_score ?? undefined,
              status: toSafeStatus(app.status),
              lastStatusChangeSource: app.last_status_change_source ?? "manual",
              lastStatusChangeReason: app.last_status_change_reason ?? "",
              lastStatusChangeAt: app.last_status_change_at ?? app.updated_at,
              aiCompletedCount: getAiCompletedCount(app),
              hasMaterials: getHasMaterials(app),
            };
            const status = toSafeStatus(app.status);
            nextColumns[status].cardIds.push(app.id);
          }

          return {
            cards,
            columns: nextColumns,
            applicationsById,
            isHydrated: true,
          };
        }),
      addOrUpdateFromApplication: (application) =>
        set((state) => {
          const currentStatus = (Object.keys(state.columns) as StatusId[]).find((status) =>
            state.columns[status].cardIds.includes(application.id)
          );
          const targetStatus = toSafeStatus(application.status);
          const nextColumns = { ...state.columns };

          if (currentStatus && currentStatus !== targetStatus) {
            nextColumns[currentStatus] = {
              ...nextColumns[currentStatus],
              cardIds: nextColumns[currentStatus].cardIds.filter((id) => id !== application.id),
            };
          }
          if (!nextColumns[targetStatus].cardIds.includes(application.id)) {
            nextColumns[targetStatus] = {
              ...nextColumns[targetStatus],
              cardIds: [application.id, ...nextColumns[targetStatus].cardIds],
            };
          }

          return {
            columns: nextColumns,
            applicationsById: {
              ...state.applicationsById,
              [application.id]: application,
            },
            cards: {
              ...state.cards,
              [application.id]: {
                id: application.id,
                company: application.company,
                role: application.role,
                date: application.applied_date || "",
                location: application.location || "Unknown",
                tags: [],
                notes: application.notes || "",
                fitScore: application.fit_score ?? undefined,
                status: targetStatus,
                lastStatusChangeSource: application.last_status_change_source ?? "manual",
                lastStatusChangeReason: application.last_status_change_reason ?? "",
                lastStatusChangeAt: application.last_status_change_at ?? application.updated_at,
                aiCompletedCount: getAiCompletedCount(application),
                hasMaterials: getHasMaterials(application),
              },
            },
          };
        }),
      removeById: (id) =>
        set((state) => {
          const nextCards = { ...state.cards };
          delete nextCards[id];
          const nextApps = { ...state.applicationsById };
          delete nextApps[id];
          const nextColumns = { ...state.columns };
          for (const status of Object.keys(nextColumns) as StatusId[]) {
            nextColumns[status] = {
              ...nextColumns[status],
              cardIds: nextColumns[status].cardIds.filter((cardId) => cardId !== id),
            };
          }
          return { cards: nextCards, columns: nextColumns, applicationsById: nextApps };
        }),
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
    {
      name: "interniq-kanban-v2",
      version: 3,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<KanbanState>;
        const legacyColumns = (state.columns as Record<string, ColumnData> | undefined) ?? {};
        const legacyPhoneScreenIds = Array.isArray(legacyColumns.phone_screen?.cardIds)
          ? legacyColumns.phone_screen.cardIds.filter((id): id is string => typeof id === "string")
          : [];
        const safeColumns: Record<StatusId, ColumnData> = {
          saved: { ...columnsSeed.saved, cardIds: [] },
          applied: { ...columnsSeed.applied, cardIds: [] },
          interview: { ...columnsSeed.interview, cardIds: [] },
          offer: { ...columnsSeed.offer, cardIds: [] },
          rejected: { ...columnsSeed.rejected, cardIds: [] },
        };

        const safeCards = state.cards && typeof state.cards === "object" ? state.cards : {};

        for (const status of STATUS_IDS) {
          const sourceIds = state.columns?.[status]?.cardIds;
          if (!Array.isArray(sourceIds)) continue;
          safeColumns[status].cardIds = sourceIds.filter((id): id is string => typeof id === "string");
        }
        if (legacyPhoneScreenIds.length > 0) {
          safeColumns.interview.cardIds = [
            ...safeColumns.interview.cardIds,
            ...legacyPhoneScreenIds.filter((id) => !safeColumns.interview.cardIds.includes(id)),
          ];
        }

        return {
          ...state,
          columns: safeColumns,
          cards: safeCards,
          applicationsById: {},
        } as KanbanState;
      },
      partialize: (state) => ({
        columns: state.columns,
        cards: state.cards,
      }),
    }
  )
);
