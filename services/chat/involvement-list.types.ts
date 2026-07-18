export type ChatScopeListQuery = {
  all?: boolean;
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
  websiteId?: string;
  search?: string;
};

export type InvolvementWebsiteContext = {
  websiteId: string;
  websiteName: string | null;
  websiteUrl: string;
  childCompanyId: string;
  childCompanyName: string;
  parentCompanyId: string;
  parentCompanyName: string;
  resellerId: string;
  resellerName: string;
};

export type InvolvementListRow = {
  id: string;
  websiteId: string;
  departmentId: string;
  userId: string;
  sortOrder: number;
  departmentName: string;
  departmentType: string;
  user: {
    id: string;
    email: string;
    name: string;
    userType: string;
  };
  website: InvolvementWebsiteContext;
};
