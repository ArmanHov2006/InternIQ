"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnalysisRecord, LocalResumeDoc } from "@/types/local-features";

type AnalyzeState = {
  resumes: LocalResumeDoc[];
  analyses: AnalysisRecord[];
  activeAnalysisId: string | null;
  addResume: (payload: Pick<LocalResumeDoc, "fileName" | "text">) => string;
  setPrimaryResume: (resumeId: string) => void;
  saveAnalysis: (record: Omit<AnalysisRecord, "id" | "createdAt">) => void;
  setActiveAnalysis: (id: string | null) => void;
  removeAnalysis: (id: string) => void;
  clearHistory: () => void;
};

const MAX_ANALYSIS_HISTORY = 25;
const generateId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const useAnalyzeStore = create<AnalyzeState>()(
  persist(
    (set) => ({
      resumes: [],
      analyses: [],
      activeAnalysisId: null,
      addResume: ({ fileName, text }) => {
        const id = generateId();
        set((state) => {
          const nextResume: LocalResumeDoc = {
            id,
            fileName,
            text,
            uploadedAt: new Date().toISOString(),
            isPrimary: state.resumes.length === 0,
          };
          return {
            resumes: [nextResume, ...state.resumes.map((resume) => ({ ...resume, isPrimary: false }))],
          };
        });
        return id;
      },
      setPrimaryResume: (resumeId) =>
        set((state) => ({
          resumes: state.resumes.map((resume) => ({
            ...resume,
            isPrimary: resume.id === resumeId,
          })),
        })),
      saveAnalysis: (record) =>
        set((state) => {
          const entry: AnalysisRecord = {
            ...record,
            id: generateId(),
            createdAt: new Date().toISOString(),
          };
          const analyses = [entry, ...state.analyses].slice(0, MAX_ANALYSIS_HISTORY);
          return {
            analyses,
            activeAnalysisId: entry.id,
          };
        }),
      setActiveAnalysis: (id) => set({ activeAnalysisId: id }),
      removeAnalysis: (id) =>
        set((state) => {
          const analyses = state.analyses.filter((item) => item.id !== id);
          return {
            analyses,
            activeAnalysisId: state.activeAnalysisId === id ? analyses[0]?.id ?? null : state.activeAnalysisId,
          };
        }),
      clearHistory: () => set({ analyses: [], activeAnalysisId: null }),
    }),
    {
      name: "interniq-analyze-v1",
      version: 1,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<AnalyzeState>;
        const resumes = Array.isArray(state.resumes) ? state.resumes : [];
        const analyses = Array.isArray(state.analyses) ? state.analyses : [];
        return {
          resumes,
          analyses,
          activeAnalysisId: typeof state.activeAnalysisId === "string" ? state.activeAnalysisId : null,
        } as AnalyzeState;
      },
      partialize: (state) => ({
        resumes: state.resumes,
        analyses: state.analyses,
        activeAnalysisId: state.activeAnalysisId,
      }),
    }
  )
);
