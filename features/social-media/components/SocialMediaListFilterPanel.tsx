import { View } from "react-native";

import { Button, SelectField } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { WebsiteAssignmentScopeFilterState } from "@/features/website-assignments/hooks/useWebsiteAssignmentScopeFilters";

export const SOCIAL_PLATFORM_FILTER_OPTIONS = [
  { value: "", label: "All platforms" },
  { value: "facebook_messenger", label: "Facebook Messenger" },
  { value: "instagram_dm", label: "Instagram DM" },
] as const;

export type SocialMediaListFilterPanelProps = WebsiteAssignmentScopeFilterState & {
  filterPlatform: string;
  onFilterPlatformChange: (v: string) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
};

export function SocialMediaListFilterPanel({
  canFilterByResellerId,
  filterResellerId,
  setFilterResellerId,
  filterParentCompanyId,
  setFilterParentCompanyId,
  filterChildCompanyId,
  setFilterChildCompanyId,
  resellerFilterOptions,
  parentCompanyFilterOptions,
  childCompanyFilterOptions,
  filterPlatform,
  onFilterPlatformChange,
  hasActiveFilters,
  onClearAll,
}: SocialMediaListFilterPanelProps) {
  return (
    <View style={{ gap: tokens.space.sm }}>
      {canFilterByResellerId ? (
        <SelectField
          label="Client of (reseller)"
          value={filterResellerId}
          onChange={setFilterResellerId}
          options={resellerFilterOptions}
          searchable={false}
        />
      ) : null}
      <SelectField
        label="Parent company"
        value={filterParentCompanyId}
        onChange={setFilterParentCompanyId}
        options={parentCompanyFilterOptions}
        searchable={false}
      />
      <SelectField
        label="Child company"
        value={filterChildCompanyId}
        onChange={setFilterChildCompanyId}
        options={childCompanyFilterOptions}
        searchable={false}
      />
      <SelectField
        label="Platform"
        value={filterPlatform}
        onChange={onFilterPlatformChange}
        options={[...SOCIAL_PLATFORM_FILTER_OPTIONS]}
        searchable={false}
      />
      {hasActiveFilters ? (
        <Button variant="outlined" size="compact" onPress={onClearAll}>
          Clear filters
        </Button>
      ) : null}
    </View>
  );
}
