import { StyleSheet, View } from "react-native";

import { InputField, SelectField, Typography } from "@/components/ui";
import {
  BILLING_CURRENCY_OPTIONS,
  type BillingRateFieldsValues,
} from "@/lib/billing/billing-rate-fields";

export type BillingRateFieldsFormProps = {
  values: BillingRateFieldsValues;
  onChange: (patch: Partial<BillingRateFieldsValues>) => void;
  showClientMode?: boolean;
  showInvoiceEmails?: boolean;
  invoiceEmails?: string;
  onInvoiceEmailsChange?: (value: string) => void;
  periodLabel?: string;
  periodStart?: string;
  periodEnd?: string;
  onPeriodStartChange?: (value: string) => void;
  onPeriodEndChange?: (value: string) => void;
};

export function BillingRateFieldsForm({
  values,
  onChange,
  showClientMode = false,
  showInvoiceEmails = false,
  invoiceEmails = "",
  onInvoiceEmailsChange,
  periodLabel,
  periodStart,
  periodEnd,
  onPeriodStartChange,
  onPeriodEndChange,
}: BillingRateFieldsFormProps) {
  return (
    <View style={styles.form}>
      {periodLabel ? (
        <Typography variant="small" muted>
          Billing period: {periodLabel}
        </Typography>
      ) : null}

      {onPeriodStartChange && onPeriodEndChange ? (
        <View style={styles.row}>
          <View style={styles.half}>
            <InputField
              label="Period start"
              value={periodStart ?? ""}
              onChangeText={onPeriodStartChange}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.half}>
            <InputField
              label="Period end"
              value={periodEnd ?? ""}
              onChangeText={onPeriodEndChange}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
            />
          </View>
        </View>
      ) : null}
      <View style={styles.row}>
        <View style={styles.half}>
          <SelectField
            label="Currency"
            value={values.currency}
            onChange={(v) => onChange({ currency: v })}
            options={BILLING_CURRENCY_OPTIONS}
          />
        </View>
        <View style={styles.half}>
          <SelectField
            label="Billing cycle"
            value={values.billingCycle}
            onChange={(v) => onChange({ billingCycle: v as BillingRateFieldsValues["billingCycle"] })}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly" },
            ]}
          />
        </View>
      </View>

      {showClientMode ? (
        <>
          <SelectField
            label="Client billing mode"
            value={values.clientBillingMode}
            onChange={(v) => onChange({ clientBillingMode: v as BillingRateFieldsValues["clientBillingMode"] })}
            options={[
              { value: "trial", label: "Trial period" },
              { value: "live", label: "Live billing" },
            ]}
          />
          {values.clientBillingMode === "trial" ? (
            <InputField
              label="Trial days"
              value={values.clientTrialDays}
              onChangeText={(v) => onChange({ clientTrialDays: v })}
              keyboardType="number-pad"
            />
          ) : null}
        </>
      ) : null}

      <Typography variant="small" muted style={styles.sectionLabel}>
        Rate fields
      </Typography>

      <InputField
        label="Cost per chat"
        value={values.costPerChat}
        onChangeText={(v) => onChange({ costPerChat: v })}
        keyboardType="decimal-pad"
      />
      <InputField
        label="Free chats / month / site"
        value={values.freeChats}
        onChangeText={(v) => onChange({ freeChats: v })}
        keyboardType="number-pad"
      />
      <InputField
        label="Monthly chats per site (optional cap)"
        value={values.monthlyChats}
        onChangeText={(v) => onChange({ monthlyChats: v })}
        keyboardType="number-pad"
      />
      <InputField
        label="Platform fee / month"
        value={values.platformFee}
        onChangeText={(v) => onChange({ platformFee: v })}
        keyboardType="decimal-pad"
      />
      <InputField
        label="AI tools fee / month"
        value={values.aiToolsFee}
        onChangeText={(v) => onChange({ aiToolsFee: v })}
        keyboardType="decimal-pad"
      />
      <InputField
        label="Software package fee / site"
        value={values.modulesFee}
        onChangeText={(v) => onChange({ modulesFee: v })}
        keyboardType="decimal-pad"
      />

      {showInvoiceEmails && onInvoiceEmailsChange ? (
        <InputField
          label="Invoice emails"
          value={invoiceEmails}
          onChangeText={onInvoiceEmailsChange}
          placeholder="billing@client.com, accounts@client.com"
          autoCapitalize="none"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  sectionLabel: { fontWeight: "700", letterSpacing: 0.6, marginTop: 4 },
});
