import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppCard, Button, Typography } from "@/components/ui";
import { ScopeSelectField, MultiUserCheckboxPicker } from "@/features/chat-shared";
import { tokens } from "@/theme/tokens";
import { fetchInvolvementUsers } from "@/services/chat/involvement-roster.api";
import { useChannelDepartmentsQuery } from "../hooks/useChannelDepartmentsQuery";
import { useInvolvementModalScope } from "../hooks/useInvolvementModalScope";
import { InvolvementOrgScopeFields } from "./InvolvementOrgScopeFields";

type DraftItem = { departmentId: string; userId: string; sortOrder?: number };

interface InvolvementAddSupervisorsModalProps {
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  saving: boolean;
  onSave: (websiteId: string, items: DraftItem[]) => void;
}

export function InvolvementAddSupervisorsModal({ open, onClose, canEdit, saving, onSave }: InvolvementAddSupervisorsModalProps) {
  const modalScope = useInvolvementModalScope(open);

  const [departmentId, setDepartmentId] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const deptCatalog = useChannelDepartmentsQuery(
    {
      channel: "External",
      parentCompanyId: modalScope.parentCompanyId,
      requireResellerId: modalScope.canFilterByResellerId,
    },
    open,
  );

  const externalDepts = useMemo(() => deptCatalog.data ?? [], [deptCatalog.data]);
  const defaultDepartmentId = externalDepts[0]?.id ?? "";

  useEffect(() => {
    if (!open) return;
    setDepartmentId("");
    setSelectedUserIds([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setDepartmentId(defaultDepartmentId);
    setSelectedUserIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, modalScope.websiteId, defaultDepartmentId]);

  const deptOptions = useMemo(
    () => [
      {
        value: "",
        label: !modalScope.parentCompanyId ? "Select website first" : externalDepts.length ? "Select department…" : "No external departments",
      },
      ...externalDepts.map((d) => ({ value: d.id, label: d.label })),
    ],
    [externalDepts, modalScope.parentCompanyId],
  );

  const activeDept = externalDepts.find((d) => d.id === departmentId);
  const canSave = canEdit && !saving && Boolean(modalScope.websiteId.trim()) && Boolean(departmentId) && selectedUserIds.length > 0;

  const handleSave = async () => {
    const websiteId = modalScope.websiteId.trim();
    if (!websiteId || !departmentId || selectedUserIds.length === 0) return;
    const fullRoster = await fetchInvolvementUsers(websiteId);
    const existingForDept = new Set(fullRoster.filter((r) => r.departmentId === departmentId).map((r) => r.userId));
    const merged = fullRoster.map((r) => ({ departmentId: r.departmentId, userId: r.userId, sortOrder: r.sortOrder }));
    let order = merged.length;
    for (const userId of selectedUserIds) {
      if (existingForDept.has(userId)) continue;
      merged.push({ departmentId, userId, sortOrder: order++ });
    }
    const deduped: DraftItem[] = [];
    const seen = new Set<string>();
    for (const row of merged) {
      const key = `${row.departmentId}:${row.userId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(row);
    }
    onSave(websiteId, deduped);
  };

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Typography variant="mediumLarge" style={{ fontWeight: "700" }}>
              Add involvement users
            </Typography>
            <Typography variant="small" muted style={{ marginTop: 2 }}>
              Choose website, then external department and users.
            </Typography>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={tokens.colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView style={{ maxHeight: "72%" }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: tokens.space.md }}>
            <InvolvementOrgScopeFields scope={modalScope} canEdit={canEdit} disabled={saving} />

            <ScopeSelectField
              label="Department (external)"
              value={departmentId}
              onChange={setDepartmentId}
              options={deptOptions}
              disabled={!canEdit || saving || !modalScope.websiteId.trim() || externalDepts.length === 0}
              searchPlaceholder="Search department…"
 />

            {activeDept ? (
              <AppCard style={styles.deptHint}>
                <Typography variant="small" style={{ fontWeight: "600" }}>
                  {activeDept.label}
                </Typography>
                <Typography variant="small" muted>
                  External users for this department and website's parent company.
                </Typography>
              </AppCard>
            ) : null}

            {modalScope.websiteId.trim() && departmentId ? (
              <MultiUserCheckboxPicker
                userType="External"
                departmentId={departmentId}
                selectedIds={selectedUserIds}
                onChangeSelectedIds={setSelectedUserIds}
                canEdit={canEdit}
                disabled={saving}
 />
            ) : (
              <Typography variant="small" muted>
                Complete website + department to list users.
              </Typography>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button variant="secondary" size="compact" onPress={onClose} disabled={saving} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button variant="primary" size="compact" onPress={() => void handleSave()} disabled={!canSave} style={{ flex: 1 }}>
            {saving ? "Saving…" : `Add ${selectedUserIds.length || ""} user(s)`}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    backgroundColor: tokens.colors.backgroundTop,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: tokens.space.md,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  deptHint: { padding: tokens.space.sm },
  footer: {
    flexDirection: "row",
    gap: tokens.space.md,
    marginTop: tokens.space.md,
  },
});
