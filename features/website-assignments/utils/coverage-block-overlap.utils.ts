import type { CoverageBlockDraft } from "./coverage-block-draft.utils";
import { ROSTER_TIERS } from "./roster-draft.utils";
import {
  coerceTimeHm24,
  formatHm12Label,
  parseHmMinutes24,
} from "./schedule-time.utils";

function safeLabel(raw: unknown, fallback: string): string {
  if (typeof raw === "string") return raw.trim() || fallback;
  return fallback;
}

function blocksShareDay(a: CoverageBlockDraft, b: CoverageBlockDraft): boolean {
  return a.daysOfWeek.some((d) => b.daysOfWeek.includes(d));
}

/** Half-open intervals [start, end) overlap on the same calendar day. */
function minutesOverlap(
  startA: number,
  endA: number,
  crossesA: boolean,
  startB: number,
  endB: number,
  crossesB: boolean,
): boolean {
  if (crossesA || crossesB) {
    return startA !== endB || startB !== endA;
  }
  if (endA <= startA || endB <= startB) {
    return true;
  }
  return startA < endB && startB < endA;
}

/** True when two blocks can be active at the same clock time. */
export function coverageBlocksOverlap(
  a: CoverageBlockDraft,
  b: CoverageBlockDraft,
): boolean {
  if (!blocksShareDay(a, b)) return false;
  const startA = parseHmMinutes24(a.startTime);
  const endA = parseHmMinutes24(a.endTime);
  const startB = parseHmMinutes24(b.startTime);
  const endB = parseHmMinutes24(b.endTime);
  if (startA == null || endA == null || startB == null || endB == null) return false;
  return minutesOverlap(startA, endA, a.crossesMidnight, startB, endB, b.crossesMidnight);
}

/** Users already rostered on overlapping blocks — hide from this block's picker. */
export function blockedUsersFromOtherBlocks(
  blocks: CoverageBlockDraft[],
  currentIndex: number,
): Map<string, string> {
  const current = blocks[currentIndex];
  if (!current) return new Map();

  const blocked = new Map<string, string>();
  for (let i = 0; i < blocks.length; i++) {
    if (i === currentIndex) continue;
    const other = blocks[i]!;
    if (!coverageBlocksOverlap(current, other)) continue;

    const otherLabel = safeLabel(other.label, `Period ${i + 1}`);
    const window = `${formatHm12Label(other.startTime)} – ${formatHm12Label(other.endTime)}`;
    for (const tier of ROSTER_TIERS) {
      for (const rawId of other.roster[tier]) {
        const userId = rawId.trim();
        if (!userId || blocked.has(userId)) continue;
        blocked.set(
          userId,
          `On duty in ${otherLabel} (${window}) — available again after that period ends.`,
        );
      }
    }
  }
  return blocked;
}

export function formatBlockPeriodLabel(block: CoverageBlockDraft, index: number): string {
  return safeLabel(block.label, `Period ${index + 1}`);
}

export function normalizeCoverageBlockDraft(block: CoverageBlockDraft): CoverageBlockDraft {
  const startTime = coerceTimeHm24(block.startTime);
  const endTime = coerceTimeHm24(block.endTime, "17:00");
  return {
    ...block,
    startTime,
    endTime,
    label: typeof block.label === "string" ? block.label : `Period ${block.sortOrder + 1}`,
    crossesMidnight: block.crossesMidnight || endTime < startTime,
  };
}
