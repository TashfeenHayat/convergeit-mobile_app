import type { WebsiteAssignmentDetail } from "@/api/types/website-assignments.types";
import type { MonitorDirectoryAgentRow } from "@/services/chat/monitor.types";

export type ChatWebsiteAgentRow = {
  rowKey: string;
  userId: string;
  displayName: string;
  email: string;
  userType: string;
  departmentId: string;
  departmentName: string;
  departmentType: string;
  serviceChannel: string;
  assignmentTier: string;
  liveCount: number;
  kind: "roster" | "involvement";
};

export function flattenAgentsFromWebsiteDetail(
  detail: WebsiteAssignmentDetail | null | undefined,
): ChatWebsiteAgentRow[] {
  if (!detail) return [];
  const out: ChatWebsiteAgentRow[] = [];
  const seen = new Set<string>();

  for (const dept of detail.departmentRoster ?? []) {
    for (const channel of ["internal", "external"] as const) {
      const roster = channel === "internal" ? dept.roster.internal : dept.roster.external;
      for (const tier of ["primary", "secondary", "backup"] as const) {
        const slots = roster[tier] ?? [];
        for (const slot of slots) {
          if (!slot.userId) continue;
          const serviceChannel = channel === "internal" ? "Internal" : "External";
          const rowKey = `${slot.userId}:${dept.departmentId}:${serviceChannel}:${tier}`;
          if (seen.has(rowKey)) continue;
          seen.add(rowKey);
          out.push({
            rowKey,
            userId: slot.userId,
            displayName: slot.name || slot.email || slot.userId.slice(0, 8),
            email: slot.email ?? "",
            userType: slot.userType ?? serviceChannel,
            departmentId: dept.departmentId,
            departmentName: dept.departmentName,
            departmentType: dept.departmentType,
            serviceChannel,
            assignmentTier: tier.charAt(0).toUpperCase() + tier.slice(1),
            liveCount: 0,
            kind: "roster",
          });
        }
      }
    }
  }

  for (const raw of detail.assignments ?? []) {
    if (!raw || typeof raw !== "object") continue;
    const a = raw as Record<string, unknown>;
    const u = a.user as Record<string, unknown> | undefined;
    const userId = String(u?.id ?? a.userId ?? "").trim();
    if (!userId) continue;
    const departmentId = String(a.departmentId ?? "").trim();
    const serviceChannel = String(a.serviceChannel ?? "Internal");
    const rowKey = `${userId}:${departmentId}:${serviceChannel}:slot`;
    if (seen.has(rowKey)) continue;
    seen.add(rowKey);
    out.push({
      rowKey,
      userId,
      displayName: String(u?.name ?? userId.slice(0, 8)),
      email: String(u?.email ?? ""),
      userType: String(u?.userType ?? ""),
      departmentId,
      departmentName: String(a.departmentName ?? departmentId),
      departmentType: "",
      serviceChannel,
      assignmentTier: String(a.assignmentType ?? "—"),
      liveCount: 0,
      kind: "roster",
    });
  }

  return out.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function mergeMonitorAgentRows(
  monitorRows: MonitorDirectoryAgentRow[],
  websiteId: string,
): ChatWebsiteAgentRow[] {
  return monitorRows
    .filter((r) => !websiteId || r.websiteId === websiteId)
    .map((r) => ({
      rowKey: `${r.kind}:${r.userId}:${r.websiteId ?? ""}:${r.departmentId ?? ""}`,
      userId: r.userId,
      displayName: r.displayName,
      email: r.email,
      userType: r.userType,
      departmentId: r.departmentId ?? "",
      departmentName: r.departmentName ?? "—",
      departmentType: r.departmentType ?? "",
      serviceChannel: r.serviceChannel ?? "—",
      assignmentTier: r.kind === "involvement" ? "Involvement" : "Roster",
      liveCount: r.liveCount ?? 0,
      kind: r.kind,
    }));
}

export function filterChatWebsiteAgentRows(
  rows: ChatWebsiteAgentRow[],
  opts: {
    departmentId?: string;
    poolId?: string;
    search?: string;
    userIdsInPool?: Set<string>;
  },
): ChatWebsiteAgentRow[] {
  let list = rows;
  const deptId = opts.departmentId?.trim();
  if (deptId) {
    list = list.filter((r) => r.departmentId === deptId);
  }
  if (opts.poolId?.trim() && opts.userIdsInPool?.size) {
    list = list.filter((r) => opts.userIdsInPool!.has(r.userId));
  }
  const q = opts.search?.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (r) =>
        r.displayName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.departmentName.toLowerCase().includes(q),
    );
  }
  return list;
}
