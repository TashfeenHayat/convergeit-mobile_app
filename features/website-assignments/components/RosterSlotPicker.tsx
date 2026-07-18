import type { WebsiteAssignmentTier } from '@/api/types/website-assignments.types';

export type SlotDraft = Record<WebsiteAssignmentTier, string[]>;

export function emptySlotDraft(): SlotDraft {
  return { Primary: [], Secondary: [], Backup: [] };
}
