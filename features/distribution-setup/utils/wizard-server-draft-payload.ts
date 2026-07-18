import type { SaveDistributionDraftOptions } from "../hooks/useDistributionDraftSave";
import {
  readWizardEmailFormId,
  readWizardMethod,
  readWizardSetupId,
  readWizardSubject,
  readWizardTableRows,
} from "../wizard-storage";
import { tableRowsToDepartmentsForSave } from "./table-rows-persist";
import type { DistributionTableRow } from "./map-distribution-rows";

/** Server draft (list table) — isActive false; appears as Draft in distribution list. */
export function buildServerDraftSaveOptions(
  overrides: Partial<SaveDistributionDraftOptions> = {},
): SaveDistributionDraftOptions | null {
  if ((overrides.method ?? readWizardMethod()) !== "email") return null;

  const tableRows: DistributionTableRow[] | undefined =
    overrides.tableRows ?? readWizardTableRows() ?? undefined;
  const departments = tableRows ? tableRowsToDepartmentsForSave(tableRows) : [];

  return {
    setupId: overrides.setupId ?? readWizardSetupId(),
    method: "email",
    subject: overrides.subject ?? readWizardSubject(),
    emailConfigurationId:
      overrides.emailConfigurationId ?? readWizardEmailFormId(),
    tableRows,
    syncDepartments: departments.length > 0,
    isActive: false,
    silent: true,
  };
}

export function shouldSyncDraftToServer(step: number): boolean {
  return step >= 2 && readWizardMethod() === "email";
}
