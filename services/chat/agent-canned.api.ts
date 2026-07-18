import { getAccessToken } from "@/api";
import { fetchAgentCannedResponses as fetchAgentCannedFromApi } from "./canned-responses.api";
import type { CannedResponseItem } from "./canned-responses.types";

/** Agent inbox quick replies for the active conversation website. */
export async function fetchAgentCannedResponses(
  websiteId: string,
  _departmentId?: string | null,
  token?: string,
): Promise<
  Array<{
    id: string;
    websiteId: string;
    departmentId: string;
    title: string;
    body: string;
    sortOrder: number;
  }>
> {
  const auth = token ?? getAccessToken() ?? "";
  const items: CannedResponseItem[] = await fetchAgentCannedFromApi(websiteId, auth);
  return items.map((item, index) => ({
    id: item.id ?? `${websiteId}-${index}`,
    websiteId,
    departmentId: "",
    title: item.title,
    body: item.body,
    sortOrder: item.sortOrder ?? index,
  }));
}
