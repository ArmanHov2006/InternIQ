"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Send, Trash2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKanbanStore, type StatusId } from "@/stores/kanban-store";
import { useChatStore } from "@/stores/chat-store";
import { dispatchOpenAddApplication } from "@/lib/events";
import { IconFrame, SparkGlyph } from "@/components/ui/icons/premium-icons";

const PAGE_ROUTES: Record<string, string> = {
  overview: "/dashboard",
  tracker: "/dashboard/tracker",
  profile: "/dashboard/profile",
  analyze: "/dashboard/analyze",
  email: "/dashboard/email",
  automation: "/dashboard/automation",
  "interview-prep": "/dashboard/interview-prep",
  "cover-letter": "/dashboard/cover-letter",
  "resume-tailor": "/dashboard/resume-tailor",
};

const QUICK_ACTIONS = [
  { label: "Show my stats", message: "How many applications do I have and what's the breakdown?" },
  { label: "Go to Tracker", message: "Take me to the application tracker" },
  { label: "Add Application", message: "I want to add a new application" },
  { label: "Analyze Resume", message: "Help me analyze my resume against a job posting" },
];

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="h-1.5 w-1.5 rounded-full bg-primary/60"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
    <span className="ml-1.5 text-xs text-muted-foreground">Thinking&hellip;</span>
  </div>
);

interface MessageProps {
  role: "user" | "assistant" | "system";
  content: string;
}

const MessageBubble = ({ role, content }: MessageProps) => {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md glow-sm"
            : "glass rounded-bl-md"
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </motion.div>
  );
};

export const Chatbot = () => {
  const router = useRouter();
  const { cards, columns, setSearch, setFilter } = useKanbanStore();
  const {
    messages,
    isOpen,
    isLoading,
    toggle,
    close,
    addMessage,
    setLoading,
    clearMessages,
  } = useChatStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const buildContext = useCallback(() => {
    const allCards = Object.values(cards);
    const byStatus: Record<string, number> = {};
    for (const s of Object.keys(columns) as StatusId[]) {
      byStatus[s] = columns[s].cardIds.length;
    }
    return {
      total_applications: allCards.length,
      by_status: byStatus,
      recent_applications: allCards.slice(0, 10).map((c) => ({
        company: c.company,
        role: c.role,
        status: c.status,
        location: c.location,
      })),
    };
  }, [cards, columns]);

  const executeActions = useCallback(
    async (actions: { type: string; payload: Record<string, unknown> }[]) => {
      for (const action of actions) {
        switch (action.type) {
          case "navigate_to_page": {
            const route = PAGE_ROUTES[action.payload.page as string];
            if (route) router.push(route);
            break;
          }
          case "add_application": {
            try {
              await fetch("/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  company: action.payload.company,
                  role: action.payload.role,
                  status: action.payload.status || "saved",
                  location: action.payload.location || "",
                  job_url: action.payload.job_url || "",
                  notes: action.payload.notes || "",
                }),
              });
            } catch {
              /* API error is surfaced via the reply text */
            }
            break;
          }
          case "open_add_dialog":
            dispatchOpenAddApplication();
            break;
          case "set_tracker_filter": {
            if (typeof action.payload.search === "string")
              setSearch(action.payload.search);
            if (typeof action.payload.status_filter === "string")
              setFilter(action.payload.status_filter);
            router.push("/dashboard/tracker");
            break;
          }
        }
      }
    },
    [router, setSearch, setFilter]
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
      addMessage("user", trimmed);
      setInput("");
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: trimmed },
            ],
            context: buildContext(),
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          addMessage(
            "assistant",
            res.status === 401
              ? "Please log in to use the AI assistant."
              : (body as { error?: string })?.error ||
                  "Something went wrong. Try again."
          );
          return;
        }

        const data = (await res.json()) as {
          reply: string;
          actions?: { type: string; payload: Record<string, unknown> }[];
        };
        addMessage("assistant", data.reply);
        if (data.actions?.length) await executeActions(data.actions);
      } catch {
        addMessage(
          "assistant",
          "Couldn\u2019t reach the server \u2014 please check your connection."
        );
      } finally {
        setLoading(false);
      }
    },
    [messages, isLoading, addMessage, setLoading, buildContext, executeActions]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      {/* Floating bubble */}
      <motion.button
        onClick={toggle}
        aria-label="Toggle AI assistant"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-glow-md transition-all"
        animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
        whileHover={{ scale: 1.12, y: -2 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{ pointerEvents: isOpen ? "none" : "auto" }}
      >
        <IconFrame className="h-7 w-7 rounded-full border-none bg-transparent shadow-none">
          <SparkGlyph />
        </IconFrame>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 flex h-[min(600px,80vh)] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl glass-strong shadow-glow-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <IconFrame className="h-6 w-6 rounded-md">
                  <SparkGlyph />
                </IconFrame>
                <span className="font-display text-sm">InternIQ AI</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearMessages}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                  aria-label="Clear chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={close}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                  aria-label="Minimize"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={close}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center px-2"
                >
                  <IconFrame className="h-12 w-12 rounded-xl mb-3">
                    <SparkGlyph className="h-6 w-6" />
                  </IconFrame>
                  <p className="text-sm font-medium mb-1">
                    Hey! I&apos;m your AI assistant.
                  </p>
                  <p className="text-xs text-muted-foreground mb-5 max-w-[260px]">
                    I can navigate the app, manage applications, and point you
                    to the right AI tools.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_ACTIONS.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => send(a.message)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Quick-action chips when there are messages */}
            {messages.length > 0 && !isLoading && (
              <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 scrollbar-none">
                {QUICK_ACTIONS.slice(0, 3).map((a) => (
                  <button
                    key={a.label}
                    onClick={() => send(a.message)}
                    className="flex-shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-white/10 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything\u2026"
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                  style={{ maxHeight: 100 }}
                />
                <motion.button
                  onClick={() => send(input)}
                  disabled={!input.trim() || isLoading}
                  whileHover={
                    input.trim() && !isLoading ? { scale: 1.05 } : {}
                  }
                  whileTap={
                    input.trim() && !isLoading ? { scale: 0.95 } : {}
                  }
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                    input.trim() && !isLoading
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-white/5 text-muted-foreground cursor-not-allowed"
                  )}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
