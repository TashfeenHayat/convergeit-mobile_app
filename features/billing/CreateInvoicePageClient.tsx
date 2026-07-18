import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, InputField, SelectField, Typography } from "@/components/ui";
import { BillingRateFieldsForm } from "@/features/billing/components/BillingRateFieldsForm";
import { InvoiceProfessionalDocument } from "@/features/billing/InvoiceProfessionalDocument";
import { WebsiteBillingStatusBadge } from "@/features/billing/components/WebsiteBillingStatusBadge";
import type { InvoiceView } from "@/api/billing/invoice.api";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import {
  defaultBillingRateFields,
  resolveModulesFeeMonthly,
  type BillingRateFieldsValues,
} from "@/lib/billing/billing-rate-fields";
import {
  formatBillingPeriodLabel,
  invoiceEmailsFromProfile,
  mergeContractProfileRates,
} from "@/lib/billing/merge-billing-rate-values";
import { isParentOnAgencyContract } from "@/lib/billing/parent-billing-mode";
import {
  useAgencyBillingContractQuery,
  useCreateInvoiceMutation,
  usePutWebsiteBillingProfileMutation,
  useWebsiteBillingProfileQuery,
  useWebsiteBillingProfilesQuery,
  useWebsiteInvoicePreviewQuery,
} from "@/lib/hooks/query/billing/billing";
import { useAppTheme } from "@/theme";

function monthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function money(currency: string, amount: number) {
  return `${currency} ${amount.toFixed(2)}`;
}

