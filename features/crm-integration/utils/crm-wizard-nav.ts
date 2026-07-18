import { CRM_ROUTES } from "../crm.constants";
import type { CrmWizardStep } from "../crm-wizard.types";
import {
  readCrmWizardConnectionMethod,
  readCrmWizardPlatform,
  readCrmWizardWebsite,
} from "../wizard-storage";

export function crmWizardStepHref(step: CrmWizardStep): string {
  switch (step) {
    case 1:
      return CRM_ROUTES.configure;
    case 2:
      return CRM_ROUTES.crmSelection;
    case 3:
      return CRM_ROUTES.connectionMethod;
    case 4:
      return CRM_ROUTES.connection;
    case 5:
      return CRM_ROUTES.fieldMapping;
    default:
      return CRM_ROUTES.home;
  }
}

export function canOpenCrmWizardStep(step: CrmWizardStep): boolean {
  const website = readCrmWizardWebsite();
  const platform = readCrmWizardPlatform();
  const method = readCrmWizardConnectionMethod();

  if (step >= 2 && !website?.childCompanyId?.trim()) return false;
  if (step >= 3 && !platform) return false;
  if (step >= 4 && !method) return false;
  return true;
}
