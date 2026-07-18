import { StyleSheet, View } from "react-native";

import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { OfferingType } from "@/api/companies/services-access.api";

const OFFERING_LABELS: Record<OfferingType, string> = {
  software: "Software",
  service: "Service",
  both: "Software + Service",
  none: "None",
};

const OFFERING_COLORS: Record<OfferingType, string> = {
  software: tokens.colors.accentBlue,
  service: tokens.colors.accentPink,
  both: tokens.colors.accentGreen,
  none: tokens.colors.textMuted,
};

export function OfferingTypeChip({ type }: { type: OfferingType }) {
  const color = OFFERING_COLORS[type];
  return (
    <View
      style={[
        styles.chip,
        type === "none"
          ? styles.chipOutlined
          : { backgroundColor: `${color}26`, borderColor: color },
      ]}
    >
      <Typography variant="small" color={type === "none" ? tokens.colors.textMuted : color}>
        {OFFERING_LABELS[type]}
      </Typography>
    </View>
  );
}

type ModuleChipsProps = {
  moduleCodes: string[];
  moduleLabels?: Record<string, string>;
  max?: number;
};

export function ModuleChips({ moduleCodes, moduleLabels, max = 4 }: ModuleChipsProps) {
  const visible = moduleCodes.slice(0, max);
  const overflow = moduleCodes.length - visible.length;

  if (!moduleCodes.length) {
    return (
      <View style={[styles.chip, styles.chipOutlined]}>
        <Typography variant="small" color={tokens.colors.textMuted}>
          No modules
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {visible.map((code) => (
        <View key={code} style={[styles.chip, styles.chipAccent]}>
          <Typography variant="small">{moduleLabels?.[code] ?? code.replaceAll("_", " ")}</Typography>
        </View>
      ))}
      {overflow > 0 ? (
        <View style={[styles.chip, styles.chipOutlined]}>
          <Typography variant="small" color={tokens.colors.textMuted}>
            +{overflow}
          </Typography>
        </View>
      ) : null}
    </View>
  );
}

export function formatServicesUpdatedAt(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export type EditableOfferingType = "software" | "service" | "both";

export const OFFERING_TYPE_OPTIONS: {
  value: EditableOfferingType;
  label: string;
  description: string;
}[] = [
  {
    value: "software",
    label: "Software",
    description: "Client operates the platform — tool license only.",
  },
  {
    value: "service",
    label: "Service",
    description: "Agency-managed operations — your team runs chat & services.",
  },
  {
    value: "both",
    label: "Software + Service",
    description: "Hybrid — client tools plus agency-managed operations.",
  },
];

export function deriveOfferingTypeFromModuleCodes(
  moduleCodes: string[],
  catalogModules: { code: string; category: "software" | "service" }[],
): OfferingType {
  if (!moduleCodes.length) return "none";
  const byCode = new Map(catalogModules.map((m) => [m.code, m.category]));
  let hasSoftware = false;
  let hasService = false;
  for (const code of moduleCodes) {
    const category = byCode.get(code);
    if (category === "software") hasSoftware = true;
    if (category === "service") hasService = true;
  }
  if (hasSoftware && hasService) return "both";
  if (hasService) return "service";
  if (hasSoftware) return "software";
  return "none";
}

export function toEditableOfferingType(type: OfferingType): EditableOfferingType {
  if (type === "software" || type === "service" || type === "both") return type;
  return "both";
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipOutlined: {
    borderColor: tokens.colors.cardBorder,
    backgroundColor: "transparent",
  },
  chipAccent: {
    borderColor: `${tokens.colors.accentBlue}40`,
    backgroundColor: `${tokens.colors.accentBlue}20`,
  },
});
