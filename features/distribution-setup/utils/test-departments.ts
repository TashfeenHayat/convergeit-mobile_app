import type { DistributionSetupDetail } from "@/api/distribution/distribution-setup.api";
import type { DistributionSetupTestDepartment } from "../components/DistributionSetupTestPanel";
import type { DistributionTableRow } from "./map-distribution-rows";
import { draftRowHasData } from "./map-distribution-rows";

function joinRoleEmails(
  recipients: DistributionSetupDetail["departments"][0]["recipients"],
  role: string,
): string {
  return recipients
    .filter((r) => r.role.toUpperCase() === role)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r) => r.email)
    .join(", ");
}

export function detailToTestDepartments(
  detail: DistributionSetupDetail,
): DistributionSetupTestDepartment[] {
  return detail.departments
    .filter((d) => d.name.trim())
    .map((d) => ({
      name: d.name,
      to: joinRoleEmails(d.recipients, "TO"),
      cc: joinRoleEmails(d.recipients, "CC"),
      bcc: joinRoleEmails(d.recipients, "BCC"),
    }));
}

export function tableRowsToTestDepartments(
  rows: DistributionTableRow[],
): DistributionSetupTestDepartment[] {
  return rows
    .filter((r) => draftRowHasData(r))
    .map((r) => ({
      name: r.department.trim(),
      to: r.to.trim(),
      cc: r.cc.trim(),
      bcc: r.bcc.trim(),
    }));
}
