import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button, PermissionDeniedPanel, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useAuth } from "@/lib/auth";
import { canMonitorRoute } from "@/lib/permissions/chat-access";
import { PAGE } from "@/lib/permissions/permission-constants";
import { extractApiErrorMessageForToast, publishAppToast } from "@/lib/notify";
import { useChatMonitor } from "../hooks/useChatMonitor";
import { MonitorQueueSidebar } from "./MonitorQueueSidebar";
import { MonitorTranscriptPanel } from "./MonitorTranscriptPanel";
import { MonitorAssignPanel } from "./MonitorAssignPanel";
import { MonitorSupervisorSidePanel } from "./MonitorSupervisorSidePanel";

export type ChatMonitorWorkspaceProps = {
  initialConversationId?: string | null;
};

/**
 * Mobile-simplified monitor: single-pane master/detail (queue list ↔
 * transcript) instead of web's resizable 3-column layout. Directory
 * drill-down (reseller → parent company → department → pool) is a
 * desktop power feature and is intentionally left out — the queue is
 * scoped server-side by the signed-in supervisor's role.
 */
export function ChatMonitorWorkspace({ initialConversationId = null }: ChatMonitorWorkspaceProps) {
  const { user, hasOperational, hasPage, permissionsSyncing } = useAuth();
  const monitorAllowed = canMonitorRoute(hasPage, hasOperational);

  const monitor = useChatMonitor(initialConversationId, { apiEnabled: monitorAllowed });
  const [assignOpen, setAssignOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  if (permissionsSyncing) {
    return (
      <View style={styles.centerWrap}>
        <Typography variant="medium" muted>
          Loading permissions…
        </Typography>
      </View>
    );
  }

  if (!monitorAllowed) {
    return (
      <View style={styles.centerWrap}>
        <PermissionDeniedPanel
          title="Chat monitor not available"
          description={`Requires ${PAGE.CHAT_MONITOR} plus a monitor scope (pool, department, parent company, or platform audit) on GET /auth/me.`}
        />
      </View>
    );
  }

  const showThreadPane = Boolean(monitor.selectedConversationId);
  const selectedRow = monitor.selectedRow;
  const currentAgentId = selectedRow?.agentId ?? null;

  const handleAssigned = () => {
    setAssignOpen(false);
    monitor.refreshLists();
  };

  const handleSupervisorAction = (payload?: { conversationId: string; supervisorControlUserId?: string | null }) => {
    if (payload?.supervisorControlUserId !== undefined) {
      monitor.updateSupervisorControl(payload.supervisorControlUserId ?? null);
    }
    if (payload && !("supervisorControlUserId" in payload)) {
      monitor.clearSelection();
      publishAppToast({ variant: "success", message: "Chat closed." });
    }
    monitor.refreshSelectedTranscript({ silent: true });
    monitor.refreshLists();
  };

  const clearFilters = () => monitor.setFilters({});
  const activeFilterCount = Object.values(monitor.filters).filter((v) => v && v.trim()).length;

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <Typography variant="mediumLarge" style={{ fontWeight: "700" }}>
          Chat Monitor
        </Typography>
        <Pressable onPress={() => setFiltersOpen(true)} style={styles.filterButton}>
          <Ionicons name="filter" size={16} color={tokens.colors.textPrimary} />
          <Typography variant="small" style={{ fontWeight: "600" }}>
            Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </Typography>
        </Pressable>
      </View>

      {!showThreadPane ? (
        <MonitorQueueSidebar
          listTab={monitor.listTab}
          onListTabChange={monitor.setListTab}
          conversations={monitor.list}
          selectedConversationId={monitor.selectedConversationId}
          onSelectConversation={(id) => void monitor.selectConversation(id)}
          liveCount={monitor.liveCount}
          closedCount={monitor.closedCount}
          connected={monitor.isConnected}
          hasToken={Boolean(monitor.token)}
          loading={monitor.listsLoading}
        />
      ) : (
        <View style={{ flex: 1, minHeight: 0 }}>
          <View style={styles.threadHeaderBar}>
            <Button
              variant="ghost"
              size="compact"
              onPress={() => setAssignOpen(true)}
            >
              Assign
            </Button>
          </View>
          <MonitorTranscriptPanel
            conversation={selectedRow}
            messages={monitor.messages}
            visitor={monitor.visitorFromHistory}
            loading={monitor.transcriptLoading}
            loadError={monitor.transcriptError}
            currentUserId={user?.id}
            monitorReadOnly={monitor.capabilities?.readOnly}
            supervisorControlUserId={monitor.supervisorControlUserId}
            visitorTyping={monitor.visitorTyping}
            onDismissConversation={monitor.clearSelection}
            showBackButton
          />
          <ScrollView style={styles.sidePanelScroll} contentContainerStyle={{ padding: tokens.space.md }}>
            <MonitorSupervisorSidePanel
              conversationId={monitor.selectedConversationId}
              supervisorControlUserId={monitor.supervisorControlUserId}
              currentUserId={user?.id}
              hasOperational={hasOperational}
              readOnly={monitor.capabilities?.readOnly}
              onActionComplete={handleSupervisorAction}
              onMessageSent={() => monitor.refreshSelectedTranscript({ silent: true })}
            />
          </ScrollView>
        </View>
      )}

      <Modal visible={assignOpen} animationType="slide" transparent onRequestClose={() => setAssignOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setAssignOpen(false)}>
          <Pressable style={styles.assignSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Typography variant="mediumLarge" style={{ fontWeight: "700" }}>
                Assign conversation
              </Typography>
              <Pressable onPress={() => setAssignOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={tokens.colors.textPrimary} />
              </Pressable>
            </View>
            {monitor.selectedConversationId ? (
              <MonitorAssignPanel conversationId={monitor.selectedConversationId} currentAgentId={currentAgentId} onAssigned={handleAssigned} />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={filtersOpen} animationType="slide" transparent onRequestClose={() => setFiltersOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFiltersOpen(false)}>
          <Pressable style={styles.assignSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Typography variant="mediumLarge" style={{ fontWeight: "700" }}>
                Filters
              </Typography>
              <Pressable onPress={() => setFiltersOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={tokens.colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              <FilterGroup
                label="Website"
                options={monitor.filterOptions.websites}
                value={monitor.filters.websiteId}
                onChange={(v) => monitor.setFilters((prev) => ({ ...prev, websiteId: v }))}
              />
              <FilterGroup
                label="Department"
                options={monitor.filterOptions.departments}
                value={monitor.filters.departmentId}
                onChange={(v) => monitor.setFilters((prev) => ({ ...prev, departmentId: v }))}
              />
              <FilterGroup
                label="Pool"
                options={monitor.filterOptions.pools}
                value={monitor.filters.poolId}
                onChange={(v) => monitor.setFilters((prev) => ({ ...prev, poolId: v }))}
              />
              <FilterGroup
                label="Status"
                options={monitor.filterOptions.statuses.map((s) => ({ id: s, label: s }))}
                value={monitor.filters.status}
                onChange={(v) => monitor.setFilters((prev) => ({ ...prev, status: v }))}
              />
            </ScrollView>
            <Button variant="outlined" size="compact" onPress={clearFilters} style={{ marginTop: 12 }}>
              Clear all filters
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ id: string; label: string }>;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  if (options.length === 0) return null;
  return (
    <View style={{ marginBottom: 14 }}>
      <Typography variant="label" style={{ fontWeight: "600", marginBottom: 6 }}>
        {label}
      </Typography>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        <Pressable onPress={() => onChange(undefined)} style={[styles.chip, !value && styles.chipActive]}>
          <Typography variant="small" style={{ fontWeight: "600" }}>
            All
          </Typography>
        </Pressable>
        {options.map((opt) => (
          <Pressable key={opt.id} onPress={() => onChange(opt.id)} style={[styles.chip, value === opt.id && styles.chipActive]}>
            <Typography variant="small" style={{ fontWeight: "600" }} numberOfLines={1}>
              {opt.label}
            </Typography>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: tokens.space.lg },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  threadHeaderBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: tokens.space.md,
    paddingTop: tokens.space.sm,
  },
  sidePanelScroll: {
    flexGrow: 0,
    maxHeight: 340,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.cardBorder,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  assignSheet: {
    backgroundColor: tokens.colors.backgroundTop,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: tokens.space.md,
    maxHeight: "85%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  chipActive: {
    backgroundColor: "rgba(88, 101, 242, 0.22)",
    borderColor: tokens.colors.accentBlue,
  },
});
