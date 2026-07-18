import type { DistributionWizardStep } from "../distribution-wizard.types";
import type { SaveDistributionDraftOptions } from "../hooks/useDistributionDraftSave";
import {
  readWizardEmailFormId,
  readWizardMethod,
  readWizardSubject,
  readWizardTableRows,
} from "../wizard-storage";
import type { DistributionTableRow } from "./map-distribution-rows";
import { tableRowsToDepartmentsForSave } from "./table-rows-persist";

export type BuildWizardSavePayloadOptions = {
  /** Wizard step you are leaving or saving from. */
  step: DistributionWizardStep;
  setupId?: string | null;
  /** Page-local values override session (e.g. live table rows). */
  overrides?: Partial<SaveDistributionDraftOptions>;
};

/**
 * Step-scoped API payload — only fields completed up to this step are sent.
 * Prevents early steps from wiping departments or forcing method before user selects Email.
 */
export function buildWizardSavePayload({
  step,
  setupId,
  overrides = {},
}: BuildWizardSavePayloadOptions): SaveDistributionDraftOptions {
  const payload: SaveDistributionDraftOptions = {
    setupId,
    silent: overrides.silent ?? true,
  };

  if (step >= 2) {
    payload.method = overrides.method ?? readWizardMethod();
  }

  if (step >= 3) {
    if (overrides.subject !== undefined) payload.subject = overrides.subject;
    else payload.subject = readWizardSubject();
    payload.emailConfigurationId =
      overrides.emailConfigurationId ?? readWizardEmailFormId();
  }

  if (step >= 4) {
    const rows: DistributionTableRow[] | undefined =
      overrides.tableRows ?? readWizardTableRows() ?? undefined;
    if (rows !== undefined) {
      payload.tableRows = rows;
      const departments = tableRowsToDepartmentsForSave(rows);
      payload.syncDepartments = departments.length > 0 || overrides.syncDepartments === true;
    }
  }

  if (overrides.isActive !== undefined) payload.isActive = overrides.isActive;
  if (overrides.silent !== undefined) payload.silent = overrides.silent;

  return payload;
}

/** Whether this step may call the API (step 1 create needs website in session only). */
export function canSaveWizardStep(step: DistributionWizardStep): boolean {
  if (step === 1) return true;
  if (step === 2) return readWizardMethod() === "email";
  if (step >= 3) return readWizardMethod() === "email";
  return false;
}
