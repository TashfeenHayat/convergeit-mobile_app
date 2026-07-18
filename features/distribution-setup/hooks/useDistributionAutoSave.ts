import type { DistributionWizardStep } from "../distribution-wizard.types";

/**
 * @deprecated Auto-save removed — use Save draft button or Continue / Publish.
 */
export function useDistributionAutoSave(
  _step: DistributionWizardStep,
  _setupId: string | null,
  _opts: { enabled?: boolean; overrides?: unknown } = {},
) {
  return { saving: false };
}
