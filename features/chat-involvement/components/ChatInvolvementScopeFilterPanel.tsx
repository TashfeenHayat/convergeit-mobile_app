import { ChatScopeFiltersPanel } from "@/features/chat-shared";
import type { ChatScopeFilterState } from "@/features/chat-shared";

interface ChatInvolvementScopeFilterPanelProps {
  filters: ChatScopeFilterState;
  onPatch: (patch: Partial<ChatScopeFilterState>) => void;
  canFilterByResellerId: boolean;
  resellerOptions: Array<{ value: string; label: string }>;
  parentCompanyOptions: Array<{ value: string; label: string }>;
  childCompanyOptions: Array<{ value: string; label: string }>;
  websiteOptions: Array<{ value: string; label: string }>;
  hasActiveFilters: boolean;
  onClearAll: () => void;
  onClose?: () => void;
}

/** Table-only scope filters for the involvement workspace (website, parent,
 * child, reseller when applicable). Independent from the Add modal's own
 * website picker. */
export function ChatInvolvementScopeFilterPanel({
  filters,
  onPatch,
  canFilterByResellerId,
  resellerOptions,
  parentCompanyOptions,
  childCompanyOptions,
  websiteOptions,
  onClearAll,
}: ChatInvolvementScopeFilterPanelProps) {
  return (
    <ChatScopeFiltersPanel
      filters={filters}
      onPatch={onPatch}
      onReset={onClearAll}
      canFilterByResellerId={canFilterByResellerId}
      resellerOptions={resellerOptions}
      parentCompanyOptions={parentCompanyOptions}
      childCompanyOptions={childCompanyOptions}
      websiteOptions={websiteOptions}
      hint="Filters this list only — does not affect Add actions."
    />
  );
}
