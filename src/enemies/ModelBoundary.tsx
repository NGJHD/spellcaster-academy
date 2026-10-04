import { Component, type ReactNode } from 'react';

/** Falls back to a code-built stand-in if a model is missing or fails to load (never crash the scene). */
export class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
