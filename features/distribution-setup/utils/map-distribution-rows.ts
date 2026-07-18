import type {

  DistributionDepartmentInput,

  DistributionSetupDetail,

} from "@/api/distribution/distribution-setup.api";



export type DistributionTableRow = {

  id: string;

  department: string;

  to: string;

  cc: string;

  bcc: string;

  isDraft?: boolean;

};



function joinEmails(emails: string[]): string {

  return emails.filter(Boolean).join(", ");

}



function emailsForRole(

  recipients: DistributionSetupDetail["departments"][0]["recipients"],

  role: string,

): string[] {

  return recipients

    .filter((r) => r.role.toUpperCase() === role)

    .sort((a, b) => a.sortOrder - b.sortOrder)

    .map((r) => r.email);

}



export function detailToTableRows(detail: DistributionSetupDetail): DistributionTableRow[] {

  if (detail.departments.length === 0) {

    return [createDraftRow()];

  }

  return detail.departments.map((dept) => ({

    id: dept.id,

    department: dept.name,

    to: joinEmails(emailsForRole(dept.recipients, "TO")),

    cc: joinEmails(emailsForRole(dept.recipients, "CC")),

    bcc: joinEmails(emailsForRole(dept.recipients, "BCC")),

    isDraft: false,

  }));

}



export function createDraftRow(): DistributionTableRow {

  const draftId =

    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"

      ? crypto.randomUUID()

      : String(Date.now());

  return {

    id: `draft-${draftId}`,

    department: "",

    to: "",

    cc: "",

    bcc: "",

    isDraft: true,

  };

}



function splitEmails(value: string): string[] {

  return value

    .split(/[,;]+/)

    .map((s) => s.trim())

    .filter(Boolean);

}



export function tableRowsToDepartments(rows: DistributionTableRow[]): DistributionDepartmentInput[] {

  const committed = rows.filter((r) => !r.isDraft && r.department.trim());

  return committed.map((row, index) => {

    const recipients: DistributionDepartmentInput["recipients"] = [];

    let order = 0;

    for (const email of splitEmails(row.to)) {

      recipients.push({ role: "TO", email, sortOrder: order++ });

    }

    for (const email of splitEmails(row.cc)) {

      recipients.push({ role: "CC", email, sortOrder: order++ });

    }

    for (const email of splitEmails(row.bcc)) {

      recipients.push({ role: "BCC", email, sortOrder: order++ });

    }

    return {

      name: row.department.trim(),

      sortOrder: index * 10,

      recipients,

    };

  });

}



export function draftRowHasData(row: DistributionTableRow): boolean {

  return [row.department, row.to, row.cc, row.bcc].some((s) => String(s).trim() !== "");

}


