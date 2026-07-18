import { ScrollView, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { FormModal, Typography } from "@/components/ui";
import {
  fetchAnalyticsLogDetail,
  fetchAuditLogDetail,
} from "@/api/observability/observability-logs.api";
import { observabilityLogKeys } from "../hooks/keys";
import type { ObservabilityLogTab } from "../hooks/useObservabilityLogs";
import {
  formatLogActor,
  formatLogTimestamp,
  formatLogWebsiteLabel,
} from "../utils/format-log";

export type LogDetailDrawerProps = {
  open: boolean;
  logId: string | null;
  tab: ObservabilityLogTab;
  onClose: () => void;
};

function JsonBlock({ value }: { value: unknown }) {
  const text =
    value === null || value === undefined
      ? "—"
      : typeof value === "string"
        ? value
        : JSON.stringify(value, null, 2);
  return (
    <Typography variant="small" style={styles.mono}>
      {text}
    </Typography>
  );
}

/** Log detail modal — audit or analytics payload. */
export function LogDetailDrawer({ open, logId, tab, onClose }: LogDetailDrawerProps) {
  const id = logId?.trim() ?? "";
  const auditQuery = useQuery({
    queryKey: observabilityLogKeys.auditDetail(id),
    queryFn: () => fetchAuditLogDetail(id),
    enabled: open && tab === "audit" && id.length > 0,
  });
  const analyticsQuery = useQuery({
    queryKey: observabilityLogKeys.analyticsDetail(id),
    queryFn: () => fetchAnalyticsLogDetail(id),
    enabled: open && tab === "analytics" && id.length > 0,
  });

  const detail = tab === "audit" ? auditQuery.data : analyticsQuery.data;
  const loading = tab === "audit" ? auditQuery.isLoading : analyticsQuery.isLoading;

  return (
    <FormModal
      open={open}
      title="Log detail"
      onClose={onClose}
      onSave={onClose}
      primaryButtonLabel="Close"
      showCancelButton={false}
    >
      {loading ? (
        <Typography variant="medium" muted>
          Loading…
        </Typography>
      ) : !detail ? (
        <Typography variant="medium" muted>
          Log entry not found.
        </Typography>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={{ gap: 12 }}>
          <Field label="Event" value={detail.eventType} />
          <Field label="Time" value={formatLogTimestamp(detail.createdAt)} />
          <Field label="Actor" value={formatLogActor(detail.actor)} />
          <Field label="Website" value={formatLogWebsiteLabel(detail.website)} />
          {"severity" in detail ? <Field label="Severity" value={detail.severity} /> : null}
          {detail.conversationId ? (
            <Field label="Conversation" value={detail.conversationId} />
          ) : null}
          <View>
            <Typography variant="small" muted style={{ marginBottom: 4 }}>
              Payload
            </Typography>
            <JsonBlock
              value={
                "detailsJson" in detail
                  ? detail.detailsJson
                  : "payloadJson" in detail
                    ? detail.payloadJson
                    : null
              }
            />
          </View>
        </ScrollView>
      )}
    </FormModal>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Typography variant="small" muted>
        {label}
      </Typography>
      <Typography variant="medium">{value}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 420 },
  mono: { fontFamily: "monospace", fontSize: 12 },
});
