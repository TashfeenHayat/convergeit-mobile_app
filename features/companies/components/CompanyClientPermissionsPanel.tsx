import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { AppCard, Button, Checkbox, InputField, Typography } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { OP } from "@/lib/permissions/operational-keys";
import {
  CHAT_CLIENT_CAP_PRESET_LABELS,
  CHAT_CLIENT_CAP_PRESET_NAMES,
} from "@/lib/permissions/chat-client-cap-preset";
import { CHAT_BUNDLE_OPTIONS } from "@/lib/permissions/chat-bundles";
import {
  useClientPermissionsQuery,
  useReplaceClientPermissionsMutation,
} from "@/lib/hooks/query/companies/client-permissions";
import { useAppTheme } from "@/theme";

const FULL_CHAT_PRESET = [...CHAT_CLIENT_CAP_PRESET_NAMES];

type Props = {
  parentCompanyId: string;
  parentCompanyName?: string;
};

/** Real RN port — mobile-simplified checklist replaces the web accordion + inline chip toggles. */
export function CompanyClientPermissionsPanel({ parentCompanyId, parentCompanyName }: Props) {
  const theme = useAppTheme();
  const { hasOperational } = useAuth();
  const canManage = hasOperational(OP.client.permissions);

  const id = parentCompanyId.trim();
  const query = useClientPermissionsQuery(id, { enabled: canManage && id.length > 0 });
  const replace = useReplaceClientPermissionsMutation(id);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) return;
    const next: Record<string, boolean> = {};
    for (const code of query.data) next[code] = true;
    setSelected(next);
  }, [query.data]);

  const capActive = (query.data?.length ?? 0) > 0;

  const toggleableCodes = useMemo(() => {
    const bundleCodes = CHAT_BUNDLE_OPTIONS.map((b) => b.code);
    return Array.from(new Set([...bundleCodes, ...FULL_CHAT_PRESET])).sort((a, b) =>
      a.localeCompare(b),
    );
  }, []);

  const filteredCodes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return toggleableCodes;
    return toggleableCodes.filter((code) => {
      const label = CHAT_CLIENT_CAP_PRESET_LABELS[code] ?? code;
      return code.toLowerCase().includes(q) || label.toLowerCase().includes(q);
    });
  }, [search, toggleableCodes]);

  const selectedNames = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);
  const dirty =
    query.isSuccess &&
    JSON.stringify([...selectedNames].sort()) !== JSON.stringify([...(query.data ?? [])].sort());

  if (!canManage) return null;

  const save = (names: string[]) => {
    setSavedMessage(null);
    replace.mutate(names, {
      onSuccess: () => setSavedMessage(names.length ? "Client permission cap saved" : "Permission cap removed"),
    });
  };

  return (
    <AppCard style={{ gap: theme.spacing.md }}>
      <View>
        <Typography variant="medium16" style={{ fontWeight: "700" }}>
          Client permission ceiling
        </Typography>
        <Typography variant="small" muted style={{ marginTop: 4 }}>
          {parentCompanyName
            ? `Limits what roles and users under "${parentCompanyName}" can ever receive.`
            : "Limits maximum permissions for users in this parent company org."}
          {!capActive ? " No cap is set — users follow role + reseller rules only." : ""}
        </Typography>
      </View>

      {query.isLoading ? (
        <Typography variant="small" muted>
          Loading cap…
        </Typography>
      ) : query.isError ? (
        <Typography variant="small" color={theme.app.danger}>
          Could not load client permissions.
        </Typography>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Button
              size="compact"
              variant="secondary"
              disabled={replace.isPending}
              onPress={() => {
                const next: Record<string, boolean> = {};
                for (const c of FULL_CHAT_PRESET) next[c] = true;
                setSelected(next);
              }}
            >
              Full chat preset
            </Button>
            <Button size="compact" variant="secondary" disabled={replace.isPending} onPress={() => setSelected({})}>
              Clear
            </Button>
            <Button
              size="compact"
              variant="danger"
              disabled={replace.isPending || !capActive}
              onPress={() => save([])}
            >
              Remove cap
            </Button>
          </View>

          <InputField
            label="Search permissions"
            value={search}
            onChangeText={setSearch}
            placeholder="e.g. chat:bundle:agent"
          />

          <View style={{ gap: 4, maxHeight: 320 }}>
            {filteredCodes.map((code) => (
              <Checkbox
                key={code}
                checked={Boolean(selected[code])}
                onChange={(checked) => setSelected((prev) => ({ ...prev, [code]: checked }))}
                label={CHAT_CLIENT_CAP_PRESET_LABELS[code] ?? code}
              />
            ))}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <Typography variant="small" muted>
              {selectedNames.length} code{selectedNames.length === 1 ? "" : "s"} selected
              {dirty ? " · unsaved" : ""}
            </Typography>
            <Button size="compact" disabled={replace.isPending || !dirty} onPress={() => save(selectedNames)}>
              {replace.isPending ? "Saving…" : "Save ceiling"}
            </Button>
          </View>

          {savedMessage ? (
            <Typography variant="small" color={theme.app.dashboard.accentGreen}>
              {savedMessage}
            </Typography>
          ) : null}
        </>
      )}
    </AppCard>
  );
}
