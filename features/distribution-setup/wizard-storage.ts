import type { PickWebsitePreset } from '@/features/website-assignments/components/PickWebsiteModal';
import type { DistributionTableRow } from './utils/map-distribution-rows';
import { methodFromApiValue } from './distribution-method.constants';
import {
  safeSessionGet,
  safeSessionRemove,
  safeSessionSet,
} from '@/lib/storage/safe-web-storage';

const WEBSITE_KEY = 'distribution-wizard-website';
const METHOD_KEY = 'distribution-wizard-method';
const SETUP_ID_KEY = 'distribution-wizard-setup-id';
const SUBJECT_KEY = 'distribution-wizard-subject';
const EMAIL_FORM_ID_KEY = 'distribution-wizard-email-form-id';
const TABLE_ROWS_KEY = 'distribution-wizard-table-rows';
const PUBLISHED_KEY = 'distribution-wizard-published';

/** User-selectable methods in the wizard. */
export type DistributionWizardMethod = 'email' | 'crm' | 'both';

export function readWizardWebsite(): PickWebsitePreset | null {
  const raw = safeSessionGet(WEBSITE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PickWebsitePreset;
    if (!parsed?.websiteId?.trim() || !parsed?.parentCompanyId?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeWizardWebsite(preset: PickWebsitePreset): void {
  safeSessionSet(WEBSITE_KEY, JSON.stringify(preset));
}

export function readWizardMethod(): DistributionWizardMethod | null {
  const raw = safeSessionGet(METHOD_KEY)?.trim().toLowerCase();
  if (raw === 'email' || raw === 'crm' || raw === 'both') return raw;
  return null;
}

export function writeWizardMethod(method: DistributionWizardMethod | null): void {
  if (!method) {
    safeSessionRemove(METHOD_KEY);
    return;
  }
  safeSessionSet(METHOD_KEY, method);
}

export function readWizardSetupId(): string | null {
  return safeSessionGet(SETUP_ID_KEY)?.trim() || null;
}

export function writeWizardSetupId(setupId: string | null): void {
  if (!setupId?.trim()) {
    safeSessionRemove(SETUP_ID_KEY);
    return;
  }
  safeSessionSet(SETUP_ID_KEY, setupId.trim());
}

export function readWizardSubject(): string {
  return safeSessionGet(SUBJECT_KEY)?.trim() ?? '';
}

export function writeWizardSubject(subject: string): void {
  safeSessionSet(SUBJECT_KEY, subject.trim());
}

export function readWizardEmailFormId(): string | null {
  return safeSessionGet(EMAIL_FORM_ID_KEY)?.trim() || null;
}

export function writeWizardEmailFormId(id: string | null): void {
  if (!id?.trim()) {
    safeSessionRemove(EMAIL_FORM_ID_KEY);
    return;
  }
  safeSessionSet(EMAIL_FORM_ID_KEY, id.trim());
}

export function readWizardTableRows(): DistributionTableRow[] | null {
  const raw = safeSessionGet(TABLE_ROWS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DistributionTableRow[];
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

export function writeWizardTableRows(rows: DistributionTableRow[]): void {
  safeSessionSet(TABLE_ROWS_KEY, JSON.stringify(rows));
}

export function readWizardPublished(): boolean {
  return safeSessionGet(PUBLISHED_KEY) === '1';
}

export function writeWizardPublished(published: boolean): void {
  if (published) safeSessionSet(PUBLISHED_KEY, '1');
  else safeSessionRemove(PUBLISHED_KEY);
}

export function clearWizardDraft(): void {
  safeSessionRemove(WEBSITE_KEY);
  safeSessionRemove(METHOD_KEY);
  safeSessionRemove(SETUP_ID_KEY);
  safeSessionRemove(SUBJECT_KEY);
  safeSessionRemove(EMAIL_FORM_ID_KEY);
  safeSessionRemove(TABLE_ROWS_KEY);
  safeSessionRemove(PUBLISHED_KEY);
}

/** Map API method to wizard selection (CRM is shown but not selectable yet). */
export function methodFromDetailApi(raw: string | undefined | null): DistributionWizardMethod | null {
  return methodFromApiValue(raw);
}
