"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";

export const AppToaster = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = mounted && resolvedTheme === "light" ? "light" : "dark";

  return <Toaster position="bottom-right" theme={theme} />;
};
