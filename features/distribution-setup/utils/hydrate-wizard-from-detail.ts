import type { DistributionSetupDetail } from "@/api/distribution/distribution-setup.api";
import {
  methodFromDetailApi,
  writeWizardEmailFormId,
  writeWizardMethod,
  writeWizardPublished,
  writeWizardSetupId,
  writeWizardSubject,
  writeWizardTableRows,
  writeWizardWebsite,
} from "../wizard-storage";
import { detailToTableRows } from "./map-distribution-rows";

export function hydrateWizardFromDetail(detail: DistributionSetupDetail): void {
  writeWizardSetupId(detail.id);
  writeWizardPublished(detail.isActive);
  writeWizardMethod(methodFromDetailApi(detail.method));
  writeWizardWebsite({
    websiteId: detail.websiteId,
    resellerId: detail.resellerId,
    parentCompanyId: detail.parentCompanyId,
    childCompanyId: detail.childCompanyId,
  });
  writeWizardSubject(detail.subject?.trim() ?? "");
  writeWizardEmailFormId(detail.emailConfigurationId);
  writeWizardTableRows(detailToTableRows(detail));
}
