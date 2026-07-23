import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';

import { Button, Checkbox, FormModal, InputField, SearchBar, Typography } from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { extractNestFieldErrors } from '@/lib/companies/extract-nest-field-errors';
import { usePermissionsCatalogQuery } from '@/lib/hooks/query/access';
import {
  rolesKeys,
  useCreateRoleMutation,
  useReplaceRolePermissionsMutation,
  useRolePermissionsQuery,
  useRoleQuery,
  useUpdateRoleMutation,
} from '@/lib/hooks/query/roles';
import {
  CHAT_BUNDLE_OPTIONS,
  isChatBundleCode,
  isGranularChatPermissionCode,
  pickAssignedChatBundle,
  type ChatBundleCode,
} from '@/lib/permissions/chat-bundles';
import {
  appendDashboardWidgetToOrder,
  DASHBOARD_WIDGET_LABELS,
  inferDashboardWidgetOrderFromPermissionNames,
  mergeDashboardWidgetOrderForSelection,
  moveDashboardWidgetOrderItem,
  normalizeDashboardWidgetOrder,
  removeDashboardWidgetFromOrder,
} from '@/lib/permissions/dashboard-widget-layout';
import { isDashboardWidgetPermission } from '@/lib/permissions/dashboard-widget-permissions';
import type { DashboardWidgetPermission } from '@/lib/permissions/dashboard-widget-permissions';
import {
  fetchPermissionExpandPreview,
  PermissionExpansionUnavailableError,
  type PermissionExpandPreview,
} from '@/lib/permissions/expand-permission-names';
import {
  extractPermissionsCatalogGroups,
  type PermissionOption,
} from '@/lib/permissions/permissions-catalog';
import {
  buildSelectedPermissionSets,
  extractEquivalentPermissionNames,
  extractRoleDeniedPermissionNames,
  extractRoleEffectiveByType,
  extractRoleStoredPermissionNames,
} from '@/lib/permissions/role-permission-payload';
import {
  ensureRequiredViewPermissions,
  resolveMissingViewDependencies,
} from '@/lib/permissions/view-permission-dependencies';
import { asRecord } from '@/lib/users/user-list-rows';
import { useAppTheme } from '@/theme';

export type RoleFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editRole?: { id: string; name: string } | null;
};

type SelectionSets = { operational: Set<string>; pages: Set<string> };

function normalizeGroupTitle(title: string): 'operational' | 'page' | 'other' {
  const t = title.trim().toUpperCase();
  if (t.includes('PAGE')) return 'page';
  if (t.includes('OPERATIONAL')) return 'operational';
  return 'other';
}

function extractRoleNameFromDetail(payload: unknown): string {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const source = data ?? root;
  return String(source?.name ?? source?.roleName ?? '').trim();
}

function extractRoleDashboardWidgetOrder(payload: unknown): string[] {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const source = data ?? root;
  return normalizeDashboardWidgetOrder(
    source?.dashboardWidgetOrder ?? source?.dashboard_widget_order,
  );
}

function buildRolePermissionsSaveBody(params: {
  storedGrants: readonly string[];
  deniedGrants: readonly string[];
  checkedOperational: ReadonlySet<string>;
  checkedPages: ReadonlySet<string>;
  impliedGrants: ReadonlySet<string>;
}): { permissionNames: string[]; deniedPermissionNames: string[] } {
  const deniedSet = new Set(params.deniedGrants);
  const allowSet = new Set<string>();

  const isChecked = (code: string) =>
    code.startsWith('page:')
      ? params.checkedPages.has(code)
      : params.checkedOperational.has(code);

  const isPureImplied = (code: string) =>
    params.impliedGrants.has(code) && !params.storedGrants.includes(code);

  for (const code of params.storedGrants) {
    if (isChatBundleCode(code)) allowSet.add(code);
  }

  for (const code of [...params.checkedOperational, ...params.checkedPages]) {
    if (isPureImplied(code)) {
      deniedSet.delete(code);
      continue;
    }
    allowSet.add(code);
  }

  for (const code of params.storedGrants) {
    if (isChatBundleCode(code) || isPureImplied(code)) continue;
    if (isChecked(code)) allowSet.add(code);
  }

  for (const code of params.impliedGrants) {
    if (!isChecked(code)) deniedSet.add(code);
    else deniedSet.delete(code);
  }

  return {
    permissionNames: Array.from(allowSet).sort(),
    deniedPermissionNames: Array.from(deniedSet).sort(),
  };
}

