import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { PickWebsitePreset } from "@/features/website-assignments/components/PickWebsiteModal";
import { isPickWebsiteComplete } from "@/features/website-assignments/components/PickWebsiteFields";
import { DISTRIBUTION_ROUTES } from "../distribution.constants";
import type { DistributionWizardStep } from "../distribution-wizard.types";
import {
  distributionWizardStepHref,
  nextWizardStep,
  previousWizardStep,
} from "../utils/distribution-wizard-nav";
import { flushWizardStep } from "../utils/flush-wizard-step";
import { shouldSyncDraftToServer } from "../utils/wizard-server-draft-payload";
import {
  readWizardMethod,
  readWizardSetupId,
  writeWizardWebsite,
} from "../wizard-storage";
import type { SaveDistributionDraftOptions } from "./useDistributionDraftSave";
import { publishAppToast } from "@/lib/notify";
import { useDistributionDraftSave } from "./useDistributionDraftSave";

export type UseDistributionWizardNavOptions = {
  currentStep: DistributionWizardStep;
  setupId: string | null;
  websitePreset?: PickWebsitePreset | null;
  saveOverrides?: Partial<SaveDistributionDraftOptions>;
};

export function useDistributionWizardNav({
  currentStep,
  setupId,
  websitePreset,
  saveOverrides,
}: UseDistributionWizardNavOptions) {
  const router = useRouter();
  const { saveDraft, saveDraftToServer, saving } = useDistributionDraftSave(setupId);

  const flushSave = useCallback(async (): Promise<string | null> => {
    if (websitePreset && isPickWebsiteComplete(websitePreset)) {
      writeWizardWebsite(websitePreset);
    }

    if (currentStep === 2 && readWizardMethod() !== "email") {
      return readWizardSetupId();
    }

    return flushWizardStep(
      currentStep,
      setupId,
      saveDraft,
      saveDraftToServer,
      saveOverrides,
    );
  }, [
    currentStep,
    saveDraft,
    saveDraftToServer,
    saveOverrides,
    setupId,
    websitePreset,
  ]);

  const navigateTo = useCallback(
    async (step: DistributionWizardStep) => {
      const currentSetupId = setupId ?? readWizardSetupId();

      if (!shouldSyncDraftToServer(currentStep)) {
        const id = await flushSave();
        router.push(distributionWizardStepHref(step, id ?? currentSetupId));
        return;
      }

      router.push(distributionWizardStepHref(step, currentSetupId));
      void flushSave();
    },
    [currentStep, flushSave, router, setupId],
  );

  const goToList = useCallback(() => {
    void flushSave().then(() => {
      router.push(DISTRIBUTION_ROUTES.home);
    });
  }, [flushSave, router]);

  const goBack = useCallback(() => {
    const prev = previousWizardStep(currentStep);
    if (!prev) {
      goToList();
      return;
    }
    void navigateTo(prev);
  }, [currentStep, goToList, navigateTo]);

  const goNext = useCallback(() => {
    const next = nextWizardStep(currentStep);
    if (!next) return;
    if (currentStep === 2 && readWizardMethod() !== "email") {
      publishAppToast({
        variant: "error",
        message: "Select Email as the delivery method before continuing.",
      });
      return;
    }
    void navigateTo(next);
  }, [currentStep, navigateTo]);

  const goToStep = useCallback(
    (step: DistributionWizardStep) => {
      void navigateTo(step);
    },
    [navigateTo],
  );

  return {
    saving,
    flushSave,
    goToList,
    goBack,
    goNext,
    goToStep,
    navigateTo,
  };
}
