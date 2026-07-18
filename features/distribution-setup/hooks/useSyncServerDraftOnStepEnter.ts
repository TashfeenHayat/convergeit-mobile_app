import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DistributionWizardStep } from "../distribution-wizard.types";
import { flushWizardStep } from "../utils/flush-wizard-step";
import { readWizardMethod, readWizardSetupId, readWizardWebsite, writeWizardSetupId } from "../wizard-storage";
import type { SaveDistributionDraftOptions } from "./useDistributionDraftSave";
import { useDistributionDraftSave } from "./useDistributionDraftSave";

/**
 * On entering step 3+ — immediately persist draft to server (list table) and sync setupId in URL.
 */
export function useSyncServerDraftOnStepEnter(
  step: DistributionWizardStep,
  setupId: string | null,
  overrides?: Partial<SaveDistributionDraftOptions>,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { saveDraft, saveDraftToServer } = useDistributionDraftSave(setupId);
  const overridesRef = useRef(overrides);
  overridesRef.current = overrides;
  const ranRef = useRef(false);

  useEffect(() => {
    if (step < 3) return;
    if (ranRef.current) return;
    if (!readWizardWebsite()?.websiteId?.trim()) return;
    if (readWizardMethod() !== "email") return;

    ranRef.current = true;
    let cancelled = false;

    void (async () => {
      const id = await flushWizardStep(
        step,
        setupId ?? readWizardSetupId(),
        saveDraft,
        saveDraftToServer,
        overridesRef.current,
      );
      if (cancelled || !id) return;

      writeWizardSetupId(id);
      const inUrl = searchParams.get("setupId")?.trim();
      if (!inUrl) {
        const q = new URLSearchParams(searchParams.toString());
        q.set("setupId", id);
        router.replace(`${pathname}?${q.toString()}`, { scroll: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, saveDraft, saveDraftToServer, searchParams, setupId, step]);
}