export function RoleFormModal({
  open,
  onClose,
  onSaved,
  editRole = null,
}: RoleFormModalProps) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const queryClient = useQueryClient();
  const editId = editRole?.id?.trim() ?? '';
  const isEdit = editId.length > 0;

  const [roleName, setRoleName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [permissionSearch, setPermissionSearch] = useState('');
  const [storedGrants, setStoredGrants] = useState<string[]>([]);
  const [deniedGrants, setDeniedGrants] = useState<string[]>([]);
  const [checkedOperational, setCheckedOperational] = useState<Set<string>>(new Set());
  const [checkedPages, setCheckedPages] = useState<Set<string>>(new Set());
  const [impliedGrants, setImpliedGrants] = useState<Set<string>>(new Set());
  const [equivalentGrants, setEquivalentGrants] = useState<Set<string>>(new Set());
  const [chatBundle, setChatBundle] = useState<ChatBundleCode | null>(null);
  const [persistedStoredGrants, setPersistedStoredGrants] = useState<string[]>([]);
  const [dashboardWidgetOrder, setDashboardWidgetOrder] = useState<string[]>([]);
  const [isSavingRole, setIsSavingRole] = useState(false);

  const hydratedKeyRef = useRef<string | null>(null);
  const hydratedPermsForRoleIdRef = useRef<string | null>(null);
  const previewRequestIdRef = useRef(0);
  const expansionWarningShownRef = useRef(false);

  const permissionsCatalogQuery = usePermissionsCatalogQuery(
    { groupByType: true },
    { enabled: open, scope: 'role-modal' },
  );
  const rolePermissionsQuery = useRolePermissionsQuery(editId, {
    enabled: open && isEdit,
    scope: 'role-modal',
    skipGlobalToast: true,
  });
  const roleDetailQuery = useRoleQuery(editId, {
    enabled: open && isEdit,
    scope: 'role-modal',
    skipGlobalToast: true,
  });

  const createMutation = useCreateRoleMutation();
  const updateMutation = useUpdateRoleMutation();
  const replacePermissionsMutation = useReplaceRolePermissionsMutation();

  const permissionGroups = useMemo(
    () => extractPermissionsCatalogGroups(permissionsCatalogQuery.data),
    [permissionsCatalogQuery.data],
  );

  const { catalogOperational, catalogPage, catalogDashboardWidgets } = useMemo(() => {
    const operational: PermissionOption[] = [];
    const dashboardWidgets: PermissionOption[] = [];
    const page: PermissionOption[] = [];
    const seen = new Set<string>();

    for (const group of permissionGroups) {
      const bucket = normalizeGroupTitle(group.title);
      for (const perm of group.permissions) {
        if (isChatBundleCode(perm.code) || seen.has(perm.code)) continue;
        seen.add(perm.code);
        const isPageCode = perm.code.startsWith('page:') || bucket === 'page';
        if (isPageCode) page.push(perm);
        else if (isDashboardWidgetPermission(perm.code)) dashboardWidgets.push(perm);
        else operational.push(perm);
      }
    }

    const byLabel = (a: PermissionOption, b: PermissionOption) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
    operational.sort(byLabel);
    dashboardWidgets.sort(byLabel);
    page.sort(byLabel);
    return {
      catalogOperational: operational,
      catalogPage: page,
      catalogDashboardWidgets: dashboardWidgets,
    };
  }, [permissionGroups]);

  const mapPermissionCodesToCatalog = useCallback(
    (codes: string[]) => {
      const lookup = new Map<string, string>();
      for (const perm of [...catalogOperational, ...catalogDashboardWidgets, ...catalogPage]) {
        lookup.set(perm.code.toLowerCase(), perm.code);
        lookup.set(perm.label.toLowerCase(), perm.code);
      }
      return codes
        .map((code) => lookup.get(code.toLowerCase()) ?? code)
        .filter((code) => code.length > 0);
    },
    [catalogOperational, catalogDashboardWidgets, catalogPage],
  );

  const filterCatalog = useCallback(
    (items: PermissionOption[]) => {
      const q = permissionSearch.trim().toLowerCase();
      if (!q) return items;
      return items.filter(
        (perm) =>
          perm.code.toLowerCase().includes(q) || perm.label.toLowerCase().includes(q),
      );
    },
    [permissionSearch],
  );

  const filteredDashboardWidgets = useMemo(
    () => filterCatalog(catalogDashboardWidgets),
    [catalogDashboardWidgets, filterCatalog],
  );
  const filteredOperational = useMemo(
    () => filterCatalog(catalogOperational),
    [catalogOperational, filterCatalog],
  );
  const filteredPage = useMemo(
    () => filterCatalog(catalogPage),
    [catalogPage, filterCatalog],
  );

  const selectedDashboardWidgetCodes = useMemo(
    () => [...checkedOperational].filter(isDashboardWidgetPermission),
    [checkedOperational],
  );

  const visibleDashboardWidgetOrder = useMemo(
    () =>
      mergeDashboardWidgetOrderForSelection(
        dashboardWidgetOrder,
        selectedDashboardWidgetCodes,
      ),
    [dashboardWidgetOrder, selectedDashboardWidgetCodes],
  );

  const draftAllowSet = useMemo(() => new Set(storedGrants), [storedGrants]);
  const deniedSet = useMemo(() => new Set(deniedGrants), [deniedGrants]);
  const persistedAllowSet = useMemo(
    () => new Set(persistedStoredGrants),
    [persistedStoredGrants],
  );

  const getSelectedPermissionNames = useCallback(
    (operational: Set<string>, pages: Set<string>) =>
      [...operational, ...pages].sort(),
    [],
  );

  const getAutoGrantHint = useCallback(
    (code: string): string => {
      if (equivalentGrants.has(code)) {
        return 'Already covered by another grant on this role';
      }
      if (chatBundle && (isGranularChatPermissionCode(code) || code.startsWith('qa:chat:'))) {
        return `Auto-granted by ${chatBundle}`;
      }
      const pageGate = storedGrants.find((grant) => grant.startsWith('page:'));
      if (impliedGrants.has(code) && pageGate) {
        return `Auto-granted by ${pageGate}`;
      }
      return 'Auto-granted by a bundle or page gate on this role';
    },
    [chatBundle, equivalentGrants, impliedGrants, storedGrants],
  );

  const selectedCodesForValidation = useMemo(
    () => [...checkedOperational, ...checkedPages],
    [checkedOperational, checkedPages],
  );
  const missingViewDependencies = useMemo(
    () => resolveMissingViewDependencies(selectedCodesForValidation),
    [selectedCodesForValidation],
  );

  const resolveSelectionSets = useCallback(
    (
      preview: PermissionExpandPreview,
      nextStored: string[],
      preserveSelection?: SelectionSets,
    ): SelectionSets => {
      if (preserveSelection) return preserveSelection;
      const mappedDenied = mapPermissionCodesToCatalog(preview.deniedPermissionNames);
      const mappedEquivalent = mapPermissionCodesToCatalog(preview.equivalentPermissionNames);
      const built = buildSelectedPermissionSets({
        stored: nextStored,
        denied: mappedDenied,
        effectiveOperational: mapPermissionCodesToCatalog(preview.operational),
        effectivePage: mapPermissionCodesToCatalog(preview.page),
        equivalent: mappedEquivalent,
      });
      return {
        operational: new Set(built.operational),
        pages: new Set(built.page),
      };
    },
    [mapPermissionCodesToCatalog],
  );

  const applyExpandMetadata = useCallback(
    (
      preview: PermissionExpandPreview,
      nextStored: string[],
      selection: SelectionSets,
    ) => {
      setCheckedOperational(new Set(selection.operational));
      setCheckedPages(new Set(selection.pages));
      setImpliedGrants(new Set(mapPermissionCodesToCatalog(preview.impliedPermissionNames)));
      setEquivalentGrants(new Set(mapPermissionCodesToCatalog(preview.equivalentPermissionNames)));
      setDeniedGrants(mapPermissionCodesToCatalog(preview.deniedPermissionNames));
      setChatBundle(pickAssignedChatBundle(nextStored));

      const widgetCodes = [...selection.operational].filter(isDashboardWidgetPermission);
      if (widgetCodes.length > 0) {
        setDashboardWidgetOrder((prev) => {
          const inferred = inferDashboardWidgetOrderFromPermissionNames([
            ...selection.operational,
            ...selection.pages,
            ...preview.impliedPermissionNames,
          ]);
          const baseOrder = prev.length > 0 ? prev : inferred;
          return mergeDashboardWidgetOrderForSelection(baseOrder, widgetCodes);
        });
      }
    },
    [mapPermissionCodesToCatalog],
  );

  const refreshExpandPreview = useCallback(
    async (nextStored: string[], preserveSelection?: SelectionSets) => {
      const nextSelected = preserveSelection
        ? getSelectedPermissionNames(preserveSelection.operational, preserveSelection.pages)
        : undefined;
      const reqId = ++previewRequestIdRef.current;
      try {
        const preview = await fetchPermissionExpandPreview(nextStored, nextSelected);
        if (reqId !== previewRequestIdRef.current) return;
        const selection = resolveSelectionSets(preview, nextStored, preserveSelection);
        applyExpandMetadata(preview, nextStored, selection);
      } catch (err) {
        if (reqId !== previewRequestIdRef.current) return;
        if (err instanceof PermissionExpansionUnavailableError) {
          const fallbackPreview: PermissionExpandPreview = {
            operational: [],
            page: [],
            impliedPermissionNames: [],
            equivalentPermissionNames: [],
            deniedPermissionNames: [],
            storedPermissionNames: [],
          };
          const selection = resolveSelectionSets(fallbackPreview, nextStored, preserveSelection);
          applyExpandMetadata(fallbackPreview, nextStored, selection);
          if (!expansionWarningShownRef.current) {
            expansionWarningShownRef.current = true;
            Alert.alert(
              'Preview unavailable',
              'Live permission preview needs POST /access/permissions/expand. Save the role to refresh implied permissions.',
            );
          }
          return;
        }
        Alert.alert(
          'Expand failed',
          extractApiErrorMessage(err, 'Could not preview expanded permissions.'),
        );
      }
    },
    [applyExpandMetadata, getSelectedPermissionNames, resolveSelectionSets],
  );

  useEffect(() => {
    if (!open) {
      hydratedKeyRef.current = null;
      hydratedPermsForRoleIdRef.current = null;
      return;
    }

    const key = isEdit ? `edit:${editId}` : 'add';
    if (hydratedKeyRef.current === key) return;
    hydratedKeyRef.current = key;

    setRoleName(isEdit ? (editRole?.name ?? '') : '');
    setFieldErrors({});
    setPermissionSearch('');
    setStoredGrants([]);
    setDeniedGrants([]);
    setCheckedOperational(new Set());
    setCheckedPages(new Set());
    setImpliedGrants(new Set());
    setEquivalentGrants(new Set());
    setChatBundle(null);
    hydratedPermsForRoleIdRef.current = null;
    expansionWarningShownRef.current = false;
    setPersistedStoredGrants([]);
    setDashboardWidgetOrder([]);
  }, [open, isEdit, editId, editRole]);

  useEffect(() => {
    if (!open || !isEdit) return;
    if (hydratedPermsForRoleIdRef.current === editId) return;
    if (!catalogOperational.length && !catalogDashboardWidgets.length && !catalogPage.length) {
      return;
    }

    const sourcePayload = rolePermissionsQuery.isSuccess
      ? rolePermissionsQuery.data
      : roleDetailQuery.isSuccess
        ? roleDetailQuery.data
        : null;
    if (!sourcePayload) return;

    const stored = mapPermissionCodesToCatalog(extractRoleStoredPermissionNames(sourcePayload));
    const denied = mapPermissionCodesToCatalog(extractRoleDeniedPermissionNames(sourcePayload));
    const effective = extractRoleEffectiveByType(sourcePayload);
    const equivalent = mapPermissionCodesToCatalog(
      extractEquivalentPermissionNames(sourcePayload),
    );
    const selection = buildSelectedPermissionSets({
      stored,
      denied,
      effectiveOperational: mapPermissionCodesToCatalog(effective.operational),
      effectivePage: mapPermissionCodesToCatalog(effective.page),
      equivalent,
    });

    setPersistedStoredGrants(stored);
    setStoredGrants(stored);
    setDeniedGrants(denied);
    setEquivalentGrants(new Set(equivalent));
    setChatBundle(pickAssignedChatBundle(stored));

    const selectionSets: SelectionSets = {
      operational: new Set(selection.operational),
      pages: new Set(selection.page),
    };
    setCheckedOperational(selectionSets.operational);
    setCheckedPages(selectionSets.pages);
    hydratedPermsForRoleIdRef.current = editId;

    if (roleDetailQuery.isSuccess && roleDetailQuery.data) {
      setDashboardWidgetOrder(
        normalizeDashboardWidgetOrder(extractRoleDashboardWidgetOrder(roleDetailQuery.data)),
      );
    }

    void refreshExpandPreview(stored, selectionSets);
  }, [
    open,
    isEdit,
    editId,
    rolePermissionsQuery.isSuccess,
    rolePermissionsQuery.data,
    roleDetailQuery.isSuccess,
    roleDetailQuery.data,
    catalogOperational.length,
    catalogDashboardWidgets.length,
    catalogPage.length,
    mapPermissionCodesToCatalog,
    refreshExpandPreview,
  ]);

  useEffect(() => {
    if (!open || !isEdit || !roleDetailQuery.isSuccess) return;
    const serverName = extractRoleNameFromDetail(roleDetailQuery.data);
    if (!serverName) return;
    setRoleName(serverName);
  }, [open, isEdit, roleDetailQuery.isSuccess, roleDetailQuery.data]);

  const handleSelectChatBundle = (code: ChatBundleCode) => {
    const nextStored = [
      ...storedGrants.filter((grant) => !isChatBundleCode(grant)),
      code,
    ];
    setStoredGrants(nextStored);
    void refreshExpandPreview(nextStored);
  };

  const isPureImpliedGrant = useCallback(
    (code: string) => impliedGrants.has(code) && !draftAllowSet.has(code),
    [impliedGrants, draftAllowSet],
  );

  const handlePermissionToggle = (code: string, checked: boolean) => {
    if (equivalentGrants.has(code) || isChatBundleCode(code)) return;

    const isPage = code.startsWith('page:');
    const nextOperational = new Set(checkedOperational);
    const nextPages = new Set(checkedPages);
    let nextStored = [...storedGrants];
    const nextDenied = deniedGrants.filter((grant) => grant !== code);
    const pureImplied = isPureImpliedGrant(code);

    if (checked) {
      if (isPage) nextPages.add(code);
      else nextOperational.add(code);
      if (!pureImplied && !nextStored.includes(code)) nextStored.push(code);
    } else {
      if (isPage) nextPages.delete(code);
      else nextOperational.delete(code);
      if (pureImplied) nextDenied.push(code);
      else nextStored = nextStored.filter((grant) => grant !== code);
    }

    const selectionSets: SelectionSets = {
      operational: nextOperational,
      pages: nextPages,
    };
    setCheckedOperational(nextOperational);
    setCheckedPages(nextPages);
    setStoredGrants(Array.from(new Set(nextStored)).sort());
    setDeniedGrants(Array.from(new Set(nextDenied)).sort());
    if (isDashboardWidgetPermission(code)) {
      setDashboardWidgetOrder((prev) =>
        checked
          ? appendDashboardWidgetToOrder(prev, code)
          : removeDashboardWidgetFromOrder(prev, code),
      );
    }
    void refreshExpandPreview(Array.from(new Set(nextStored)).sort(), selectionSets);
  };

  const handleAddMissingViewDependencies = () => {
    if (missingViewDependencies.length === 0) return;
    const nextOperational = new Set(checkedOperational);
    const nextPages = new Set(checkedPages);
    const nextStored = [...storedGrants];
    const missingSet = new Set(missingViewDependencies);
    const nextDenied = deniedGrants.filter((grant) => !missingSet.has(grant));

    for (const code of missingViewDependencies) {
      const isPage = code.startsWith('page:');
      const pureImplied = isPureImpliedGrant(code);
      if (isPage) nextPages.add(code);
      else nextOperational.add(code);
      if (!pureImplied && !nextStored.includes(code)) nextStored.push(code);
    }

    const selectionSets: SelectionSets = {
      operational: nextOperational,
      pages: nextPages,
    };
    setCheckedOperational(nextOperational);
    setCheckedPages(nextPages);
    setStoredGrants(Array.from(new Set(nextStored)).sort());
    setDeniedGrants(Array.from(new Set(nextDenied)).sort());
    void refreshExpandPreview(Array.from(new Set(nextStored)).sort(), selectionSets);
  };

  const handleSectionSelectAll = (items: PermissionOption[], selectAll: boolean) => {
    const toggleableCodes = items
      .filter((perm) => !equivalentGrants.has(perm.code) && !isChatBundleCode(perm.code))
      .map((perm) => perm.code);
    if (toggleableCodes.length === 0) return;

    const toggleableSet = new Set(toggleableCodes);
    const nextOperational = new Set(checkedOperational);
    const nextPages = new Set(checkedPages);
    let nextStored = [...storedGrants];
    const nextDenied = deniedGrants.filter((grant) => !toggleableSet.has(grant));

    for (const code of toggleableCodes) {
      const isPage = code.startsWith('page:');
      const pureImplied = isPureImpliedGrant(code);
      if (selectAll) {
        if (isPage) nextPages.add(code);
        else nextOperational.add(code);
        if (!pureImplied && !nextStored.includes(code)) nextStored.push(code);
      } else {
        if (isPage) nextPages.delete(code);
        else nextOperational.delete(code);
        if (pureImplied) nextDenied.push(code);
        else nextStored = nextStored.filter((grant) => grant !== code);
      }
    }

    const selectionSets: SelectionSets = {
      operational: nextOperational,
      pages: nextPages,
    };
    setCheckedOperational(nextOperational);
    setCheckedPages(nextPages);
    setStoredGrants(Array.from(new Set(nextStored)).sort());
    setDeniedGrants(Array.from(new Set(nextDenied)).sort());
    void refreshExpandPreview(Array.from(new Set(nextStored)).sort(), selectionSets);
  };

  const detailError =
    (permissionsCatalogQuery.isError
      ? extractApiErrorMessage(
          permissionsCatalogQuery.error,
          'Could not load permissions catalog.',
        )
      : null) ??
    (roleDetailQuery.isError
      ? extractApiErrorMessage(roleDetailQuery.error, 'Could not load role details.')
      : null) ??
    (rolePermissionsQuery.isError
      ? extractApiErrorMessage(rolePermissionsQuery.error, 'Could not load role permissions.')
      : null);

  const isLoading =
    permissionsCatalogQuery.isLoading ||
    permissionsCatalogQuery.isFetching ||
    (isEdit &&
      (roleDetailQuery.isLoading ||
        roleDetailQuery.isFetching ||
        rolePermissionsQuery.isLoading ||
        rolePermissionsQuery.isFetching));

  const isSaving =
    isSavingRole ||
    createMutation.isPending ||
    updateMutation.isPending ||
    replacePermissionsMutation.isPending;

  const handleSave = async () => {
    const name = roleName.trim();
    if (!name) {
      setFieldErrors({ name: 'Please enter a role name.', roleName: 'Please enter a role name.' });
      return;
    }

    const permissionsBody = buildRolePermissionsSaveBody({
      storedGrants,
      deniedGrants,
      checkedOperational,
      checkedPages,
      impliedGrants,
    });
    const widgetOrder = mergeDashboardWidgetOrderForSelection(
      dashboardWidgetOrder,
      selectedDashboardWidgetCodes,
    );

    if (permissionsBody.permissionNames.length === 0) {
      Alert.alert('Validation', 'Please select at least one permission.');
      return;
    }

    const ensuredPermissions = ensureRequiredViewPermissions(permissionsBody.permissionNames);
    const savePermissionsBody = {
      ...permissionsBody,
      permissionNames: ensuredPermissions.permissionNames,
    };

    setFieldErrors({});
    setIsSavingRole(true);
    try {
      if (ensuredPermissions.added.length > 0) {
        Alert.alert(
          'Added required views',
          `Added: ${ensuredPermissions.added.join(', ')}`,
        );
      }
      if (!isEdit) {
        await createMutation.mutateAsync({
          name,
          ...savePermissionsBody,
          dashboardWidgetOrder: widgetOrder,
        });
      } else {
        await replacePermissionsMutation.mutateAsync({
          id: editId,
          body: {
            ...savePermissionsBody,
            dashboardWidgetOrder: widgetOrder,
          },
        });
        const serverName =
          extractRoleNameFromDetail(roleDetailQuery.data) ?? editRole?.name ?? '';
        if (serverName.trim() !== name) {
          await updateMutation.mutateAsync({ id: editId, body: { name } });
        }
      }
      await queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      onSaved?.();
      onClose();
    } catch (err) {
      const fields = extractNestFieldErrors(err);
      if (fields.name && !fields.roleName) fields.roleName = fields.name;
      if (fields.roleName && !fields.name) fields.name = fields.roleName;
      if (Object.keys(fields).length > 0) setFieldErrors(fields);
      Alert.alert('Save failed', extractApiErrorMessage(err, 'Could not save role.'));
    } finally {
      setIsSavingRole(false);
    }
  };

  const renderSection = (
    title: string,
    items: PermissionOption[],
    checkedSet: Set<string>,
  ) => {
    const toggleableItems = items.filter(
      (perm) => !equivalentGrants.has(perm.code) && !isChatBundleCode(perm.code),
    );
    const allSelected =
      toggleableItems.length > 0 &&
      toggleableItems.every((perm) => checkedSet.has(perm.code));

    return (
      <View
        style={[
          styles.sectionCard,
          {
            borderColor: theme.app.dashboard.cardBorder,
            backgroundColor: theme.app.dashboard.overlayLight,
          },
        ]}
      >
        <Typography variant="small" style={{ fontWeight: '800' }}>
          {title}
        </Typography>
        {items.length === 0 ? (
          <Typography variant="small" muted>
            No permissions match your search.
          </Typography>
        ) : (
          <View style={{ gap: 6 }}>
            {toggleableItems.length > 0 ? (
              <Pressable
                onPress={() => handleSectionSelectAll(items, !allSelected)}
                disabled={isSaving}
                style={[
                  styles.selectAllRow,
                  { borderBottomColor: theme.app.dashboard.cardBorder },
                ]}
              >
                <Checkbox
                  checked={allSelected}
                  disabled={isSaving}
                  onChange={(next) => handleSectionSelectAll(items, next)}
                />
                <Typography variant="small" style={{ fontWeight: '600' }}>
                  Select all
                </Typography>
              </Pressable>
            ) : null}
            {items.map((perm) => {
              const checked = checkedSet.has(perm.code);
              const locked = equivalentGrants.has(perm.code);
              const implied = impliedGrants.has(perm.code);
              const denied = deniedSet.has(perm.code);
              const savedInDb = persistedAllowSet.has(perm.code);
              const hint = locked
                ? getAutoGrantHint(perm.code)
                : implied && checked
                  ? getAutoGrantHint(perm.code)
                  : implied && denied
                    ? 'Denied for this role (bundle or page gate stays assigned)'
                    : savedInDb
                      ? 'Saved on this role'
                      : undefined;
              return (
                <Pressable
                  key={perm.code}
                  disabled={isSaving || locked}
                  onPress={() => handlePermissionToggle(perm.code, !checked)}
                  style={({ pressed }) => [
                    styles.permRow,
                    {
                      borderColor: checked
                        ? `${accent}55`
                        : theme.app.dashboard.cardBorder,
                      backgroundColor: checked ? `${accent}14` : 'transparent',
                      opacity: locked ? 0.88 : pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Checkbox
                    checked={checked}
                    disabled={isSaving || locked}
                    onChange={(next) => handlePermissionToggle(perm.code, next)}
                  />
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Typography variant="small" style={{ fontWeight: '600' }}>
                      {perm.label}
                    </Typography>
                    <Typography variant="small" muted>
                      {perm.code}
                    </Typography>
                    {hint ? (
                      <Typography
                        variant="small"
                        color={locked ? theme.app.dashboard.accentCyan : undefined}
                        muted={!locked}
                      >
                        {hint}
                      </Typography>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <FormModal
      open={open}
      title={isEdit ? 'Edit Role' : 'Add Role'}
      description={
        isEdit
          ? 'Update role name and permissions. Changes take effect immediately.'
          : 'Create a role and assign permissions.'
      }
      onClose={onClose}
      onSave={() => void handleSave()}
      primaryButtonLabel={isEdit ? 'Save changes' : 'Create role'}
      primaryButtonDisabled={
        isSaving || isLoading || Boolean(detailError) || missingViewDependencies.length > 0
      }
      cancelButtonLabel="Cancel"
    >
      {detailError ? (
        <Typography variant="medium" color={theme.app.danger}>
          {detailError}
        </Typography>
      ) : isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={accent} />
          <Typography variant="small" muted>
            Loading permissions…
          </Typography>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          <InputField
            label="Role Name"
            placeholder="e.g. Support Agent"
            value={roleName}
            onChangeText={(text) => {
              setFieldErrors((prev) => {
                if (!prev.name && !prev.roleName) return prev;
                const next = { ...prev };
                delete next.name;
                delete next.roleName;
                return next;
              });
              setRoleName(text);
            }}
            editable={!isSaving}
            error={Boolean(fieldErrors.name?.trim() || fieldErrors.roleName?.trim())}
            helperText={fieldErrors.name?.trim() || fieldErrors.roleName?.trim() || undefined}
          />

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Permissions
          </Typography>

          <View
            style={[
              styles.sectionCard,
              {
                borderColor: theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
              },
            ]}
          >
            <Typography variant="small" style={{ fontWeight: '800' }}>
              Chat access (pick one bundle)
            </Typography>
            <Typography variant="small" muted>
              Bundles stay in permissionNames. Unchecking auto-granted permissions adds them to
              deniedPermissionNames without removing the bundle.
            </Typography>
            <View style={{ gap: 8 }}>
              {CHAT_BUNDLE_OPTIONS.map((opt) => {
                const selected = chatBundle === opt.code;
                return (
                  <Pressable
                    key={opt.code}
                    disabled={isSaving}
                    onPress={() => handleSelectChatBundle(opt.code)}
                    style={({ pressed }) => [
                      styles.bundleRow,
                      {
                        borderColor: selected ? accent : theme.app.dashboard.cardBorder,
                        backgroundColor: selected ? `${accent}14` : 'transparent',
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        { borderColor: selected ? accent : theme.app.dashboard.cardBorder },
                      ]}
                    >
                      {selected ? (
                        <View style={[styles.radioInner, { backgroundColor: accent }]} />
                      ) : null}
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Typography variant="small" style={{ fontWeight: '700' }}>
                        {opt.label}
                      </Typography>
                      <Typography variant="small" muted>
                        {opt.description}
                      </Typography>
                      <Typography variant="small" muted style={{ fontFamily: 'monospace' }}>
                        {opt.code}
                      </Typography>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Typography variant="small" style={{ fontWeight: '700' }}>
              Search permissions
            </Typography>
            <SearchBar
              value={permissionSearch}
              onChange={setPermissionSearch}
              placeholder="Type to search (e.g. page:roles, chat:bundle:agent)"
            />
          </View>

          {missingViewDependencies.length > 0 ? (
            <View
              style={[
                styles.warningCard,
                {
                  borderColor: 'rgba(245, 158, 11, 0.55)',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                },
              ]}
            >
              <Typography variant="small" style={{ fontWeight: '700' }} color="#F59E0B">
                Missing required view permission(s)
              </Typography>
              <Typography variant="small" muted>
                Please also select: {missingViewDependencies.join(', ')}
              </Typography>
              <Button size="compact" variant="secondary" onPress={handleAddMissingViewDependencies}>
                Add required view permissions
              </Button>
            </View>
          ) : null}

          <View
            style={[
              styles.sectionCard,
              {
                borderColor: theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
              },
            ]}
          >
            <Typography variant="small" style={{ fontWeight: '800' }}>
              Dashboard layout (top → bottom)
            </Typography>
            <Typography variant="small" muted>
              Cards on /dashboard appear in this order for users with this role. Select dashboard
              widgets below to arrange their order on the home screen.
            </Typography>
            {visibleDashboardWidgetOrder.length === 0 ? (
              <Typography variant="small" muted>
                Select dashboard widgets below to arrange their order on the home screen.
              </Typography>
            ) : (
              <View style={{ gap: 6 }}>
                {visibleDashboardWidgetOrder.map((code, index) => {
                  const label =
                    DASHBOARD_WIDGET_LABELS[code as DashboardWidgetPermission] ?? code;
                  return (
                    <View
                      key={code}
                      style={[
                        styles.orderRow,
                        {
                          borderColor: theme.app.dashboard.cardBorder,
                          backgroundColor: theme.app.dashboard.overlayLight,
                        },
                      ]}
                    >
                      <View style={[styles.orderBadge, { backgroundColor: `${accent}22` }]}>
                        <Typography variant="small" color={accent} style={{ fontWeight: '800' }}>
                          {index + 1}
                        </Typography>
                      </View>
                      <Typography variant="small" style={{ flex: 1, fontWeight: '600' }}>
                        {label}
                      </Typography>
                      <Pressable
                        disabled={isSaving || index === 0}
                        onPress={() =>
                          setDashboardWidgetOrder(
                            moveDashboardWidgetOrderItem(visibleDashboardWidgetOrder, code, 'up'),
                          )
                        }
                        hitSlop={6}
                        style={{ opacity: index === 0 ? 0.35 : 1 }}
                      >
                        <Ionicons name="arrow-up" size={18} color={accent} />
                      </Pressable>
                      <Pressable
                        disabled={
                          isSaving || index === visibleDashboardWidgetOrder.length - 1
                        }
                        onPress={() =>
                          setDashboardWidgetOrder(
                            moveDashboardWidgetOrderItem(
                              visibleDashboardWidgetOrder,
                              code,
                              'down',
                            ),
                          )
                        }
                        hitSlop={6}
                        style={{
                          opacity:
                            index === visibleDashboardWidgetOrder.length - 1 ? 0.35 : 1,
                        }}
                      >
                        <Ionicons name="arrow-down" size={18} color={accent} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {renderSection('Dashboard widgets', filteredDashboardWidgets, checkedOperational)}
          {renderSection('Operational permissions', filteredOperational, checkedOperational)}
          {renderSection('Page permissions', filteredPage, checkedPages)}
        </View>
      )}
    </FormModal>
  );
}

const styles = StyleSheet.create({
  centered: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  bundleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    marginBottom: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  warningCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  orderBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
});
