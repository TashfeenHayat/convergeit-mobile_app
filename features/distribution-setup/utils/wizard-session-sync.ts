import type { SaveDistributionDraftOptions } from "../hooks/useDistributionDraftSave";
import {
  readWizardSetupId,
  writeWizardEmailFormId,
  writeWizardMethod,
  writeWizardPublished,
  writeWizardSetupId,
  writeWizardSubject,
  writeWizardTableRows,
} from "../wizard-storage";
import type { DistributionTableRow } from "./map-distribution-rows";

/** Apply wizard field changes to session only — no API. */
export function applyWizardSessionFromSaveOptions(
  opts: Partial<SaveDistributionDraftOptions>,
): void {
  if (opts.method) writeWizardMethod(opts.method);
  if (opts.subject !== undefined) writeWizardSubject(opts.subject);
  if (opts.emailConfigurationId !== undefined) {
    writeWizardEmailFormId(opts.emailConfigurationId);
  }
  if (opts.tableRows !== undefined) {
    writeWizardTableRows(opts.tableRows);
  }
}

export function readWizardSessionSetupId(): string | null {
  return readWizardSetupId();
}

export function markWizardPublished(setupId: string): void {
  writeWizardSetupId(setupId);
  writeWizardPublished(true);
}
