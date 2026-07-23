import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Checkbox, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAppTheme } from "@/theme";
import {
  getResellerModules,
  getResellerModulesCatalog,
  putResellerModules,
  type SellableModuleCatalogItem,
} from "@/api/companies/reseller-modules.api";
import { OFFERING_TYPE_OPTIONS, type EditableOfferingType } from "@/features/services/components/services-shared";

export type ResellerModulesPanelProps = {
  resellerId: string;
  resellerName?: string;
  embedded?: boolean;
  readOnly?: boolean;
  promptOfferingType?: boolean;
  onSaved?: () => void;
  hideSaveButton?: boolean;
  saveButtonLabel?: string;
};

export type ResellerModulesPanelHandle = {
  save: () => Promise<boolean>;
};

function groupByCategory(modules: SellableModuleCatalogItem[]) {
  const software = modules.filter((m) => m.category === "software");
  const service = modules.filter((m) => m.category === "service");
  return { software, service };
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

export const ResellerModulesPanel = forwardRef<ResellerModulesPanelHandle, ResellerModulesPanelProps>(
  function ResellerModulesPanel(
    {
      resellerId,
      resellerName,
      embedded = false,
      readOnly = false,
      promptOfferingType = false,
      onSaved,
      hideSaveButton = false,
      saveButtonLabel = "Save modules",
    },
    ref,
  ) {
    const theme = useAppTheme();
    const qc = useQueryClient();
    const catalogQuery = useQuery({
      queryKey: ["companies", "reseller-modules", "catalog"],
      queryFn: getResellerModulesCatalog,
    });
    const currentQuery = useQuery({
      queryKey: ["companies", "reseller-modules", resellerId],
      queryFn: () => getResellerModules(resellerId),
      enabled: Boolean(resellerId),
    });

    const [selected, setSelected] = useState<Set<string> | null>(null);
    const [offeringType, setOfferingType] = useState<EditableOfferingType>("both");

    const serverCodes = useMemo(
      () => new Set(currentQuery.data?.data.moduleCodes ?? []),
      [currentQuery.data?.data.moduleCodes],
    );

    const modules = catalogQuery.data?.data.modules ?? [];
    const { software, service } = useMemo(() => groupByCategory(modules), [modules]);

    const effectiveSelected = selected ?? serverCodes;
    const dirty = selected !== null && !setsEqual(effectiveSelected, serverCodes);

    const toggle = (code: string) => {
      if (readOnly) return;
      const next = new Set(effectiveSelected);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      setSelected(next);
    };

    const saveMutation = useMutation({
      mutationFn: () => putResellerModules(resellerId, { moduleCodes: Array.from(effectiveSelected) }),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: ["companies", "reseller-modules", resellerId] });
        setSelected(null);
        onSaved?.();
      },
    });

    const save = useCallback(async (): Promise<boolean> => {
      if (readOnly) return true;
      if (!dirty) return true;
      try {
        await saveMutation.mutateAsync();
        return true;
      } catch (err) {
        Alert.alert("Could not save", extractApiErrorMessage(err));
        return false;
      }
    }, [dirty, readOnly, saveMutation]);

    useImperativeHandle(ref, () => ({ save }), [save]);

    if (catalogQuery.isLoading || currentQuery.isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.app.dashboard.accentBlue} />
        </View>
      );
    }

    const body = (
      <View style={{ gap: theme.spacing.lg }}>
        {resellerName && !embedded ? <Typography variant="medium16">{resellerName}</Typography> : null}

        {promptOfferingType ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Typography variant="small" muted>
              Offering type
            </Typography>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {OFFERING_TYPE_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="compact"
                  variant={offeringType === opt.value ? "primary" : "outlined"}
                  disabled={readOnly}
                  onPress={() => setOfferingType(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </View>
          </View>
        ) : null}

        <ModuleGroup
          title="Software modules"
          items={software}
          selected={effectiveSelected}
          readOnly={readOnly}
          onToggle={toggle}
 />
        <ModuleGroup
          title="Service modules"
          items={service}
          selected={effectiveSelected}
          readOnly={readOnly}
          onToggle={toggle}
 />

        {!readOnly && !hideSaveButton ? (
          <Button
            fullWidth
            disabled={saveMutation.isPending}
            loading={saveMutation.isPending}
            onPress={() => void save()}
          >
            {saveButtonLabel}
          </Button>
        ) : null}
      </View>
    );

    if (embedded) return body;
    return <ScrollView contentContainerStyle={{ gap: theme.spacing.lg }} showsVerticalScrollIndicator={false}>{body}</ScrollView>;
  },
);

function ModuleGroup({
  title,
  items,
  selected,
  readOnly,
  onToggle,
}: {
  title: string;
  items: SellableModuleCatalogItem[];
  selected: Set<string>;
  readOnly: boolean;
  onToggle: (code: string) => void;
}) {
  const theme = useAppTheme();
  if (items.length === 0) return null;
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Typography variant="small" muted>
        {title}
      </Typography>
      {items.map((mod) => (
        <Checkbox
          key={mod.code}
          checked={selected.has(mod.code)}
          disabled={readOnly}
          onChange={() => onToggle(mod.code)}
          label={mod.name}
 />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { paddingVertical: 32, alignItems: "center" },
});
