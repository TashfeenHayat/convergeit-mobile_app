import { DISTRIBUTION_ROUTES } from "../distribution.constants";
import type { DistributionWizardStep } from "../distribution-wizard.types";
import { readWizardMethod, readWizardWebsite } from "../wizard-storage";

export function distributionWizardStepHref(
  step: DistributionWizardStep,
  setupId: string | null,
): string {
  const q = setupId ? `?setupId=${encodeURIComponent(setupId)}` : "";
  switch (step) {
    case 1:
      return `${DISTRIBUTION_ROUTES.configure}${q}`;
    case 2:
      return `${DISTRIBUTION_ROUTES.settings}${q}`;
    case 3:
      return `${DISTRIBUTION_ROUTES.subject}${q}`;
    case 4:
      return `${DISTRIBUTION_ROUTES.table}${q}`;
    case 5:
      return `${DISTRIBUTION_ROUTES.test}${q}`;
    default:
      return DISTRIBUTION_ROUTES.configure;
  }
}

export function canOpenDistributionWizardStep(step: DistributionWizardStep): boolean {
  if (step === 1) return true;
  if (!readWizardWebsite()?.websiteId?.trim()) return false;
  if (step === 2) return true;
  if (step >= 3) return readWizardMethod() === "email";
  return true;
}

export function previousWizardStep(
  step: DistributionWizardStep,
): DistributionWizardStep | null {
  if (step <= 1) return null;
  return (step - 1) as DistributionWizardStep;
}

export function nextWizardStep(step: DistributionWizardStep): DistributionWizardStep | null {
  if (step >= 5) return null;
  return (step + 1) as DistributionWizardStep;
}

export function defaultEditWizardStep(isActive: boolean): DistributionWizardStep {
  return isActive ? 4 : 1;
}
