import { getApiBaseUrl } from "./config";
import type { ApiEnvelope } from "./types/auth.types";

export type PublicDistributionFeedbackFormContext = {
  alreadySubmitted: boolean;
  rating: "good" | "poor";
  thankYouMessage?: string;
  submittedAt?: string;
  settings?: {
    goodLabel: string;
    poorLabel: string;
    poorFormTitle: string;
    poorFormPrompt: string;
    poorReasonOptions: string[];
    poorSubmitLabel: string;
    goodThankYouMessage: string;
  };
  send: {
    id: string;
    subject: string;
    departmentName: string;
    recipientEmail: string;
    recipientRole: string;
    sentAt: string;
    websiteLabel: string;
  };
};

export type PublicDistributionNoteFormContext = {
  alreadySubmitted: boolean;
  thankYouMessage?: string;
  submittedAt?: string;
  note?: string | null;
  settings?: {
    notesPlaceholder: string;
    notesSubmitLabel: string;
    notesRequired: boolean;
    goodThankYouMessage: string;
  };
  send: {
    id: string;
    subject: string;
    departmentName: string;
    recipientEmail: string;
    recipientRole: string;
    sentAt: string;
    websiteLabel: string;
  };
};

export type SubmitDistributionFeedbackBody = {
  token: string;
  rating: "good" | "poor";
  reasonKeys?: string[];
  comment?: string;
};

export type SubmitDistributionNoteBody = {
  token: string;
  note: string;
};

async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json()) as ApiEnvelope<T> & { message?: string };
  if (!res.ok || json.success === false) {
    throw new Error(json.message ?? "Request failed.");
  }
  return json.data as T;
}

export async function getPublicDistributionFeedbackForm(
  token: string,
  rating: "good" | "poor",
): Promise<PublicDistributionFeedbackFormContext> {
  const q = new URLSearchParams({ token, rating });
  return publicFetch<PublicDistributionFeedbackFormContext>(
    `/public/distribution-feedback/form?${q.toString()}`,
  );
}

export async function submitPublicDistributionFeedback(
  body: SubmitDistributionFeedbackBody,
): Promise<{ rating: string; thankYouMessage: string }> {
  return publicFetch(`/public/distribution-feedback/submit`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getPublicDistributionNoteForm(
  token: string,
): Promise<PublicDistributionNoteFormContext> {
  const q = new URLSearchParams({ token });
  return publicFetch<PublicDistributionNoteFormContext>(
    `/public/distribution-feedback/note-form?${q.toString()}`,
  );
}

export async function submitPublicDistributionNote(
  body: SubmitDistributionNoteBody,
): Promise<{ thankYouMessage: string }> {
  return publicFetch(`/public/distribution-feedback/submit-note`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
