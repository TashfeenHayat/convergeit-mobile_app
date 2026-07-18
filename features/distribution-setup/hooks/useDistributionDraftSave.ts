import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createDistributionSetup,
  updateDistributionSetup,
  type UpsertDistributionSetupBody,
} from "@/api/distribution/distribution-setup.api";
import {
  readWizardEmailFormId,
  readWizardMethod,
  readWizardSetupId,
  readWizardSubject,
  readWizardWebsite,
  writeWizardSetupId,
  type DistributionWizardMethod,
} from "../wizard-storage";
import { tableRowsToDepartmentsForSave } from "../utils/table-rows-persist";
import type { DistributionTableRow } from "../utils/map-distribution-rows";
import { applyWizardSessionFromSaveOptions } from "../utils/wizard-session-sync";
import { markWizardPublished } from "../utils/wizard-session-sync";
import { buildPublishSaveOptions } from "../utils/wizard-publish-payload";
import { buildServerDraftSaveOptions } from "../utils/wizard-server-draft-payload";
import { publishAppToast } from "@/lib/notify";
import { extractApiErrorMessageForToast } from "@/lib/notify/extract-api-message";
import { distributionSetupKeys } from "./keys";

export type SaveDistributionDraftOptions = {
  setupId?: string | null;
  method?: DistributionWizardMethod | null;
  subject?: string;
  emailConfigurationId?: string | null;
  tableRows?: DistributionTableRow[];
  syncDepartments?: boolean;
  isActive?: boolean;
  silent?: boolean;
};

export function useDistributionDraftSave(initialSetupId: string | null) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const invalidate = useCallback(
    async (id: string) => {
      await qc.invalidateQueries({ queryKey: distributionSetupKeys.all });
      await qc.invalidateQueries({ queryKey: distributionSetupKeys.detail(id) });
    },
    [qc],
  );

  const buildBody = useCallback((opts: SaveDistributionDraftOptions): UpsertDistributionSetupBody | null => {
    const website = readWizardWebsite();
    const websiteId = website?.websiteId;
    if (!websiteId) return null;

    const selectedMethod = opts.method ?? readWizardMethod();
    if (selectedMethod !== "email") return null;

    const body: UpsertDistributionSetupBody = {
      websiteId,
      method: "email",
      subject: (opts.subject ?? readWizardSubject()) || undefined,
      emailConfigurationId:
        opts.emailConfigurationId ?? readWizardEmailFormId() ?? undefined,
      isActive: opts.isActive ?? false,
    };

    if (opts.tableRows !== undefined) {
      const departments = tableRowsToDepartmentsForSave(opts.tableRows);
      if (departments.length > 0) {
        body.departments = departments;
      } else if (opts.syncDepartments) {
        body.departments = [];
      }
    }

    return body;
  }, []);

  const persistToServer = useCallback(
    async (opts: SaveDistributionDraftOptions): Promise<string | null> => {
      const body = buildBody(opts);
      if (!body) {
        if (!opts.silent) {
          publishAppToast({
            variant: "error",
            message: "Select a website and Email delivery first.",
          });
        }
        return null;
      }

      const id = opts.setupId ?? initialSetupId ?? readWizardSetupId();
      setSaving(true);
      try {
        if (id) {
          await updateDistributionSetup(id, body);
          writeWizardSetupId(id);
          if (opts.isActive) markWizardPublished(id);
          await invalidate(id);
          if (!opts.silent && opts.isActive) {
            publishAppToast({
              variant: "success",
              message: "Distribution published and activated.",
            });
          }
          return id;
        }
        const created = await createDistributionSetup(body);
        writeWizardSetupId(created.id);
        if (opts.isActive) markWizardPublished(created.id);
        await invalidate(created.id);
        if (!opts.silent && opts.isActive) {
          publishAppToast({
            variant: "success",
            message: "Distribution published and activated.",
          });
        }
        return created.id;
      } catch (err) {
        if (!opts.silent) {
          publishAppToast({
            variant: "error",
            message: extractApiErrorMessageForToast(
              err,
              opts.isActive ? "Could not publish setup." : "Could not save draft.",
            ),
          });
        }
        return null;
      } finally {
        setSaving(false);
      }
    },
    [buildBody, initialSetupId, invalidate],
  );

  /** Browser session only (step 1). */
  const saveDraft = useCallback(
    async (opts: Omit<SaveDistributionDraftOptions, "isActive"> = {}): Promise<string | null> => {
      applyWizardSessionFromSaveOptions(opts);
      return opts.setupId ?? initialSetupId ?? readWizardSetupId();
    },
    [initialSetupId],
  );

  /** Server draft — shows in distribution list as Draft (isActive: false). */
  const saveDraftToServer = useCallback(
    (overrides: Partial<SaveDistributionDraftOptions> = {}) => {
      const opts = buildServerDraftSaveOptions(overrides);
      if (!opts) return Promise.resolve(null);
      return persistToServer(opts);
    },
    [persistToServer],
  );

  const publishSetup = useCallback(
    (overrides: Partial<SaveDistributionDraftOptions> = {}) => {
      const opts = buildPublishSaveOptions({
        method: "email",
        ...overrides,
      });

      if (!readWizardWebsite()?.websiteId) {
        publishAppToast({ variant: "error", message: "Select a website before publishing." });
        return Promise.resolve(null);
      }

      const rows = opts.tableRows ?? [];
      if (!rows.length) {
        publishAppToast({
          variant: "error",
          message: "Add at least one department row before publishing.",
        });
        return Promise.resolve(null);
      }

      const departments = tableRowsToDepartmentsForSave(rows);
      if (departments.length === 0) {
        publishAppToast({
          variant: "error",
          message:
            "Each row needs a department name and at least one To, CC, or BCC email. Click Add on draft rows when done editing.",
        });
        return Promise.resolve(null);
      }

      return persistToServer(opts);
    },
    [persistToServer],
  );

  return { saveDraft, saveDraftToServer, publishSetup, saving };
}
