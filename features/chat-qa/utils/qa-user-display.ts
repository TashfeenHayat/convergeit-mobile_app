import type { QaUserLabel } from "@/services/chat/qa.types";
import { qaUserLabel } from "./qa-labels";

export function qaUserKind(u?: QaUserLabel | null): "Internal" | "External" | null {
  const t = String(u?.userType ?? "").trim();
  if (t === "External") return "External";
  if (t === "Internal") return "Internal";
  return null;
}

export function qaUserDisplay(u?: QaUserLabel | null): string {
  const name = qaUserLabel(u);
  const kind = qaUserKind(u);
  return kind ? `${name} (${kind})` : name;
}

export function takeoverStatusLabel(status?: string | null): string {
  const s = String(status ?? "").trim().toLowerCase();
  if (s === "approved") return "Approved";
  if (s === "rejected" || s === "denied") return "Rejected";
  if (s === "pending") return "Pending";
  if (s === "cancelled" || s === "canceled") return "Cancelled";
  return status?.trim() || "—";
}

export function serviceChannelLabel(channel?: string | null): string {
  const c = String(channel ?? "").trim().toLowerCase();
  if (c === "external") return "External";
  if (c === "internal") return "Internal";
  return channel?.trim() || "—";
}

export function formatTs(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}
