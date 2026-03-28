"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GeneratedEmailRecord } from "@/types/local-features";

type EmailStoreState = {
  history: GeneratedEmailRecord[];
  activeEmailId: string | null;
  saveGeneratedEmail: (email: Omit<GeneratedEmailRecord, "id" | "createdAt" | "updatedAt">) => void;
  updateEmailDraft: (id: string, payload: Pick<GeneratedEmailRecord, "subject" | "body">) => void;
  setActiveEmail: (id: string | null) => void;
  removeEmail: (id: string) => void;
  clearHistory: () => void;
};

const MAX_EMAIL_HISTORY = 40;
const generateId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const useEmailStore = create<EmailStoreState>()(
  persist(
    (set) => ({
      history: [],
      activeEmailId: null,
      saveGeneratedEmail: (email) =>
        set((state) => {
          const now = new Date().toISOString();
          const record: GeneratedEmailRecord = {
            ...email,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
          };
          return {
            history: [record, ...state.history].slice(0, MAX_EMAIL_HISTORY),
            activeEmailId: record.id,
          };
        }),
      updateEmailDraft: (id, payload) =>
        set((state) => ({
          history: state.history.map((item) =>
            item.id === id ? { ...item, ...payload, updatedAt: new Date().toISOString() } : item
          ),
        })),
      setActiveEmail: (id) => set({ activeEmailId: id }),
      removeEmail: (id) =>
        set((state) => {
          const history = state.history.filter((item) => item.id !== id);
          return {
            history,
            activeEmailId: state.activeEmailId === id ? history[0]?.id ?? null : state.activeEmailId,
          };
        }),
      clearHistory: () => set({ history: [], activeEmailId: null }),
    }),
    {
      name: "interniq-email-v1",
      version: 1,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<EmailStoreState>;
        return {
          history: Array.isArray(state.history) ? state.history : [],
          activeEmailId: typeof state.activeEmailId === "string" ? state.activeEmailId : null,
        } as EmailStoreState;
      },
      partialize: (state) => ({
        history: state.history,
        activeEmailId: state.activeEmailId,
      }),
    }
  )
);
