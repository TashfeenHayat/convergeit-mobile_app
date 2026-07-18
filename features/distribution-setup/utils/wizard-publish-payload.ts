import type { SaveDistributionDraftOptions } from "../hooks/useDistributionDraftSave";
import {
  readWizardEmailFormId,
  readWizardMethod,
  readWizardSetupId,
  readWizardSubject,
  readWizardTableRows,
} from "../wizard-storage";
import type { DistributionTableRow } from "./map-distribution-rows";

/** Full body for Publish — reads complete wizard session + optional table overrides. */
export function buildPublishSaveOptions(
  overrides: Partial<SaveDistributionDraftOptions> = {},
): SaveDistributionDraftOptions {
  const tableRows: DistributionTableRow[] | undefined =
    overrides.tableRows ?? readWizardTableRows() ?? undefined;

  return {
    setupId: overrides.setupId ?? readWizardSetupId(),
    method: overrides.method ?? readWizardMethod() ?? "email",
    subject: overrides.subject ?? readWizardSubject(),
    emailConfigurationId:
      overrides.emailConfigurationId ?? readWizardEmailFormId(),
    tableRows,
    syncDepartments: true,
    isActive: true,
    silent: false,
  };
}
