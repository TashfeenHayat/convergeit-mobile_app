export type PocListRow = {
  companyContactId: string;
  resellerId: string;
  resellerName: string;
  parentCompanyId: string;
  parentCompanyName: string;
  childCompanyId: string;
  childCompanyName: string;
  userId: string;
  pocName: string;
  pocEmail: string;
  designationTitle: string;
  departmentName: string;
};

export type PocChildGroup = {
  id: string;
  name: string;
  contacts: PocListRow[];
};

export type PocParentGroup = {
  id: string;
  name: string;
  children: PocChildGroup[];
  pocCount: number;
};

export type PocResellerGroup = {
  id: string;
  name: string;
  parents: PocParentGroup[];
  parentCount: number;
  childCount: number;
  pocCount: number;
};

export type PocDirectoryTree = {
  resellers: PocResellerGroup[];
  totalPocs: number;
};
