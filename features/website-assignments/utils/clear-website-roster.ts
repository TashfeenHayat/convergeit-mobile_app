import { clearWebsiteRoster } from "@/api";

export async function clearAllDepartmentRosters(websiteId: string): Promise<void> {
  await clearWebsiteRoster(websiteId);
}
