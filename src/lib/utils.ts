import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseApiError(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null) {
    if ("error" in payload && typeof (payload as Record<string, unknown>).error === "string") {
      return (payload as { error: string }).error;
    }
    if ("detail" in payload && typeof (payload as Record<string, unknown>).detail === "string") {
      return (payload as { detail: string }).detail;
    }
  }
  return fallback;
}
