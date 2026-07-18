import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppCard, Button, InputField, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { ScopeSelectField } from "@/features/chat-shared";
import type { AgentDistributionDepartment } from "@/services/chat/agent-distribution.api";
import { groupEmailFormFields } from "@/features/email/utils/email-form-field-groups";
import { agentDistributionFieldMultiline, type AgentDistributionFormFieldLike } from "../utils/agent-distribution-form.utils";

function DistributionFormField({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: AgentDistributionFormFieldLike;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const multiline = agentDistributionFieldMultiline(field.fieldType, field.fieldKey);
  const locked = readOnly || field.readOnly;

  return (
    <View style={{ width: "100%", minWidth: 0, marginBottom: tokens.space.md }}>
      <InputField label={field.label} value={value} onChangeText={onChange} multiline={multiline} editable={!locked} />
      {locked && value ? (
        <View style={styles.prefilledRow}>
          <Ionicons name="sparkles-outline" size={12} color={tokens.colors.accentBlue} />
          <Typography variant="small" muted style={{ fontSize: 11 }}>
            Prefilled from chat
          </Typography>
        </View>
      ) : null}
    </View>
  );
}

export type AgentDistributionFormViewProps = {
  fields: AgentDistributionFormFieldLike[];
  values: Record<string, string>;
  onFieldChange: (fieldKey: string, value: string) => void;
  departments: AgentDistributionDepartment[];
  departmentId: string;
  onDepartmentChange: (id: string) => void;
  subject?: string;
  method?: string;
  loading?: boolean;
  submitted?: boolean;
  submitting?: boolean;
  onSubmit?: () => void;
  onBack?: () => void;
  onReportSpam?: () => void;
};

export function AgentDistributionFormView({
  fields,
  values,
  onFieldChange,
  departments,
  departmentId,
  onDepartmentChange,
  subject,
  method,
  loading,
  submitted,
  submitting,
  onSubmit,
  onBack,
  onReportSpam,
}: AgentDistributionFormViewProps) {
  const groups = useMemo(
    () =>
      groupEmailFormFields(
        fields.map((f, index) => ({
          fieldKey: f.fieldKey,
          label: f.label,
          fieldType: f.fieldType,
          sortOrder: index,
          isRequired: Boolean(f.isRequired),
          enabled: f.enabled ?? true,
        })),
      ),
    [fields],
  );

  const deliveryMethod = method?.trim().toLowerCase() ?? "email";
  const usesCrm = deliveryMethod === "crm" || deliveryMethod === "both";
  const formTitle = deliveryMethod === "crm" ? "CRM distribution" : deliveryMethod === "both" ? "Email & CRM distribution" : "Email distribution";
  const submitLabel = deliveryMethod === "crm" ? "Submit to CRM" : deliveryMethod === "both" ? "Send email & CRM" : "Send distribution email";

  const departmentOptions = departments.map((dept) => {
    const suffix = dept.recipientCount > 0 ? `${dept.recipientCount} recipient${dept.recipientCount === 1 ? "" : "s"}` : usesCrm ? "CRM" : "no recipients";
    return { value: dept.id, label: `${dept.name} (${suffix})` };
  });

  return (
    <View>
      {onBack ? (
        <Button variant="secondary" size="compact" onPress={onBack} style={{ alignSelf: "flex-start", marginBottom: tokens.space.md }}>
          Back to inbox
        </Button>
      ) : null}

      <View style={{ marginBottom: tokens.space.md }}>
        <View style={styles.titleRow}>
          <Typography variant="regularLarge" style={{ fontWeight: "700", flex: 1 }}>
            Distribute chat transcript
          </Typography>
          <View style={[styles.statusChip, submitted ? styles.statusChipSuccess : styles.statusChipInfo]}>
            <Ionicons
              name={submitted ? "checkmark-circle-outline" : "sparkles-outline"}
              size={14}
              color={submitted ? tokens.colors.accentGreen : tokens.colors.accentBlue}
            />
            <Typography variant="small" style={{ fontSize: 11, fontWeight: "600" }}>
              {submitted ? "Submitted" : "Auto-filled from chat"}
            </Typography>
          </View>
        </View>
        <Typography variant="small" muted style={{ marginTop: 4 }}>
          Review the prefilled details, choose a department, and send the transcript email.
        </Typography>
      </View>

      <AppCard style={{ padding: tokens.space.md }}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="document-text-outline" size={22} color={tokens.colors.accentBlue} />
          </View>
          <View style={{ minWidth: 0, flex: 1 }}>
            <Typography variant="mediumLarge" style={{ fontWeight: "700" }}>
              {formTitle}
            </Typography>
            {subject ? (
              <Typography variant="small" muted style={{ marginTop: 2 }} numberOfLines={2}>
                Subject: {subject}
              </Typography>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={{ paddingVertical: tokens.space.xl, alignItems: "center" }}>
            <ActivityIndicator color={tokens.colors.accentBlue} />
          </View>
        ) : (
          <View>
            <View style={{ marginBottom: tokens.space.md }}>
              <ScopeSelectField
                label="Destination department"
                value={departmentId}
                onChange={onDepartmentChange}
                disabled={submitted}
                options={departmentOptions}
              />
            </View>

            {groups.map(({ group, fields: groupFields }) => (
              <View key={group.id} style={{ marginBottom: tokens.space.md }}>
                <Typography variant="small" style={styles.groupLabel}>
                  {group.label}
                </Typography>
                {groupFields.map((field) => (
                  <DistributionFormField
                    key={field.fieldKey}
                    field={field}
                    value={values[field.fieldKey] ?? ""}
                    onChange={(v) => onFieldChange(field.fieldKey, v)}
                    readOnly={submitted}
                  />
                ))}
              </View>
            ))}

            <View style={styles.footer}>
              {submitted ? (
                <Typography variant="medium" muted>
                  Distribution already submitted for this chat.
                </Typography>
              ) : (
                <Typography variant="small" muted style={{ marginBottom: tokens.space.sm }}>
                  {deliveryMethod === "crm"
                    ? "Selected department is sent to CRM using your field mapping."
                    : deliveryMethod === "both"
                      ? "Email goes to To/CC/BCC; CRM receives mapped fields including destination department."
                      : "Recipients come from the selected department's To/CC/BCC list."}
                </Typography>
              )}
              {!submitted ? (
                <View style={{ flexDirection: "row", gap: tokens.space.sm, flexWrap: "wrap" }}>
                  {onReportSpam ? (
                    <Button variant="secondary" disabled={submitting} onPress={onReportSpam}>
                      Report as spam
                    </Button>
                  ) : null}
                  <Button variant="primary" disabled={submitting || departments.length === 0} onPress={() => onSubmit?.()}>
                    {submitting ? "Sending…" : submitLabel}
                  </Button>
                </View>
              ) : null}
            </View>
          </View>
        )}
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: tokens.space.sm,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
  },
  statusChipInfo: {
    backgroundColor: "rgba(88, 101, 242, 0.15)",
    borderColor: "rgba(88, 101, 242, 0.35)",
  },
  statusChipSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderColor: "rgba(34, 197, 94, 0.35)",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.space.sm,
    marginBottom: tokens.space.lg,
    paddingBottom: tokens.space.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(88, 101, 242, 0.15)",
  },
  groupLabel: {
    color: tokens.colors.accentBlue,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    fontSize: 10,
  },
  prefilledRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  footer: {
    paddingTop: tokens.space.md,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.cardBorder,
  },
});
