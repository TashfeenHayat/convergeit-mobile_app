import { useEffect } from "react";

type FlushFn = () => void;

let activeStepFlush: FlushFn | null = null;

/** Persist the active wizard step's in-memory form before stepper back navigation. */
export function flushActiveWizardStepToDraft(): void {
  activeStepFlush?.();
}

/**
 * Register a callback that writes the current step's React state into the wizard draft store.
 * Cleared automatically on unmount.
 */
export function useWizardStepFlush(flush: FlushFn | null): void {
  useEffect(() => {
    activeStepFlush = flush;
    return () => {
      if (activeStepFlush === flush) {
        activeStepFlush = null;
      }
    };
  }, [flush]);
}
