import { useCallback } from "react";
import type { DistributionWizardStep } from "../distribution-wizard.types";
import {
  buildWizardSavePayload,
  canSaveWizardStep,
  type BuildWizardSavePayloadOptions,
} from "../utils/wizard-save-payload";
import type { SaveDistributionDraftOptions } from "./useDistributionDraftSave";
import { useDistributionDraftSave } from "./useDistributionDraftSave";

export type UseDistributionStepSaveOptions = {
  step: DistributionWizardStep;
  setupId: string | null;
};

/**
 * Single entry point for wizard saves — always scoped to the current step.
 */
export function useDistributionStepSave({ step, setupId }: UseDistributionStepSaveOptions) {
  const { saveDraft, publishSetup, saving } = useDistributionDraftSave(setupId);

  const saveStep = useCallback(
    (overrides?: Partial<SaveDistributionDraftOptions>) => {
      if (!canSaveWizardStep(step)) {
        return Promise.resolve(setupId);
      }
      const payload = buildWizardSavePayload({ step, setupId, overrides });
      return saveDraft(payload);
    },
    [saveDraft, setupId, step],
  );

  const saveForNav = useCallback(
    (opts?: Omit<BuildWizardSavePayloadOptions, "step" | "setupId">) => {
      if (!canSaveWizardStep(step)) {
        return Promise.resolve(setupId);
      }
      return saveDraft(
        buildWizardSavePayload({
          step,
          setupId,
          overrides: { ...opts?.overrides, silent: true },
        }),
      );
    },
    [saveDraft, setupId, step],
  );

  return { saveStep, saveForNav, publishSetup, saving };
}
