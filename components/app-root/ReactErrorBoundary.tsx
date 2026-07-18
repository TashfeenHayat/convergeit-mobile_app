import { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type ReactErrorBoundaryProps = {
  children?: ReactNode;
  fallback?: ReactNode;
};

type State = { hasError: boolean };

/**
 * Lightweight RN error boundary (web uses a richer MUI fallback).
 */
export class ReactErrorBoundary extends Component<ReactErrorBoundaryProps, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    /* optional logging hook later */
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={styles.fallback} accessibilityRole="alert">
          <Typography variant="medium">Something went wrong.</Typography>
        </View>
      );
    }
    return this.props.children ?? null;
  }
}

const styles = StyleSheet.create({
  fallback: {
    padding: tokens.space.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
