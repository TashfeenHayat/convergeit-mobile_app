import type { PickWebsitePreset } from '@/features/website-assignments/components/PickWebsiteModal';
import { CRM_PLATFORM_CODES, type CrmPlatformCode } from './crm.constants';
import {
  safeSessionGet,
  safeSessionRemove,
  safeSessionSet,
} from '@/lib/storage/safe-web-storage';

const WEBSITE_KEY = 'crm-wizard-website';
const PLATFORM_KEY = 'crm-wizard-platform';
const METHOD_KEY = 'crm-wizard-connection-method';
const INTEGRATION_ID_KEY = 'crm-wizard-integration-id';
const CONFIG_KEY = 'crm-wizard-config-draft';

export type CrmWizardPlatform = CrmPlatformCode;
export type CrmWizardConnectionMethod = string;

export function readCrmWizardWebsite(): PickWebsitePreset | null {
  const raw = safeSessionGet(WEBSITE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PickWebsitePreset;
    if (!parsed?.childCompanyId?.trim() || !parsed?.websiteId?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCrmWizardWebsite(preset: PickWebsitePreset): void {
  safeSessionSet(WEBSITE_KEY, JSON.stringify(preset));
}

export function readCrmWizardPlatform(): CrmWizardPlatform | null {
  const raw = safeSessionGet(PLATFORM_KEY)?.trim().toLowerCase();
  if (raw && isCrmPlatformCode(raw)) return raw;
  return null;
}

function isCrmPlatformCode(raw: string): raw is CrmPlatformCode {
  return (CRM_PLATFORM_CODES as readonly string[]).includes(raw);
}

export function writeCrmWizardPlatform(platform: CrmWizardPlatform | null): void {
  if (!platform) safeSessionRemove(PLATFORM_KEY);
  else safeSessionSet(PLATFORM_KEY, platform);
}

export function readCrmWizardConnectionMethod(): CrmWizardConnectionMethod | null {
  return safeSessionGet(METHOD_KEY)?.trim() || null;
}

export function writeCrmWizardConnectionMethod(method: CrmWizardConnectionMethod | null): void {
  if (!method) safeSessionRemove(METHOD_KEY);
  else safeSessionSet(METHOD_KEY, method);
}

export function readCrmWizardIntegrationId(): string | null {
  return safeSessionGet(INTEGRATION_ID_KEY)?.trim() || null;
}

export function writeCrmWizardIntegrationId(id: string | null): void {
  if (!id?.trim()) safeSessionRemove(INTEGRATION_ID_KEY);
  else safeSessionSet(INTEGRATION_ID_KEY, id.trim());
}

export function readCrmWizardConfigDraft(): Record<string, string> {
  const raw = safeSessionGet(CONFIG_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeCrmWizardConfigDraft(config: Record<string, string>): void {
  safeSessionSet(CONFIG_KEY, JSON.stringify(config));
}

export function clearCrmWizardDraft(): void {
  safeSessionRemove(WEBSITE_KEY);
  safeSessionRemove(PLATFORM_KEY);
  safeSessionRemove(METHOD_KEY);
  safeSessionRemove(INTEGRATION_ID_KEY);
  safeSessionRemove(CONFIG_KEY);
}
