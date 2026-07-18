import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Button, Checkbox, SearchBar, Typography } from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { usePermissionsCatalogQuery } from '@/lib/hooks/query/access';
import {
  useReplaceUserPermissionOverridesMutation,
  useUserPermissionsQuery,
} from '@/lib/hooks/query/users';
import {
  extractPermissionsCatalogGroups,
  normalizePermissionGroupTitle,
  type PermissionGroup,
  type PermissionOption,
} from '@/lib/permissions/permissions-catalog';
import { glassUi } from '@/lib/theme/glass-ui';
import { extractUserPermissionOverrides } from '@/lib/users/user-permission-overrides';
import { useAppTheme } from '@/theme';

export type UserPermissionsEditorProps = {
  userId: string;
  onSaved?: () => void;
};

function dedupePermissions(list: PermissionOption[]): PermissionOption[] {
  const seen = new Set<string>();
  return list.filter((p) => (seen.has(p.code) ? false : (seen.add(p.code), true)));
}

export function UserPermissionsEditor({ userId, onSaved }: UserPermissionsEditorProps) {
  const theme = useAppTheme();
  const trimmedId = userId.trim();
  const [permissionSearch, setPermissionSearch] = useState('');
  const [allowedMap, setAllowedMap] = useState<Record<string, boolean>>({});
  const [directDenied, setDirectDenied] = useState<string[]>([]);
  const [effectiveAllowedSet, setEffectiveAllowedSet] = useState<Set<string>>(new Set());

  const permissionsCatalogQuery = usePermissionsCatalogQuery(
    { groupByType: true },
    { enabled: trimmedId.length > 0, scope: 'user-permissions-page' },
  );
  const userPermissionsQuery = useUserPermissionsQuery(trimmedId, {
    enabled: trimmedId.length > 0,
    scope: 'user-permissions-page',
  });
  const replaceMutation = useReplaceUserPermissionOverridesMutation();

  const permissionGroups: PermissionGroup[] = useMemo(
    () => extractPermissionsCatalogGroups(permissionsCatalogQuery.data),
    [permissionsCatalogQuery.data],
  );

  const allCodes = useMemo(() => {
    const set = new Set<string>();
    for (const g of permissionGroups) for (const p of g.permissions) set.add(p.code);
    return Array.from(set).sort();
  }, [permissionGroups]);

  const filteredGroups = useMemo(() => {
    const q = permissionSearch.trim().toLowerCase();
    if (!q) return permissionGroups;
    return permissionGroups
      .map((g) => ({
        ...g,
        permissions: g.permissions.filter(
          (p) =>
            p.code.toLowerCase().includes(q) || p.label.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.permissions.length > 0);
  }, [permissionGroups, permissionSearch]);

  const operationalPermissions = useMemo(() => {
    const list: PermissionOption[] = [];
    for (const g of filteredGroups) {
      if (normalizePermissionGroupTitle(g.title) !== 'Operational permissions') continue;
      list.push(...g.permissions);
    }
    return dedupePermissions(list);
  }, [filteredGroups]);

  const pagePermissions = useMemo(() => {
    const list: PermissionOption[] = [];
    for (const g of filteredGroups) {
      if (normalizePermissionGroupTitle(g.title) !== 'Page permissions') continue;
      list.push(...g.permissions);
    }
    return dedupePermissions(list);
  }, [filteredGroups]);

  useEffect(() => {
    setPermissionSearch('');
    setAllowedMap({});
    setDirectDenied([]);
    setEffectiveAllowedSet(new Set());
  }, [trimmedId]);

  useEffect(() => {
    if (!allCodes.length) return;
    setAllowedMap((prev) => {
      const next = { ...prev };
      for (const code of allCodes) if (next[code] == null) next[code] = false;
      return next;
    });
  }, [allCodes]);

  useEffect(() => {
    if (!trimmedId) return;
    if (!userPermissionsQuery.isSuccess) return;
    if (!permissionGroups.length || !allCodes.length) return;

    const { directAllowed, directDenied: loadedDenied, effectiveAllowed } =
      extractUserPermissionOverrides(userPermissionsQuery.data);

    const lookup = new Map<string, string>();
    for (const g of permissionGroups) {
      for (const p of g.permissions) {
        lookup.set(p.code.toLowerCase(), p.code);
        lookup.set(p.label.toLowerCase(), p.code);
      }
    }
    for (const code of allCodes) {
      const k = code.toLowerCase();
      if (!lookup.has(k)) lookup.set(k, code);
    }

    const mapCodes = (input: string[]) =>
      input
        .map((c) => lookup.get(c.toLowerCase()) ?? c)
        .filter((c) => typeof c === 'string' && c.trim().length > 0);

    const mappedAllowed = mapCodes(directAllowed);
    const mappedDenied = mapCodes(loadedDenied);
    const mappedEffective = mapCodes(effectiveAllowed);

    setDirectDenied(Array.from(new Set(mappedDenied)).sort());
    setEffectiveAllowedSet(new Set(mappedEffective));
    setAllowedMap(() => {
      const next: Record<string, boolean> = {};
      for (const code of allCodes) next[code] = false;
      for (const code of mappedAllowed) next[code] = true;
      return next;
    });
  }, [
    trimmedId,
    userPermissionsQuery.isSuccess,
    userPermissionsQuery.data,
    permissionGroups,
    allCodes,
  ]);

  const selectedAllowed = useMemo(
    () => allCodes.filter((c) => allowedMap[c]),
    [allCodes, allowedMap],
  );
  const effectiveAllowedCount = useMemo(
    () => allCodes.filter((c) => effectiveAllowedSet.has(c)).length,
    [allCodes, effectiveAllowedSet],
  );

  const isSaving = replaceMutation.isPending;
  const isLoading =
    permissionsCatalogQuery.isLoading ||
    userPermissionsQuery.isLoading ||
    userPermissionsQuery.isFetching;

  const errorMessage =
    (permissionsCatalogQuery.isError
      ? extractApiErrorMessage(permissionsCatalogQuery.error, 'Could not load permissions.')
      : null) ??
    (userPermissionsQuery.isError
      ? extractApiErrorMessage(userPermissionsQuery.error, 'Could not load user permissions.')
      : null);

  const toggleAllowed = (code: string) => {
    setAllowedMap((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const handleSave = async () => {
    if (!trimmedId) return;
    try {
      await replaceMutation.mutateAsync({
        id: trimmedId,
        body: {
          allowedPermissionNames: selectedAllowed,
          deniedPermissionNames: directDenied,
        },
      });
      Alert.alert('Saved', 'User permissions updated.');
      onSaved?.();
      void userPermissionsQuery.refetch();
    } catch (err) {
      Alert.alert('Save failed', extractApiErrorMessage(err, 'Could not update user permissions.'));
    }
  };

  const renderColumn = (title: string, items: PermissionOption[]) => (
    <View
      style={[
        styles.column,
        {
          borderColor: theme.app.dashboard.cardBorder,
          backgroundColor: theme.app.dashboard.overlayLight,
        },
      ]}
    >
      <View style={styles.columnHeader}>
        <Typography variant="small" style={{ fontWeight: '800', letterSpacing: 0.4 }}>
          {title}
        </Typography>
        <Typography variant="small" muted>
          {items.length}
        </Typography>
      </View>
      <View style={{ gap: 6 }}>
        {items.length === 0 ? (
          <Typography variant="small" muted>
            No matches.
          </Typography>
        ) : (
          items.map((p) => {
            const checked = Boolean(allowedMap[p.code]);
            return (
              <Pressable
                key={p.code}
                onPress={() => toggleAllowed(p.code)}
                style={({ pressed }) => [
                  styles.permRow,
                  {
                    borderColor: checked
                      ? 'rgba(34, 197, 94, 0.28)'
                      : theme.app.dashboard.cardBorder,
                    backgroundColor: checked
                      ? 'rgba(34, 197, 94, 0.10)'
                      : theme.app.dashboard.overlayLight,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <Checkbox checked={checked} onChange={() => toggleAllowed(p.code)} />
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Typography variant="small" style={{ fontWeight: '600' }} numberOfLines={2}>
                    {p.label}
                  </Typography>
                  <Typography variant="small" muted numberOfLines={1}>
                    {p.code}
                  </Typography>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );

  return (
    <View style={{ gap: 12 }}>
      <SearchBar
        value={permissionSearch}
        onChange={setPermissionSearch}
        placeholder="Search permissions (e.g. user:create)"
      />

      <View style={styles.statsRow}>
        <View
          style={[
            styles.statChip,
            {
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              borderColor: 'rgba(34, 197, 94, 0.35)',
            },
          ]}
        >
          <Typography variant="small">Direct allow: {selectedAllowed.length}</Typography>
        </View>
        <View
          style={[
            styles.statChip,
            {
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              borderColor: 'rgba(239, 68, 68, 0.35)',
            },
          ]}
        >
          <Typography variant="small">Effective: {effectiveAllowedCount}</Typography>
        </View>
        <View
          style={[
            styles.statChip,
            {
              backgroundColor: `${theme.app.dashboard.accentBlue}18`,
              borderColor: glassUi.border.subtle,
            },
          ]}
        >
          <Typography variant="small">Total: {allCodes.length}</Typography>
        </View>
      </View>

      {errorMessage ? (
        <Typography variant="small" color={theme.app.danger}>
          {errorMessage}
        </Typography>
      ) : null}

      <View
        style={[
          styles.matrixCard,
          {
            borderColor: theme.app.dashboard.cardBorder,
            backgroundColor: theme.app.dashboard.overlayLight,
          },
        ]}
      >
        {isLoading && !userPermissionsQuery.data ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.app.dashboard.accentBlue} />
            <Typography variant="small" muted>
              Loading permissions…
            </Typography>
          </View>
        ) : filteredGroups.length === 0 ? (
          <Typography variant="small" muted>
            No permissions match your search.
          </Typography>
        ) : (
          <View style={{ gap: 12 }}>
            <Typography variant="small" muted>
              Checked = direct ALLOW override. Unchecked inherits from role unless explicitly denied.
            </Typography>
            {renderColumn('OPERATIONAL', operationalPermissions)}
            {renderColumn('PAGE', pagePermissions)}
          </View>
        )}
      </View>

      <Button
        onPress={() => void handleSave()}
        disabled={!trimmedId || isSaving || isLoading}
      >
        {isSaving ? 'Saving…' : 'Save changes'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  matrixCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    minHeight: 180,
  },
  centered: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  column: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
});
