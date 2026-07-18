import type {
  ChannelRosterSlotsBody,
  PutDepartmentRosterBody,
  ServiceChannel,
  WebsiteAssignmentChannelRoster,
  WebsiteAssignmentTier,
} from "@/api/types/website-assignments.types";
import type { SlotDraft } from "../components/RosterSlotPicker";
import { emptySlotDraft } from "../components/RosterSlotPicker";

export const ROSTER_TIERS: WebsiteAssignmentTier[] = ["Primary", "Secondary", "Backup"];

const TIER_TO_ROSTER_KEY: Record<
  WebsiteAssignmentTier,
  keyof WebsiteAssignmentChannelRoster
> = {
  Primary: "primary",
  Secondary: "secondary",
  Backup: "backup",
};

export function slotsFromRoster(
  roster: WebsiteAssignmentChannelRoster,
): SlotDraft {
  const draft = emptySlotDraft();
  for (const tier of ROSTER_TIERS) {
    const key = TIER_TO_ROSTER_KEY[tier];
    draft[tier] = roster[key].map((u) => u.userId);
  }
  return draft;
}

export function draftToChannelBody(draft: SlotDraft): ChannelRosterSlotsBody {
  return {
    Primary: [...draft.Primary],
    Secondary: [...draft.Secondary],
    Backup: [...draft.Backup],
  };
}

export function buildDepartmentPutBody(args: {
  showInternal: boolean;
  showExternal: boolean;
  internalDraft: SlotDraft;
  externalDraft: SlotDraft;
}): PutDepartmentRosterBody {
  const body: PutDepartmentRosterBody = {};
  if (args.showInternal) body.internal = draftToChannelBody(args.internalDraft);
  if (args.showExternal) body.external = draftToChannelBody(args.externalDraft);
  return body;
}

export function tierListsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, i) => id === sortedB[i]);
}

export function rosterDraftHasChanges(
  internalDraft: SlotDraft,
  externalDraft: SlotDraft,
  internalBaseline: SlotDraft,
  externalBaseline: SlotDraft,
): boolean {
  for (const tier of ROSTER_TIERS) {
    if (!tierListsEqual(internalDraft[tier], internalBaseline[tier])) return true;
    if (!tierListsEqual(externalDraft[tier], externalBaseline[tier])) return true;
  }
  return false;
}

export function clearChannelDraft(_channel: ServiceChannel): SlotDraft {
  return emptySlotDraft();
}

export function toggleTierUser(
  draft: SlotDraft,
  tier: WebsiteAssignmentTier,
  userId: string,
): SlotDraft {
  const next: SlotDraft = {
    Primary: [...draft.Primary],
    Secondary: [...draft.Secondary],
    Backup: [...draft.Backup],
  };
  const current = next[tier];
  if (current.includes(userId)) {
    next[tier] = current.filter((id) => id !== userId);
    return next;
  }
  for (const t of ROSTER_TIERS) {
    if (t !== tier) {
      next[t] = next[t].filter((id) => id !== userId);
    }
  }
  next[tier] = [...current, userId];
  return next;
}

export function isUserInTier(draft: SlotDraft, tier: WebsiteAssignmentTier, userId: string): boolean {
  return draft[tier].includes(userId);
}

export function isUserInOtherTier(
  draft: SlotDraft,
  tier: WebsiteAssignmentTier,
  userId: string,
): boolean {
  for (const t of ROSTER_TIERS) {
    if (t !== tier && draft[t].includes(userId)) return true;
  }
  return false;
}

export function isUserSelectedInDraft(draft: SlotDraft, userId: string): boolean {
  return ROSTER_TIERS.some((tier) => draft[tier].includes(userId));
}
