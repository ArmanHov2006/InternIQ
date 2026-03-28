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

type ChatState = {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  toggle: () => void;
  open: () => void;
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
  isOpen: false,
  isLoading: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
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
