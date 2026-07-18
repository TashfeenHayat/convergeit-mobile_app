import axios from "axios";
import { pickStr } from "../core/api-payload";
import { isRecord } from "../core/records";

/** User-facing message when a paginated HRMS list returns HTTP 403. */
export function hrmsList403UserMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;
  if (error.response?.status !== 403) return null;
  const d = error.response.data;
  if (isRecord(d)) {
    const m = pickStr(d, ["message", "error", "errorMessage"]);
    if (m) return m;
  }
  return "You do not have access to this list, or the selected company or department is outside your allowed scope.";
}
