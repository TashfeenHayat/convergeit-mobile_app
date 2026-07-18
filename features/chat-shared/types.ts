export type ChatScopeFilterState = {
  resellerId: string;
  parentCompanyId: string;
  childCompanyId: string;
  websiteId: string;
  departmentId: string;
  poolId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
};

export const emptyChatScopeFilters = (): ChatScopeFilterState => ({
  resellerId: "",
  parentCompanyId: "",
  childCompanyId: "",
  websiteId: "",
  departmentId: "",
  poolId: "",
  status: "",
  dateFrom: "",
  dateTo: "",
});
