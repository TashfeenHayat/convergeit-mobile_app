import {
  QA_REVIEW_STATUSES,
  type QaReviewStatus,
  type UpsertQaSessionReviewBody,
} from "@/services/chat/qa.types";

export const QA_SESSION_CHECKLIST_KEYS = [
  { key: "professionalTone", label: "Professional tone" },
  { key: "accurateInfo", label: "Accurate information" },
  { key: "policyCompliance", label: "Policy compliance" },
  { key: "timelyResponse", label: "Timely responses" },
] as const;

export { QA_REVIEW_STATUSES };

export function readQaChecklist(json?: Record<string, unknown> | null): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const item of QA_SESSION_CHECKLIST_KEYS) {
    out[item.key] = json?.[item.key] === true;
  }
  return out;
}

export function buildQaSessionReviewBody(
  status: QaReviewStatus,
  fields: {
    starRating: number | null;
    failureReason: string;
    overallScore: number;
    summary: string;
    coachingNotes: string;
    checklist: Record<string, boolean>;
    meaningfulChat: boolean;
  },
): UpsertQaSessionReviewBody {
  const checklistJson: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields.checklist)) {
    if (v) checklistJson[k] = true;
  }
  return {
    status,
    starRating: fields.starRating ?? undefined,
    failureReason: fields.failureReason.trim() || undefined,
    overallScore: fields.overallScore,
    summary: fields.summary.trim() || undefined,
    coachingNotes: fields.coachingNotes.trim() || undefined,
    checklistJson,
    ...(status === "completed" ? { meaningfulChat: fields.meaningfulChat } : {}),
  };
}
