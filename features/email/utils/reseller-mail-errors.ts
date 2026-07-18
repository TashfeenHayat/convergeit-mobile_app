import { isAxiosError } from "axios";
import { extractApiErrorMessageForToast } from "@/lib/notify";

const PLATFORM_MAIL_CONFLICT_HINT =
  "This reseller uses platform mail. Remove the platform mail assignment first, or configure mail on the Use platform mail screen.";

export function isResellerOwnMailPlatformConflict(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  if (error.response?.status !== 400) return false;
  const msg = (extractApiErrorMessageForToast(error) ?? "").toLowerCase();
  return (
    msg.includes("platform mail") ||
    msg.includes("platform-mail") ||
    msg.includes("useplatformmail") ||
    msg.includes("assignment")
  );
}

export function resellerOwnMailErrorMessage(error: unknown): string {
  if (isResellerOwnMailPlatformConflict(error)) {
    return PLATFORM_MAIL_CONFLICT_HINT;
  }
  return extractApiErrorMessageForToast(error) ?? "Could not load reseller mail settings.";
}
