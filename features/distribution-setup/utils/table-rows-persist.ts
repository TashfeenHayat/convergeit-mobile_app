import type { DistributionDepartmentInput } from "@/api/distribution/distribution-setup.api";
import type { DistributionTableRow } from "./map-distribution-rows";
import { draftRowHasData } from "./map-distribution-rows";

/** Rows to send on save — includes in-progress draft rows that have enough data. */
export function tableRowsToDepartmentsForSave(
  rows: DistributionTableRow[],
): DistributionDepartmentInput[] {
  const eligible = rows.filter(
    (r) => r.department.trim() && (draftRowHasData(r) || !r.isDraft),
  );

  return eligible
    .filter((row) => {
      const hasRecipient = [row.to, row.cc, row.bcc].some((s) => String(s).trim());
      return hasRecipient;
    })
    .map((row, index) => {
      const recipients: DistributionDepartmentInput["recipients"] = [];
      let order = 0;
      const split = (value: string) =>
        value
          .split(/[,;]+/)
          .map((s) => s.trim())
          .filter(Boolean);
      for (const email of split(row.to)) {
        recipients.push({ role: "TO", email, sortOrder: order++ });
      }
      for (const email of split(row.cc)) {
        recipients.push({ role: "CC", email, sortOrder: order++ });
      }
      for (const email of split(row.bcc)) {
        recipients.push({ role: "BCC", email, sortOrder: order++ });
      }
      return {
        name: row.department.trim(),
        sortOrder: index * 10,
        recipients,
      };
    });
}
