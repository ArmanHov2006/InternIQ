"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = { className?: string };

/** Gemini-inspired mark: gradient four-point diamond. */
export const AssistantChatIcon = ({ className }: Props) => {
  const gid = useId().replace(/:/g, "");
  const gradId = `${gid}-assistant-grad`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6 shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="50%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-warm)" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.5L22.5 12 12 22.5 1.5 12 12 1.5z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
};
