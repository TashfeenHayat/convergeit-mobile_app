export interface CannedResponseItem {
  id?: string;
  title: string;
  body: string;
  sortOrder?: number;
}

export interface CannedResponseListRow extends Record<string, unknown> {
  id: string;
  websiteId: string;
  title: string;
  body: string;
  sortOrder: number;
  websiteName?: string;
  websiteUrl?: string;
  resellerName?: string;
  childCompanyName?: string;
  parentCompanyName?: string;
  resellerId?: string;
  childCompanyId?: string;
  parentCompanyId?: string;
}

export interface WebsiteCannedResponsesBundle {
  websiteId: string;
  websiteName?: string;
  websiteUrl?: string;
  resellerName?: string;
  childCompanyName?: string;
  parentCompanyName?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
  resellerId?: string;
  items: CannedResponseItem[];
}

export interface ListCannedResponsesQuery {
  all?: boolean;
  resellerId?: string;
  childCompanyId?: string;
  parentCompanyId?: string;
  websiteId?: string;
  search?: string;
}

export interface ReplaceWebsiteCannedBody {
  items: Array<{ title: string; body: string; sortOrder?: number }>;
}
