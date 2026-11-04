'use client';
import { Component, ReactNode } from 'react';

type Props = { children: ReactNode; resetKey?: unknown };

// Keeps one failing slide (e.g. a map slide on a browser without WebGL or modern JS)
// from blanking the whole screen. The failed slide renders empty, and tries again
// whenever resetKey changes.
export class SlideErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Slide failed to render', error);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.failed && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
