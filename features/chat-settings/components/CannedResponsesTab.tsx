import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Button, SelectField, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { CannedResponseListRow } from "@/services/chat/canned-responses.types";
import { CannedMessagesModal } from "./CannedMessagesModal";

interface CannedResponsesTabProps {
  rows: CannedResponseListRow[];
  loading: boolean;
  canEdit: boolean;
  websiteOptions: Array<{ value: string; label: string }>;
  onNotifyError: (e: unknown) => void;
  onNotifySuccess: (message: string) => void;
}

export function CannedResponsesTab({
  rows,
  loading,
  canEdit,
  websiteOptions,
  onNotifyError,
  onNotifySuccess,
}: CannedResponsesTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editWebsiteId, setEditWebsiteId] = useState("");

  const openAdd = () => {
    setEditWebsiteId("");
    setModalOpen(true);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <Typography variant="medium" style={{ fontWeight: "700" }}>
          Canned responses
        </Typography>
        {canEdit ? (
          <Button variant="primary" size="compact" onPress={openAdd}>
            Add
          </Button>
        ) : null}
      </View>

      {loading ? (
        <Typography variant="small" muted>
          Loading canned messages…
        </Typography>
      ) : rows.length === 0 ? (
        <Typography variant="small" muted>
          No canned messages in this scope.
        </Typography>
      ) : (
        <FlatList
          data={rows}
          scrollEnabled={false}
          keyExtractor={(r) => r.id}
          renderItem={({ item: row }) => (
            <Pressable
              style={styles.row}
              onPress={() => {
                setEditWebsiteId(row.websiteId);
                setModalOpen(true);
              }}
            >
              <Typography variant="medium" style={{ fontWeight: "600" }} numberOfLines={1}>
                {row.websiteName || row.websiteUrl || row.websiteId.slice(0, 8)}
              </Typography>
              <Typography variant="small" muted numberOfLines={1}>
                {row.title}
              </Typography>
              <Typography variant="small" muted numberOfLines={2}>
                {row.body}
              </Typography>
            </Pressable>
          )}
  showsVerticalScrollIndicator={false}/>
      )}

      <CannedMessagesModal
        open={modalOpen}
        websiteId={editWebsiteId}
        websiteLabel={websiteOptions.find((w) => w.value === editWebsiteId)?.label}
        canEdit={canEdit}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          onNotifySuccess("Canned messages saved.");
        }}
        onError={onNotifyError}
 />

      {modalOpen && !editWebsiteId && canEdit ? (
        <View style={{ marginTop: tokens.space.md }}>
          <SelectField
            label="Website"
            value={editWebsiteId}
            onChange={setEditWebsiteId}
            options={[{ value: "", label: "Select website…" }, ...websiteOptions.filter((w) => w.value)]}
 />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space.md },
  toolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  row: {
    paddingVertical: tokens.space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
    gap: 2,
  },
});
