import type { ApiEnvelope } from "./auth.types";

export interface CompanyResellerSummary {
  id: string;
  name: string;
}

export interface CompanyParentSummary {
  id: string;
  name: string;
  resellerId: string;
  reseller: CompanyResellerSummary;
}

export type CompanyType = "parent" | "child";

export interface CompanyListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  parentCompanyId: string | null;
  createdAt: string;
  updatedAt: string;
  parentCompany: CompanyParentSummary | null;
  companyType: CompanyType;
}

export interface PaginatedCompaniesData {
  items: CompanyListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CompanyTreeChild {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  parentCompanyId: string;
  createdAt: string;
  updatedAt: string;
  parentCompany: CompanyParentSummary;
}

export interface CompanyTreeParent {
  id: string;
  name: string;
  childCompanies: CompanyTreeChild[];
}

export interface CompanyTreeItem {
  reseller: CompanyResellerSummary;
  parentCompanies: CompanyTreeParent[];
}

export interface PaginatedCompaniesTreeData {
  view: "tree";
  items: CompanyTreeItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  meta: {
    resellerCount: number;
    parentCompanyCount: number;
    childCompanyCount: number;
    companyRowCount: number;
  };
}

export type CompaniesData = PaginatedCompaniesData | PaginatedCompaniesTreeData;

export type CompaniesListResponseEnvelope = ApiEnvelope<CompaniesData>;

/** `GET /companies/parent/:parentId` — edit existing company (not setup draft). */
export interface ParentCompanyDetailReseller {
  id: string;
  name: string;
}

/** POC payload aligned with draft `pocInvite` (legacy / setup flows). */
export interface CompanyPocInviteSummary {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  /** API may use `pocEmail` or `email`. */
  pocEmail?: string | null;
  email?: string | null;
  roleId?: string | null;
  departmentName?: string | null;
  departmentDetails?: string | null;
  designationTitle?: string | null;
  designationDetails?: string | null;
  /** External-user invite: allow access across reseller hierarchy when API supports it. */
  wideResellerScope?: boolean | null;
}

/** Linked user on `GET /companies/parent/:id` → `children[].pocs[]`. */
export interface CompanyPocUserSummary {
  id: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNo?: string | null;
}

/** Company contact row with nested `user` (actual API shape for parent detail children). */
export interface CompanyContactPoc {
  companyContactId: string;
  childCompanyId: string;
  parentCompanyId: string;
  resellerId: string;
  user: CompanyPocUserSummary;
}

export interface ParentCompanyDetailNode {
  id: string;
  name: string;
  resellerId?: string;
  createdAt?: string;
  updatedAt?: string;
  reseller: ParentCompanyDetailReseller;
  pocInvite?: CompanyPocInviteSummary | null;
  /** Rare; same shape as children `pocs` when present. */
  pocs?: CompanyContactPoc[] | null;
}

/** Nested parent on each child in GET parent detail (matches API). */
export interface ParentCompanyChildNestedParent {
  id: string;
  name: string;
  resellerId: string;
  reseller: ParentCompanyDetailReseller;
}

/** Optional website payload on child company (`GET/PATCH /companies/...`). */
export interface ParentCompanyChildWebsiteSnippet {
  id?: string;
  websiteId?: string;
  url?: string | null;
  name?: string | null;
}

export interface ParentCompanyChildDetail {
  id: string;
  name: string;
  email: string;
  /** Some GET payloads mirror PATCH field name. */
  companyEmail?: string | null;
  phone: string;
  address: string;
  parentCompanyId?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Nested parent summary (GET `/companies/parent/:id`). */
  parentCompany?: ParentCompanyChildNestedParent;
  resellerId?: string;
  /** Same as `id` when API sends both. */
  childCompanyId?: string;
  /** Singular website link on child (common on PATCH body mirror). */
  website?: ParentCompanyChildWebsiteSnippet | null;
  /** Some APIs return multiple site rows on the child. */
  websites?: ParentCompanyChildWebsiteSnippet[] | null;
  pocInvite?: CompanyPocInviteSummary | null;
  /** Company contacts with nested `user` (actual API shape). */
  pocs?: CompanyContactPoc[] | null;
}

export interface ParentCompanyDetailPayload {
  parentCompany: ParentCompanyDetailNode;
  children: ParentCompanyChildDetail[];
  counts?: {
    children?: number;
  };
}

export type ParentCompanyDetailEnvelope = ApiEnvelope<ParentCompanyDetailPayload>;

export interface WebsiteDirectoryPoc {
  userId: string;
  name: string;
  email: string;
}

export interface WebsiteDirectoryItem {
  websiteId: string;
  url: string;
  name: string;
  createdAt: string;
  resellerId: string;
  resellerName: string;
  parentCompanyId: string;
  parentCompanyName: string;
  childCompanyId: string;
  childCompanyName: string;
  pocs: WebsiteDirectoryPoc[];
  createdByUserId: string;
  createdByName: string;
  createdByEmail: string;
  createdByRoleId: string | null;
  createdByRoleName: string;
  createdByUserType: string;
}

export interface WebsiteDirectoryData {
  items: WebsiteDirectoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type WebsiteDirectoryResponseEnvelope = ApiEnvelope<WebsiteDirectoryData>;
