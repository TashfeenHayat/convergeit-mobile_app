export type AssignWebsitePreset = {
  websiteId: string;
  parentCompanyId: string;
  childCompanyId?: string;
  resellerId?: string;
};

export type PickWebsitePreset = AssignWebsitePreset;
