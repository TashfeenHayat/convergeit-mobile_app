export type InternalSupervisorListQuery = {
  all?: boolean;
  resellerId?: string;
  parentCompanyId?: string;
  search?: string;
};

export type InternalSupervisorListRow = {
  id: string;
  parentCompanyId: string;
  userId: string;
  poolId: string;
  sortOrder: number;
  poolName: string;
  departmentName: string;
  user: {
    id: string;
    email: string;
    name: string;
    userType: string;
  };
  parentCompany: {
    parentCompanyId: string;
    parentCompanyName: string;
    resellerId: string;
    resellerName: string;
  };
};
