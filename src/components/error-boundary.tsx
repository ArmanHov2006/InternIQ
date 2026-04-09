"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error) {
    console.error("Dashboard render error", error);
  }

  private reset = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <GlassCard className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-base font-semibold">
                {this.props.fallbackTitle ?? "Something went wrong"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {this.props.fallbackDescription ??
                  "A rendering error occurred in this section. Try reloading this part of the page."}
              </p>
              <Button className="mt-4" size="sm" onClick={this.reset}>
                Try again
              </Button>
            </div>
          </div>
        </GlassCard>
      );
    }
    return this.props.children;
  }
}

/**
 * Convenience wrapper for feature sections.
 * Renders an inline error card with retry instead of crashing the page.
 */
export function FeatureErrorBoundary({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  return (
    <ErrorBoundary fallbackTitle={title} fallbackDescription={description}>
      {children}
    </ErrorBoundary>
  );
}
