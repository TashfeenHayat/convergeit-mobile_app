import { StyleSheet, View } from "react-native";
import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { ChatScopeFilterState } from "../types";
import { ScopeSelectField } from "./ScopeSelectField";

interface ChatScopeFiltersPanelProps {
  filters: ChatScopeFilterState;
  onPatch: (patch: Partial<ChatScopeFilterState>) => void;
  onReset: () => void;
  canFilterByResellerId: boolean;
  resellerOptions: Array<{ value: string; label: string }>;
  parentCompanyOptions: Array<{ value: string; label: string }>;
  childCompanyOptions: Array<{ value: string; label: string }>;
  websiteOptions: Array<{ value: string; label: string }>;
  showDepartment?: boolean;
  showPool?: boolean;
  showStatus?: boolean;
  departmentOptions?: Array<{ value: string; label: string }>;
  poolOptions?: Array<{ value: string; label: string }>;
  statusOptions?: Array<{ value: string; label: string }>;
  hint?: string;
  /** Slim layout for settings screens (no caption hint). */
  compact?: boolean;
  /** Hide website picker (e.g. global QA policy applies to all sites in org scope). */
  hideWebsiteFilter?: boolean;
}

/** Inline (non-sheet) scope filters — settings / involvement / reports screens. */
export function ChatScopeFiltersPanel({
  filters,
  onPatch,
  onReset,
  canFilterByResellerId,
  resellerOptions,
  parentCompanyOptions,
  childCompanyOptions,
  websiteOptions,
  showDepartment = false,
  showPool = false,
  showStatus = false,
  departmentOptions = [{ value: "", label: "All departments" }],
  poolOptions = [{ value: "", label: "All pools" }],
  statusOptions = [{ value: "", label: "All statuses" }],
  hint,
  compact = false,
  hideWebsiteFilter = false,
}: ChatScopeFiltersPanelProps) {
  return (
    <View>
      {hint && !compact ? (
        <Typography variant="small" muted style={{ marginBottom: tokens.space.sm }}>
          {hint}
        </Typography>
      ) : null}
      <View style={styles.grid}>
        {canFilterByResellerId ? (
          <ScopeSelectField
            label="Reseller"
            value={filters.resellerId}
            onChange={(v) => onPatch({ resellerId: v })}
            options={resellerOptions}
          />
        ) : null}
        <ScopeSelectField
          label="Parent company"
          value={filters.parentCompanyId}
          onChange={(v) => onPatch({ parentCompanyId: v })}
          options={parentCompanyOptions}
          disabled={canFilterByResellerId && !filters.resellerId.trim()}
        />
        <ScopeSelectField
          label="Child company"
          value={filters.childCompanyId}
          onChange={(v) => onPatch({ childCompanyId: v })}
          options={childCompanyOptions}
          disabled={!filters.parentCompanyId.trim()}
        />
        {hideWebsiteFilter ? null : (
          <ScopeSelectField
            label="Website"
            value={filters.websiteId}
            onChange={(v) => onPatch({ websiteId: v })}
            options={websiteOptions}
          />
        )}
        {showDepartment ? (
          <ScopeSelectField
            label="Department"
            value={filters.departmentId}
            onChange={(v) => onPatch({ departmentId: v })}
            options={departmentOptions}
          />
        ) : null}
        {showPool ? (
          <ScopeSelectField
            label="Pool"
            value={filters.poolId}
            onChange={(v) => onPatch({ poolId: v })}
            options={poolOptions}
          />
        ) : null}
        {showStatus ? (
          <ScopeSelectField
            label="Status"
            value={filters.status}
            onChange={(v) => onPatch({ status: v })}
            options={statusOptions}
          />
        ) : null}
      </View>
      <View style={styles.footer}>
        <Button variant="secondary" size="compact" onPress={onReset}>
          Reset
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: tokens.space.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: tokens.space.md,
  },
});
