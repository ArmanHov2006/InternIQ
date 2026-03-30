"use client";

import { create } from "zustand";

export type ChatAction = {
  type: string;
  payload: Record<string, unknown>;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  actions?: ChatAction[];
  timestamp: string;
};

export type ChatPanelState = "closed" | "minimized" | "open";

type ChatState = {
  messages: ChatMessage[];
  panelState: ChatPanelState;
  isLoading: boolean;
  toggle: () => void;
  open: () => void;
  minimize: () => void;
  close: () => void;
  addMessage: (
    role: ChatMessage["role"],
    content: string,
    actions?: ChatAction[]
  ) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
};

const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  panelState: "closed",
  isLoading: false,
  toggle: () =>
    set((s) => {
      if (s.panelState === "closed") return { panelState: "open" };
      if (s.panelState === "open") return { panelState: "closed" };
      if (s.panelState === "minimized") return { panelState: "open" };
      return s;
    }),
  open: () => set({ panelState: "open" }),
  minimize: () => set({ panelState: "minimized" }),
  close: () => set({ panelState: "closed" }),
  addMessage: (role, content, actions) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: uid(), role, content, actions, timestamp: new Date().toISOString() },
      ],
    })),
  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [], isLoading: false }),
}));