export function CreateInvoicePageClient() {
  const theme = useAppTheme();
  const router = useRouter();
  const { isPlatformAdmin, user } = useAuth();
  const range = useMemo(() => monthRange(), []);

  const [websiteId, setWebsiteId] = useState("");
  const [periodStart, setPeriodStart] = useState(range.start);
  const [periodEnd, setPeriodEnd] = useState(range.end);
  const [extraCharges, setExtraCharges] = useState("0");
  const [notes, setNotes] = useState("");
  const [issueNow, setIssueNow] = useState("yes");
  const [invoiceEmails, setInvoiceEmails] = useState("");
  const [rateValues, setRateValues] = useState<BillingRateFieldsValues>(() => defaultBillingRateFields());

  const resellerId = user?.resellerId?.trim() ?? "";
  const profilesQuery = useWebsiteBillingProfilesQuery(
    !isPlatformAdmin && resellerId ? { resellerId } : {},
  );
  const profileQuery = useWebsiteBillingProfileQuery(websiteId, { enabled: Boolean(websiteId) });
  const selectedProfile = profileQuery.data?.data;
  const activeResellerId = selectedProfile?.resellerId ?? resellerId;

  const contractQuery = useAgencyBillingContractQuery(activeResellerId, {
    enabled: Boolean(activeResellerId),
  });
  const createMutation = useCreateInvoiceMutation();
  const saveRatesMutation = usePutWebsiteBillingProfileMutation();

  const websiteOptions = useMemo(() => {
    const items = (profilesQuery.data?.data ?? []).filter((p) =>
      !isParentOnAgencyContract({ parentOnAgencyContract: p.parentOnAgencyContract }),
    );
    return [
      { value: "", label: "Select website" },
      ...items.map((p) => ({
        value: p.websiteId,
        label: `${p.websiteName ?? p.websiteUrl} (${p.parentCompanyName} · ${p.companyName})`,
      })),
    ];
  }, [profilesQuery.data?.data]);

  const agencyContractWebsiteCount = useMemo(() => {
    return (profilesQuery.data?.data ?? []).filter((p) =>
      isParentOnAgencyContract({ parentOnAgencyContract: p.parentOnAgencyContract }),
    ).length;
  }, [profilesQuery.data?.data]);

  const contract = contractQuery.data?.data;
  const periodLabel = formatBillingPeriodLabel(periodStart, periodEnd);

  useEffect(() => {
    if (!activeResellerId) return;
    if (!contract && !selectedProfile) return;
    setRateValues(mergeContractProfileRates(contract, selectedProfile));
    setInvoiceEmails(invoiceEmailsFromProfile(selectedProfile, contract));
  }, [activeResellerId, contract, selectedProfile]);

  const modulesFeeMonthly = useMemo(
    () =>
      resolveModulesFeeMonthly(
        rateValues.modulesFee,
        selectedProfile?.modulesFeeMonthly,
        contract?.modulesFeeMonthly,
      ),
    [rateValues.modulesFee, selectedProfile?.modulesFeeMonthly, contract?.modulesFeeMonthly],
  );

  const modulesFeeOverride = useMemo(() => {
    if (rateValues.modulesFee.trim()) return modulesFeeMonthly;
    return undefined;
  }, [rateValues.modulesFee, modulesFeeMonthly]);

  const monthlyChatsPerSite = rateValues.monthlyChats.trim()
    ? Number(rateValues.monthlyChats) || 0
    : selectedProfile?.monthlyChatsPerSite ?? contract?.monthlyChatsPerSite ?? undefined;

  const previewParams = useMemo(
    () => ({
      websiteId,
      periodStart,
      periodEnd,
      extraCharges: Number(extraCharges) || 0,
      costPerChat: Number(rateValues.costPerChat) || 0,
      freeChatsPerMonth: Number(rateValues.freeChats) || 0,
      platformFeeMonthly: Number(rateValues.platformFee) || 0,
      aiToolsMonthly: Number(rateValues.aiToolsFee) || 0,
      ...(modulesFeeOverride != null ? { modulesFeeMonthly: modulesFeeOverride } : {}),
      ...(monthlyChatsPerSite != null ? { monthlyChatsPerSite } : {}),
    }),
    [websiteId, periodStart, periodEnd, extraCharges, rateValues, modulesFeeOverride, monthlyChatsPerSite],
  );

  const previewQuery = useWebsiteInvoicePreviewQuery(previewParams, {
    enabled: Boolean(websiteId),
  });
  const preview = previewQuery.data?.data;

  const previewInvoice: InvoiceView | null = preview
    ? {
        id: preview.websiteId,
        invoiceNumber: null,
        status: "draft",
        currency: preview.currency,
        companyId: preview.companyId,
        companyName: preview.companyName,
        websiteId: preview.websiteId,
        websiteName: preview.websiteName,
        websiteUrl: preview.websiteUrl,
        resellerId: activeResellerId || null,
        resellerName: null,
        parentCompanyId: preview.parentCompanyId,
        parentCompanyName: preview.parentCompanyName,
        periodStart,
        periodEnd,
        totalChats: preview.totalChats,
        billableChats: preview.billableChats,
        freeChatsIncluded: preview.freeChatsPerMonth,
        costPerChat: preview.costPerChat,
        platformFee: preview.platformFee,
        aiToolsFee: preview.aiToolsFee,
        extraCharges: preview.extraCharges,
        subtotal: preview.subtotal,
        discountAmount: preview.discountTotal,
        totalAmount: preview.totalAmount,
        issuedDate: "",
        dueDate: null,
        paidDate: null,
        notes: null,
        publicPaymentToken: null,
        isAgencySelfBill: false,
        lineItems: [
          {
            id: preview.websiteId,
            websiteId: preview.websiteId,
            websiteUrl: preview.websiteUrl,
            websiteName: preview.websiteName,
            childCompanyName: preview.companyName,
            totalChats: preview.totalChats,
            billableChats: preview.billableChats,
            chargeableChats: preview.chargeableChats,
            costPerChat: preview.costPerChat,
            chatCharges: preview.chatCharges,
            platformFee: preview.platformFee,
            aiToolsFee: preview.aiToolsFee,
            extraCharges: preview.extraCharges,
            modulesFee: preview.modulesFee,
            lineTotal: preview.totalAmount,
          },
        ],
      }
    : null;

  const handleSaveRates = async () => {
    if (!websiteId) {
      Alert.alert("Validation", "Select a website first.");
      return;
    }
    try {
      await saveRatesMutation.mutateAsync({
        websiteId,
        costPerChat: Number(rateValues.costPerChat) || 0,
        freeChatsPerMonth: Number(rateValues.freeChats) || 0,
        monthlyChatsPerSite: rateValues.monthlyChats.trim()
          ? Number(rateValues.monthlyChats) || 0
          : undefined,
        platformFeeMonthly: Number(rateValues.platformFee) || 0,
        aiToolsMonthly: Number(rateValues.aiToolsFee) || 0,
        modulesFeeMonthly: modulesFeeOverride ?? modulesFeeMonthly,
        currency: rateValues.currency,
        billingCycle: rateValues.billingCycle,
        invoiceToEmails: invoiceEmails.trim() || undefined,
      });
      Alert.alert("Saved", "Website rates saved.");
      void profileQuery.refetch();
      void profilesQuery.refetch();
    } catch (err) {
      Alert.alert("Save failed", extractApiErrorMessage(err));
    }
  };

  const handleSubmit = async () => {
    if (!websiteId) {
      Alert.alert("Validation", "Select a website.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        websiteId,
        periodStart,
        periodEnd,
        extraCharges: Number(extraCharges) || 0,
        notes: notes.trim() || undefined,
        issueNow: issueNow === "yes",
        costPerChat: Number(rateValues.costPerChat) || 0,
        freeChatsPerMonth: Number(rateValues.freeChats) || 0,
        platformFeeMonthly: Number(rateValues.platformFee) || 0,
        aiToolsMonthly: Number(rateValues.aiToolsFee) || 0,
        modulesFeeMonthly: modulesFeeOverride ?? modulesFeeMonthly,
        monthlyChatsPerSite: monthlyChatsPerSite ?? undefined,
      });
      Alert.alert("Success", "Invoice created.");
      router.push("/billing" as never);
    } catch (err) {
      Alert.alert("Create failed", extractApiErrorMessage(err));
    }
  };

  return (
    <MobileScreen>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: theme.spacing.screen }]}>
        <View style={{ gap: theme.spacing.md }}>
          <Typography variant="boldLarge">Per-website invoice</Typography>
          <Typography variant="medium" muted>
            Pick one website, set rates, and create a single-site invoice. Clients on agency contract
            are billed from Agency contracts.
          </Typography>

          <AppCard style={{ gap: 12 }}>
            <Typography variant="medium16" style={{ fontWeight: "700" }}>
              Website billing setup
            </Typography>
            <Typography variant="small" muted>
              Only websites whose client is not on agency contract are listed below.
              {agencyContractWebsiteCount > 0
                ? ` ${agencyContractWebsiteCount} website${agencyContractWebsiteCount === 1 ? "" : "s"} hidden (agency contract clients).`
                : ""}
            </Typography>

            <SelectField label="Website" value={websiteId} onChange={setWebsiteId} options={websiteOptions} />

            {selectedProfile ? (
              <View style={styles.profileBox}>
                <View style={styles.profileHeader}>
                  <Typography variant="medium16" style={{ fontWeight: "600", flex: 1 }}>
                    {selectedProfile.websiteName ?? selectedProfile.websiteUrl}
                  </Typography>
                  <WebsiteBillingStatusBadge
                    status={selectedProfile.status}
                    trialEndDate={selectedProfile.trialEndDate}
                    graceEndDate={null}
                  />
                </View>
                <Typography variant="small" muted>
                  Parent company: {selectedProfile.parentCompanyName} · Child company:{" "}
                  {selectedProfile.companyName}
                </Typography>
              </View>
            ) : (
              <Typography variant="small" muted>
                Select a website to load its profile and preview the invoice total.
              </Typography>
            )}

            <BillingRateFieldsForm
              values={rateValues}
              onChange={(patch) => setRateValues((prev) => ({ ...prev, ...patch }))}
              periodLabel={periodLabel}
              periodStart={periodStart}
              periodEnd={periodEnd}
              onPeriodStartChange={setPeriodStart}
              onPeriodEndChange={setPeriodEnd}
              showInvoiceEmails
              invoiceEmails={invoiceEmails}
              onInvoiceEmailsChange={setInvoiceEmails}
            />

            <Button
              variant="outlined"
              onPress={() => void handleSaveRates()}
              disabled={saveRatesMutation.isPending || !websiteId}
              loading={saveRatesMutation.isPending}
            >
              Save client billing
            </Button>

            {websiteId && previewQuery.isLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator color={theme.app.dashboard.accentBlue} />
                <Typography variant="small" muted>
                  Loading preview…
                </Typography>
              </View>
            ) : null}

            {previewInvoice ? (
              <View style={{ gap: 8 }}>
                <View style={styles.previewHeader}>
                  <Typography variant="medium16" style={{ fontWeight: "600" }}>
                    Invoice preview
                  </Typography>
                  <Typography variant="medium16" style={{ fontWeight: "700" }}>
                    {money(preview!.currency, preview!.totalAmount)}
                  </Typography>
                </View>
                <InvoiceProfessionalDocument invoice={previewInvoice} />
                {preview!.discountTotal > 0 ? (
                  <Typography variant="small" muted>
                    Discount: −{money(preview!.currency, preview!.discountTotal)}
                  </Typography>
                ) : null}
                {preview!.existingInvoice ? (
                  <Typography variant="small" color={theme.app.dashboard.accentOrange}>
                    Invoice already exists for this period (
                    {preview!.existingInvoice.invoiceNumber ?? preview!.existingInvoice.id.slice(0, 8)} ·{" "}
                    {preview!.existingInvoice.status})
                  </Typography>
                ) : null}
              </View>
            ) : null}

            <InputField
              label="Extra charges"
              value={extraCharges}
              onChangeText={setExtraCharges}
              keyboardType="decimal-pad"
            />
            <SelectField
              label="Issue immediately"
              value={issueNow}
              onChange={setIssueNow}
              options={[
                { value: "yes", label: "Yes — notify client" },
                { value: "no", label: "No — save as draft" },
              ]}
            />
            <InputField
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <View style={styles.actions}>
              <Button onPress={() => void handleSubmit()} disabled={createMutation.isPending} loading={createMutation.isPending}>
                Create invoice
              </Button>
              <Button variant="outlined" onPress={() => router.push("/billing" as never)}>
                Cancel
              </Button>
            </View>
          </AppCard>
        </View>
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32, gap: 16 },
  profileBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 6,
  },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  centered: { alignItems: "center", gap: 8, paddingVertical: 12 },
  previewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
