import { isRecord, type UnknownRecord } from "../core/records";

/** GET /hrms/shifts/:id payloads may nest `data`, `shift`, or both. Flattens to the shift attributes object. */
export function resolveShiftDetailObject(payload: unknown): UnknownRecord | null {
  let cur: unknown = payload;
  for (let i = 0; i < 8; i++) {
    if (!isRecord(cur)) return null;
    const dataNest = cur["data"];
    if (isRecord(dataNest)) {
      cur = dataNest;
      continue;
    }
    const shiftNest = cur["shift"];
    if (isRecord(shiftNest)) {
      cur = shiftNest;
      continue;
    }
    break;
  }
  return isRecord(cur) ? cur : null;
}
