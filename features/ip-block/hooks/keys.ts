import type { ListIpBlocksParams } from "@/api/ip-block/ip-block.api";

export const ipBlockKeys = {
  all: ["ip-blocks"] as const,
  list: (params: ListIpBlocksParams) => [...ipBlockKeys.all, "list", params] as const,
  detail: (id: string) => [...ipBlockKeys.all, "detail", id] as const,
};
