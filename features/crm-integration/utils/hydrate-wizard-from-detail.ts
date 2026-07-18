import type { CrmIntegrationDetail } from "@/api/crm/crm-integration.api";
import type { CrmWizardPlatform } from "../wizard-storage";
import {
  writeCrmWizardConfigDraft,
  writeCrmWizardConnectionMethod,
  writeCrmWizardIntegrationId,
  writeCrmWizardPlatform,
  writeCrmWizardWebsite,
} from "../wizard-storage";

export function hydrateCrmWizardFromDetail(
  detail: CrmIntegrationDetail,
  websiteIdOverride?: string | null,
): void {
  writeCrmWizardIntegrationId(detail.id);
  writeCrmWizardPlatform(detail.platformCode as CrmWizardPlatform);
  writeCrmWizardConnectionMethod(detail.connectionMethod);
  writeCrmWizardConfigDraft({ ...detail.config });

  if (detail.company) {
    const websiteId = detail.websiteId?.trim() || websiteIdOverride?.trim() || "";
    writeCrmWizardWebsite({
      websiteId,
      childCompanyId: detail.companyId,
      parentCompanyId: detail.company.parentCompanyId,
      resellerId: detail.company.resellerId,
    });
  }
}

export function defaultCrmEditStep(detail: CrmIntegrationDetail): 2 | 3 | 4 | 5 {
  if (detail.fieldMappings.length > 0) return 5;
  if (detail.connectionMethod && Object.keys(detail.config).length > 0) return 4;
  if (detail.connectionMethod) return 4;
  if (detail.platformCode) return 3;
  return 2;
}
