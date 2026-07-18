import type { ServiceSchedulingBundle } from "@/services/chat/service-scheduling.types";
import {
  bundleToDraft,
  validateScheduleDraft,
} from "@/features/chat-settings/components/service-scheduling-form.utils";

/** True when service hours and timezone are valid (inquire topics optional). */
export function isServiceSchedulingReady(
  bundle: ServiceSchedulingBundle | null | undefined,
): boolean {
  if (!bundle) return false;
  const draft = bundleToDraft(bundle);
  return validateScheduleDraft(draft) === null;
}
