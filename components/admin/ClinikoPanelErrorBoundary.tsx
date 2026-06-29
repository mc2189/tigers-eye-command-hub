"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  title: string;
}

interface State {
  hasError: boolean;
}

export class ClinikoPanelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold text-navy">{this.props.title}</p>
          <p className="mt-2">
            This panel could not render live Cliniko data safely. Other Command Hub
            sections are still available. Cliniko data has not been changed.
          </p>
        </section>
      );
    }

    return this.props.children;
  }
}
