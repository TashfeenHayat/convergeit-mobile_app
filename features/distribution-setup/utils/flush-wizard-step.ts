import type { DistributionWizardStep } from "../distribution-wizard.types";
import type { SaveDistributionDraftOptions } from "../hooks/useDistributionDraftSave";
import { buildWizardSavePayload } from "./wizard-save-payload";
import {
  buildServerDraftSaveOptions,
  shouldSyncDraftToServer,
} from "./wizard-server-draft-payload";
import { applyWizardSessionFromSaveOptions } from "./wizard-session-sync";
import { readWizardSetupId } from "../wizard-storage";

type SaveDraftFn = (
  opts: Omit<SaveDistributionDraftOptions, "isActive">,
) => Promise<string | null>;

type SaveDraftToServerFn = (
  overrides?: Partial<SaveDistributionDraftOptions>,
) => Promise<string | null>;

/** Session first, then optional server draft (step 2+) for list visibility. */
export async function flushWizardStep(
  step: DistributionWizardStep,
  setupId: string | null,
  saveDraft: SaveDraftFn,
  saveDraftToServer: SaveDraftToServerFn,
  overrides?: Partial<SaveDistributionDraftOptions>,
): Promise<string | null> {
  const payload = buildWizardSavePayload({
    step,
    setupId,
    overrides: { ...overrides, silent: true },
  });
  applyWizardSessionFromSaveOptions(payload);
  await saveDraft(payload);

  if (!shouldSyncDraftToServer(step)) {
    return readWizardSetupId();
  }

  const serverOpts = buildServerDraftSaveOptions({
    setupId,
    ...overrides,
  });
  if (!serverOpts) return readWizardSetupId();

  const id = await saveDraftToServer(serverOpts);
  return id ?? readWizardSetupId();
}
