import { View } from "react-native";

import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { ClientServicesAccessRow } from "@/api/companies/services-access.api";
import { ModuleChips, OfferingTypeChip } from "./services-shared";
import { ServicesDialogShell } from "./ServicesDialogShell";

type Props = {
  open: boolean;
  row: ClientServicesAccessRow | null;
  moduleLabels: Record<string, string>;
  canEditReseller: boolean;
  onClose: () => void;
  onEditReseller: (resellerId: string, resellerName: string) => void;
};

export function ClientServicesDetailModal({
  open,
  row,
  moduleLabels,
  canEditReseller,
  onClose,
  onEditReseller,
}: Props) {
  return (
    <ServicesDialogShell
      open={open}
      onClose={onClose}
      title={row ? `Client access — ${row.name}` : "Client access"}
    >
      {!row ? null : (
        <View style={{ gap: 16 }}>
          <View>
            <Typography variant="small" color={tokens.colors.textMuted}>
              Reseller
            </Typography>
            <Typography variant="medium16">{row.resellerName}</Typography>
          </View>

          <View>
            <Typography variant="small" color={tokens.colors.textMuted}>
              Offering type
            </Typography>
            <View style={{ marginTop: 4 }}>
              <OfferingTypeChip type={row.offeringType} />
            </View>
          </View>

          <View>
            <Typography variant="small" color={tokens.colors.textMuted}>
              Active modules (inherited from reseller)
            </Typography>
            <View style={{ marginTop: 8 }}>
              <ModuleChips moduleCodes={row.moduleCodes} moduleLabels={moduleLabels} max={20} />
            </View>
          </View>

          <Typography variant="small" color={tokens.colors.textMuted}>
            Client modules currently mirror the reseller ceiling. Edit the reseller to add or remove
            product access for all clients under that agency.
          </Typography>

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {canEditReseller ? (
              <Button
                onPress={() => {
                  onEditReseller(row.resellerId, row.resellerName);
                  onClose();
                }}
              >
                Edit reseller modules
              </Button>
            ) : null}
            <Button variant="secondary" onPress={onClose}>
              Close
            </Button>
          </View>
        </View>
      )}
    </ServicesDialogShell>
  );
}
