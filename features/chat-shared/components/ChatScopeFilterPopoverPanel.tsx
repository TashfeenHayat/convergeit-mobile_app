import { StyleSheet, View } from "react-native";
import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { ChatScopeFilterState } from "../types";
import { ScopeSelectField } from "./ScopeSelectField";

export type ChatScopeFilterPopoverPanelProps = {
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
  showDateRange?: boolean;
  departmentOptions?: Array<{ value: string; label: string }>;
  poolOptions?: Array<{ value: string; label: string }>;
  statusOptions?: Array<{ value: string; label: string }>;
  hasActiveFilters: boolean;
  onClose: () => void;
  title?: string;
  hint?: string;
};

/** Scope filters inside a filter sheet — stacked selects + pinned Reset/Done row. */
export function ChatScopeFilterPopoverPanel({
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
  hasActiveFilters,
  onClose,
  title = "Scope filters",
  hint,
}: ChatScopeFilterPopoverPanelProps) {
  return (
    <View>
      <Typography variant="label" style={{ fontWeight: "600" }}>
        {title}
      </Typography>
      {hint ? (
        <Typography variant="small" muted style={{ marginTop: 2, marginBottom: tokens.space.md, lineHeight: 17 }}>
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
        <ScopeSelectField
          label="Website"
          value={filters.websiteId}
          onChange={(v) => onPatch({ websiteId: v })}
          options={websiteOptions}
          searchPlaceholder="Search website…"
        />
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
        <Button variant="secondary" size="compact" disabled={!hasActiveFilters} onPress={onReset}>
          Reset
        </Button>
        <Button variant="primary" size="compact" onPress={onClose}>
          Done
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
    gap: tokens.space.sm,
    marginTop: tokens.space.lg,
  },
});
