"use client";

import React from "react";
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
        <div className="glass-strong rounded-2xl border border-white/10 p-6">
          <h2 className="font-display text-2xl">{this.props.fallbackTitle ?? "Something went wrong"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {this.props.fallbackDescription ??
              "A rendering error occurred in this section. Try reloading this part of the page."}
          </p>
          <Button className="mt-4" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
