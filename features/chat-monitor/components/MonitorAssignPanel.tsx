import { useEffect, useRef } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useMonitorAssignChat } from "../hooks/useMonitorAssignChat";

interface MonitorAssignPanelProps {
  conversationId: string;
  currentAgentId: string | null;
  onAssigned: () => void;
}

export function MonitorAssignPanel({ conversationId, currentAgentId, onAssigned }: MonitorAssignPanelProps) {
  const assignChat = useMonitorAssignChat(conversationId, { enabled: true });
  const pendingAssignRef = useRef(false);

  useEffect(() => {
    if (!pendingAssignRef.current || !assignChat.selectedUserId || assignChat.busy) return;
    pendingAssignRef.current = false;
    void assignChat.assign().then((ok) => {
      if (ok) onAssigned();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignChat.selectedUserId]);

  if (assignChat.loadingTargets) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.colors.accentBlue} />
      </View>
    );
  }

  if (assignChat.targets.length === 0) {
    return (
      <View style={styles.center}>
        <Typography variant="small" muted>
          No eligible agents to assign in this scope.
        </Typography>
      </View>
    );
  }

  return (
    <FlatList
      data={assignChat.targets}
      keyExtractor={(a) => a.userId}
      style={{ maxHeight: 320 }}
      renderItem={({ item }) => {
        const isCurrent = item.userId === currentAgentId;
        const busy = assignChat.busy && assignChat.selectedUserId === item.userId;
        return (
          <Pressable
            onPress={() => {
              if (isCurrent || assignChat.busy) return;
              pendingAssignRef.current = true;
              assignChat.setSelectedUserId(item.userId);
            }}
            style={[styles.row, isCurrent && styles.rowCurrent]}
            disabled={isCurrent || assignChat.busy}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography variant="small" style={{ fontWeight: "600" }} numberOfLines={1}>
                {item.name || item.label}
              </Typography>
              {item.email ? (
                <Typography variant="small" muted numberOfLines={1}>
                  {item.email}
                </Typography>
              ) : null}
            </View>
            {isCurrent ? (
              <Typography variant="small" color={tokens.colors.accentGreen} style={{ fontWeight: "700" }}>
                Current
              </Typography>
            ) : busy ? (
              <ActivityIndicator size="small" color={tokens.colors.accentBlue} />
            ) : (
              <Typography variant="small" color={tokens.colors.accentBlue} style={{ fontWeight: "700" }}>
                Assign
              </Typography>
            )}
          </Pressable>
        );
      }}
  showsVerticalScrollIndicator={false}/>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 24, alignItems: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
  },
  rowCurrent: { opacity: 0.6 },
});
