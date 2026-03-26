"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DASHBOARD_SHORTCUT_ROUTES } from "@/lib/dashboard-navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    let gPressed = false;
    let gTimeout: ReturnType<typeof setTimeout> | null = null;

    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName && ["INPUT", "TEXTAREA", "SELECT"].includes(tagName)) return;
      if (target?.isContentEditable) return;

      const key = typeof event.key === "string" ? event.key.toLowerCase() : "";
      if (!key) return;

      if (gPressed) {
        gPressed = false;
        if (gTimeout) clearTimeout(gTimeout);
        const route = DASHBOARD_SHORTCUT_ROUTES[key];
        if (route) {
          event.preventDefault();
          router.push(route);
        }
        return;
      }

      if (key === "g") {
        gPressed = true;
        gTimeout = setTimeout(() => {
          gPressed = false;
        }, 500);
        return;
      }

      if (key === "n") {
        event.preventDefault();
        sessionStorage.setItem("open-add-application-once", "true");
        router.push("/dashboard/tracker");
      }
      if (key === "?") {
        event.preventDefault();
        document.dispatchEvent(new CustomEvent("toggle-shortcuts-help"));
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
}
