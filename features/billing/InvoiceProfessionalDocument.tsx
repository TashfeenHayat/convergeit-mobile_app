import { FlatList, StyleSheet, View } from "react-native";

import { AppCard, Typography } from "@/components/ui";
import type { InvoiceView } from "@/api/billing/invoice.api";
import { InvoiceStatusBadge } from "./components/InvoiceStatusBadge";

type Props = {
  invoice: InvoiceView;
};

function money(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return "—";
  return `${currency} ${amount.toFixed(2)}`;
}

export function InvoiceProfessionalDocument({ invoice }: Props) {
  const currency = invoice.currency ?? "USD";
  const billTo =
    invoice.parentCompanyName ?? invoice.companyName ?? invoice.websiteName ?? "Client";

  return (
    <AppCard style={styles.doc}>
      <View style={styles.docHeader}>
        <View style={{ flex: 1 }}>
          <Typography variant="small" muted style={styles.label}>
            BILL TO
          </Typography>
          <Typography variant="medium16" style={{ fontWeight: "700" }}>
            {billTo}
          </Typography>
          {invoice.websiteUrl ? (
            <Typography variant="small" muted>
              {invoice.websiteUrl}
            </Typography>
          ) : null}
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Typography variant="boldLarge" style={styles.invoiceTitle}>
            INVOICE
          </Typography>
          <Typography variant="small" muted>
            #{invoice.invoiceNumber ?? invoice.id.slice(0, 8)}
          </Typography>
          <InvoiceStatusBadge status={invoice.status} />
        </View>
      </View>

      <View style={styles.metaRow}>
        <Meta label="Issued" value={invoice.issuedDate?.slice(0, 10) ?? "—"} />
        <Meta label="Due" value={invoice.dueDate?.slice(0, 10) ?? "—"} />
      </View>
      <Meta
        label="Period"
        value={`${invoice.periodStart?.slice(0, 10) ?? "—"} → ${invoice.periodEnd?.slice(0, 10) ?? "—"}`}
 />

      <View style={styles.divider} />

      <Typography variant="medium16" style={{ fontWeight: "600", marginBottom: 8 }}>
        Line items
      </Typography>
      <FlatList
        data={invoice.lineItems}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.lineSep} />}
        ListEmptyComponent={
          <Typography variant="small" muted>
            No line items.
          </Typography>
        }
        renderItem={({ item }) => (
          <View style={styles.lineRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Typography variant="medium">{item.websiteName ?? item.websiteUrl ?? "Item"}</Typography>
              <Typography variant="small" muted>
                {item.billableChats} billable · {item.chargeableChats ?? 0} chargeable chats
              </Typography>
            </View>
            <Typography variant="medium16" style={{ fontWeight: "600" }}>
              {money(item.lineTotal, currency)}
            </Typography>
          </View>
        )}
  showsVerticalScrollIndicator={false}/>

      <View style={styles.totalRow}>
        <Typography variant="medium16" style={{ fontWeight: "700" }}>
          Total due
        </Typography>
        <Typography variant="boldLarge">{money(invoice.totalAmount, currency)}</Typography>
      </View>
    </AppCard>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2, marginBottom: 6 }}>
      <Typography variant="small" muted>
        {label}
      </Typography>
      <Typography variant="medium">{value}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  doc: {
    gap: 8,
  },
  docHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  label: {
    letterSpacing: 0.8,
    fontWeight: "700",
    marginBottom: 2,
  },
  invoiceTitle: {
    letterSpacing: 2,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    gap: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 8,
  },
  lineSep: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
});
