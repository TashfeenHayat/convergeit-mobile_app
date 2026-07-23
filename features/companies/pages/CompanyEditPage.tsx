import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import type { ParentCompanyChildDetail } from '@/api/types/companies.types';
import { MobileScreen } from '@/components/layout';
import {
  AppCard,
  Button,
  DashboardCard,
  InputField,
  PhoneInputField,
  LoadingScreen,
  SearchBar,
  StatusChip,
  Typography,
} from '@/components/ui';
import {
  ChildCompanyPocEditor,
  savedPocRowsFromChild,
  type ChildPocEditRow,
} from '@/features/companies/components/ChildCompanyPocEditor';
import {
  ChildCompanyWebsitesEditor,
  websitesFromChild,
  type ChildWebsiteEditRow,
} from '@/features/companies/components/ChildCompanyWebsitesEditor';
import { ResellerModulesPanel } from '@/features/companies/components/ResellerModulesPanel';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import {
  useParentCompanyQuery,
  useUpdateCompanyMutation,
  useUpdateParentCompanyMutation,
} from '@/lib/hooks/query/companies/hooks';
import { useDepartmentsListQuery } from '@/lib/hooks/query/hrms';
import { useRolesListQuery } from '@/lib/hooks/query/roles';
import { useUsersListQuery } from '@/lib/hooks/query/users';
import { canCompaniesModuleAction } from '@/lib/permissions';
import { glassUi } from '@/lib/theme/glass-ui';
import { getEmailValidationError, getRequiredError } from '@/lib/ui/form-validation';
import { formatPhoneInputValue, getPhoneValidationError } from '@/lib/ui/format-phone-input';
import { useAppTheme } from '@/theme';

export type CompanyEditSection = 'parent' | 'children' | 'services';

function parseSection(raw: string | string[] | undefined): CompanyEditSection {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'children' || value === 'services' || value === 'parent') return value;
  return 'parent';
}

function parseStep(raw: string | string[] | undefined): CompanyEditSection | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === '1') return 'parent';
  if (value === '2') return 'children';
  if (value === '3') return 'services';
  return null;
}

export function CompanyEditPage({
  parentId,
  initialSection,
}: {
  parentId: string;
  initialSection?: CompanyEditSection;
}) {
  const theme = useAppTheme();
  const router = useRouter();
  const { hasPage, hasOperational } = useAuth();
  const params = useLocalSearchParams<{ section?: string; step?: string }>();

  const canEdit = canCompaniesModuleAction(hasPage, hasOperational, 'update');
  const canViewServices =
    hasPage('page:resellers') || hasPage('page:clients') || hasPage('page:account-setup');

  const [section, setSection] = useState<CompanyEditSection>(
    () => initialSection ?? parseStep(params.step) ?? parseSection(params.section),
  );
  const [parentName, setParentName] = useState('');
  const [editingChild, setEditingChild] = useState<ParentCompanyChildDetail | null>(null);
  const [childName, setChildName] = useState('');
  const [childEmail, setChildEmail] = useState('');
  const [childPhone, setChildPhone] = useState('');
  const [childAddress, setChildAddress] = useState('');
  const [childPocs, setChildPocs] = useState<ChildPocEditRow[]>([]);
  const [childPocsTouched, setChildPocsTouched] = useState(false);
  const [childWebsites, setChildWebsites] = useState<ChildWebsiteEditRow[]>([]);
  const [childWebsitesTouched, setChildWebsitesTouched] = useState(false);
  const [childFormErrors, setChildFormErrors] = useState(false);
  const [childSearch, setChildSearch] = useState('');

  const query = useParentCompanyQuery(parentId);
  const updateParent = useUpdateParentCompanyMutation();
  const updateChild = useUpdateCompanyMutation();

  const payload = query.data?.data;
  const parent = payload?.parentCompany;
  const children = payload?.children ?? [];
  const resellerId = parent?.resellerId?.trim() || parent?.reseller?.id?.trim() || '';

  const filteredChildren = useMemo(() => {
    const q = childSearch.trim().toLowerCase();
    if (!q) return children;
    return children.filter((c) => {
      const hay = `${c.name ?? ''} ${c.email ?? ''} ${c.companyEmail ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [children, childSearch]);

  const childIndex = editingChild
    ? children.findIndex((c) => c.id === editingChild.id)
    : -1;

  const childDirty = Boolean(
    editingChild &&
      (childPocsTouched ||
        childWebsitesTouched ||
        childName.trim() !== (editingChild.name ?? '').trim() ||
        childEmail.trim() !==
          (editingChild.companyEmail ?? editingChild.email ?? '').trim() ||
        formatPhoneInputValue(childPhone) !==
          formatPhoneInputValue(editingChild.phone ?? '') ||
        childAddress.trim() !== (editingChild.address ?? '').trim()),
  );

  useEffect(() => {
    if (initialSection) {
      setSection(initialSection);
      return;
    }
    setSection(parseStep(params.step) ?? parseSection(params.section));
  }, [initialSection, params.section, params.step]);

  useEffect(() => {
    if (parent?.name) setParentName(parent.name);
  }, [parent?.name]);

  const selectChild = (child: ParentCompanyChildDetail) => {
    setEditingChild(child);
    setChildName(child.name ?? '');
    setChildEmail(child.companyEmail ?? child.email ?? '');
    setChildPhone(formatPhoneInputValue(child.phone ?? ''));
    setChildAddress(child.address ?? '');
    setChildPocs(savedPocRowsFromChild(child));
    setChildPocsTouched(false);
    setChildWebsites(websitesFromChild(child));
    setChildWebsitesTouched(false);
    setChildFormErrors(false);
  };

  const childrenIdsKey = useMemo(() => children.map((c) => c.id).join('|'), [children]);

  useEffect(() => {
    if (section !== 'children') return;
    if (children.length === 0) {
      setEditingChild(null);
      setChildPocs([]);
      setChildWebsites([]);
      return;
    }
    setEditingChild((current) => {
      if (current && children.some((c) => c.id === current.id)) return current;
      return null;
    });
  }, [section, childrenIdsKey, children]);

  useEffect(() => {
    if (section !== 'children' || editingChild || children.length === 0) return;
    selectChild(children[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only bootstrap selection when none
  }, [section, editingChild, childrenIdsKey]);

  const goToChildrenStep = () => {
    setSection('children');
    router.setParams({ step: '2' } as never);
  };

  const goToParentStep = () => {
    setSection('parent');
    router.setParams({ step: '1' } as never);
  };

  const step2Enabled = section === 'children' && parentId.trim().length > 0;
  useUsersListQuery(
    { parentCompanyId: parentId.trim(), all: true },
    { enabled: step2Enabled },
  );
  useRolesListQuery(undefined, { enabled: step2Enabled });
  useDepartmentsListQuery(
    {
      all: true,
      type: 'External',
      ...(resellerId ? { resellerId } : {}),
      parentCompanyId: parentId.trim(),
    },
    { enabled: step2Enabled && Boolean(resellerId) },
  );

  const saveParent = async () => {
    const name = parentName.trim();
    if (!name) {
      Alert.alert('Validation', 'Parent company name is required.');
      return;
    }
    try {
      await updateParent.mutateAsync({ parentId, body: { name } });
      Alert.alert('Saved', 'Parent company updated.');
    } catch (error) {
      Alert.alert('Update failed', extractApiErrorMessage(error, 'Could not update parent company.'));
    }
  };

  const saveChild = async () => {
    if (!editingChild || !canEdit) return;
    setChildFormErrors(true);
    const nameErr = getRequiredError(childName, 'Child company name');
    const emailErr = childEmail.trim()
      ? getEmailValidationError(childEmail)
      : null;
    const phoneErr = childPhone.trim()
      ? getPhoneValidationError(childPhone)
      : null;
    const firstError = nameErr || emailErr || phoneErr;
    if (firstError) {
      Alert.alert('Validation', firstError);
      return;
    }
    const body: Record<string, unknown> = {
      name: childName.trim(),
      email: childEmail.trim() || undefined,
      phone: childPhone.trim() ? formatPhoneInputValue(childPhone) : undefined,
      address: childAddress.trim() || undefined,
    };
    if (childPocsTouched) {
      body.pocs = childPocs.slice(0, 5).map((p) => ({
        ...(p.companyContactId ? { companyContactId: p.companyContactId } : {}),
        ...(p.userId ? { userId: p.userId } : {}),
        ...(p.pocInvite ? { pocInvite: p.pocInvite } : {}),
      }));
    }
    if (childWebsitesTouched) {
      body.websites = childWebsites
        .filter((w) => w.url.trim().length > 0)
        .map((w) => ({
          ...(w.id ? { id: w.id } : {}),
          url: w.url.trim(),
          ...(w.name.trim() ? { name: w.name.trim() } : {}),
        }));
    }
    const savedId = editingChild.id;
    try {
      await updateChild.mutateAsync({
        companyId: savedId,
        parentIdForList: parentId,
        body,
      });
      const refreshed = await query.refetch();
      const nextChildren = refreshed.data?.data?.children ?? [];
      const fresh = nextChildren.find((c) => c.id === savedId);
      if (fresh) {
        selectChild(fresh);
      } else {
        setChildPocsTouched(false);
        setChildFormErrors(false);
      }
      Alert.alert('Saved', 'Child company updated.');
    } catch (error) {
      Alert.alert('Update failed', extractApiErrorMessage(error, 'Could not update child company.'));
    }
  };

  if (query.isLoading) {
    return <LoadingScreen message="Loading company…" />;
  }

  if (query.isError || !parent) {
    return (
      <MobileScreen>
        <AppCard style={{ gap: 12 }}>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(query.error, 'Could not load company.')}
          </Typography>
          <Button size="compact" variant="outlined" onPress={() => void query.refetch()}>
            Retry
          </Button>
        </AppCard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
       showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => router.push('/companies' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Back to companies"
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: theme.app.dashboard.overlayLight,
              borderColor: theme.app.dashboard.cardBorder,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Typography variant="small" style={{ fontWeight: '600' }}>
            ← Back to companies
          </Typography>
        </Pressable>

        <Typography variant="small" muted>
          Companies / {parent.name} / Edit
        </Typography>

        <View style={styles.titleRow}>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Typography variant="boldLarge">Edit company</Typography>
            <Typography variant="medium" muted>
              Step 1 updates the parent name. Step 2 lets you edit each child company one at a
              time.
            </Typography>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View
            style={[
              styles.metaBadge,
              {
                backgroundColor: theme.app.dashboard.overlayLight,
                borderColor: theme.app.dashboard.cardBorder,
              },
            ]}
          >
            <Ionicons name="git-network-outline" size={14} color={theme.app.dashboard.accentBlue} />
            <Typography variant="small" numberOfLines={1} style={{ flexShrink: 1 }}>
              {parent.reseller?.name ?? '—'}
            </Typography>
          </View>
          <View
            style={[
              styles.metaBadge,
              {
                backgroundColor: theme.app.dashboard.overlayLight,
                borderColor: theme.app.dashboard.cardBorder,
              },
            ]}
          >
            <Ionicons name="storefront-outline" size={14} color={theme.app.dashboard.accentBlue} />
            <Typography variant="small">
              {children.length} branch{children.length === 1 ? '' : 'es'}
            </Typography>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Button
            size="compact"
            variant="outlined"
            onPress={() => router.push(`/companies/parent/${parentId}/detail` as Href)}
          >
            View overview
          </Button>
          {canViewServices ? (
            <Button
              size="compact"
              variant="outlined"
              onPress={() => router.push(`/companies/${parentId}/edit/reseller` as Href)}
            >
              Reseller settings
            </Button>
          ) : null}
        </View>

        <View style={styles.stepRow}>
          <Pressable
            onPress={goToParentStep}
            style={[
              styles.stepCard,
              {
                borderColor:
                  section === 'parent'
                    ? theme.app.dashboard.accentBlue
                    : theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
              },
              section === 'parent' && styles.stepCardActive,
            ]}
          >
            <View style={styles.stepCardTitleRow}>
              <Typography variant="medium16" style={{ fontWeight: '700', flex: 1 }}>
                1 Parent company
              </Typography>
              {section === 'children' || section === 'services' ? (
                <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              ) : null}
            </View>
            <Typography variant="small" muted>
              Edit company name
            </Typography>
            {section === 'parent' ? (
              <Typography variant="small" style={{ fontWeight: '600', marginTop: 4 }}>
                {parentName || parent.name}
              </Typography>
            ) : null}
          </Pressable>
          <Pressable
            onPress={goToChildrenStep}
            style={[
              styles.stepCard,
              {
                borderColor:
                  section === 'children'
                    ? theme.app.dashboard.accentBlue
                    : theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
              },
              section === 'children' && styles.stepCardActive,
            ]}
          >
            <Typography variant="medium16" style={{ fontWeight: '700' }}>
              2 Child companies
            </Typography>
            <Typography variant="small" muted>
              Branches under this parent — {children.length}
            </Typography>
          </Pressable>
        </View>

        {section === 'parent' ? (
          <DashboardCard contentStyle={{ gap: theme.spacing.md }}>
            <Typography variant="small" muted style={{ fontWeight: '700', letterSpacing: 0.4 }}>
              STEP 1 OF 2: Parent company name
            </Typography>
            <Typography variant="medium" muted>
              This is the main client company in your account. Only the name can be changed here —
              reseller is shown for reference.
            </Typography>
            <View
              style={[
                styles.infoBanner,
                {
                  backgroundColor: `${theme.app.dashboard.accentBlue}18`,
                  borderColor: `${theme.app.dashboard.accentBlue}44`,
                },
              ]}
            >
              <Typography variant="small">
                When you are done, continue to step 2 to edit child companies (branches, contacts,
                and websites).
              </Typography>
            </View>

            <View style={styles.editPanels}>
              <View
                style={[
                  styles.editPanel,
                  {
                    backgroundColor: theme.app.dashboard.overlayLight,
                    borderColor: theme.app.dashboard.cardBorder,
                  },
                ]}
              >
                <Typography variant="small" muted style={{ fontWeight: '700' }}>
                  You can edit
                </Typography>
                <InputField
                  label="Parent company name"
                  value={parentName}
                  onChangeText={setParentName}
                  editable={canEdit && !updateParent.isPending}
                  placeholder="Parent company name"
 />
                <Typography variant="small" muted>
                  Shown on invoices, login scope, and across the dashboard.
                </Typography>
              </View>

              <View
                style={[
                  styles.editPanel,
                  {
                    backgroundColor: theme.app.dashboard.overlayLight,
                    borderColor: theme.app.dashboard.cardBorder,
                  },
                ]}
              >
                <View style={styles.readOnlyHeader}>
                  <Typography variant="small" muted style={{ fontWeight: '700' }}>
                    Reference only
                  </Typography>
                  <StatusChip label="READ-ONLY" tone="neutral" />
                </View>
                <InputField
                  label="Reseller"
                  value={parent.reseller?.name ?? '—'}
                  editable={false}
 />
              </View>
            </View>

            <View style={styles.stepFooter}>
              <Typography variant="small" muted style={{ flex: 1 }}>
                {children.length} child compan
                {children.length === 1 ? 'y' : 'ies'} ready in step 2.
              </Typography>
              {canEdit ? (
                <Button
                  size="compact"
                  variant="outlined"
                  onPress={() => void saveParent()}
                  disabled={updateParent.isPending || !parentName.trim()}
                >
                  {updateParent.isPending ? 'Saving…' : 'Save name'}
                </Button>
              ) : null}
              <Button size="compact" onPress={goToChildrenStep}>
                Continue to child companies
              </Button>
            </View>
          </DashboardCard>
        ) : null}

        {section === 'children' ? (
          <DashboardCard contentStyle={{ gap: theme.spacing.md }}>
            <Typography variant="small" muted style={{ fontWeight: '700', letterSpacing: 0.4 }}>
              STEP 2 OF 2: Child companies
            </Typography>
            <Typography variant="medium" muted>
              Pick a company from the list, edit its details, then save. Switch between companies
              anytime — use search when you have many branches.
            </Typography>
            <View
              style={[
                styles.infoBanner,
                {
                  backgroundColor: `${theme.app.dashboard.accentBlue}18`,
                  borderColor: `${theme.app.dashboard.accentBlue}44`,
                },
              ]}
            >
              <Typography variant="small">
                An orange dot means this child has unsaved changes — save before switching if you
                need to keep them.
              </Typography>
            </View>

            {children.length === 0 ? (
              <Typography variant="small" muted>
                No child companies under this parent.
              </Typography>
            ) : (
              <>
                <View
                  style={[
                    styles.childListPanel,
                    {
                      backgroundColor: theme.app.dashboard.overlayLight,
                      borderColor: theme.app.dashboard.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.childListHeader}>
                    <Typography variant="medium" style={{ fontWeight: '700', flex: 1 }}>
                      Child companies
                    </Typography>
                    <StatusChip label={`${children.length} total`} tone="neutral" />
                  </View>
                  {children.length > 4 ? (
                    <SearchBar
                      value={childSearch}
                      onChange={setChildSearch}
                      placeholder="Search branches…"
 />
                  ) : null}
                  {filteredChildren.map((child) => {
                    const selected = editingChild?.id === child.id;
                    const dirtySelected = selected && childDirty;
                    return (
                      <Pressable
                        key={child.id}
                        onPress={() => selectChild(child)}
                        style={({ pressed }) => [
                          styles.childRow,
                          {
                            backgroundColor: selected
                              ? `${theme.app.dashboard.accentBlue}22`
                              : theme.app.dashboard.overlayLight,
                            borderColor: selected
                              ? theme.app.dashboard.accentBlue
                              : theme.app.dashboard.cardBorder,
                            opacity: pressed ? 0.88 : 1,
                          },
                        ]}
                      >
                        <View style={styles.childIcon}>
                          <Ionicons
                            name="business-outline"
                            size={18}
                            color={theme.app.dashboard.accentBlue}
 />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={styles.childNameRow}>
                            <Typography
                              variant="medium"
                              style={{ fontWeight: '600', flex: 1 }}
                              numberOfLines={1}
                            >
                              {child.name}
                            </Typography>
                            {dirtySelected ? <View style={styles.dirtyDot} /> : null}
                          </View>
                          <Typography variant="small" muted numberOfLines={1}>
                            {child.companyEmail || child.email || child.phone || 'No contact info'}
                          </Typography>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {editingChild ? (
                  <View
                    style={[
                      styles.childDetailPanel,
                      {
                        backgroundColor: theme.app.dashboard.overlayLight,
                        borderColor: theme.app.dashboard.cardBorder,
                      },
                    ]}
                  >
                    <View style={styles.childDetailHeader}>
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <Typography variant="small" muted>
                          Child {childIndex + 1} of {children.length}
                          {childDirty ? ' · Unsaved' : ''}
                        </Typography>
                        <Typography variant="medium16" style={{ fontWeight: '700' }} numberOfLines={1}>
                          {editingChild.name}
                        </Typography>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.childDetailDivider,
                        { backgroundColor: theme.app.dashboard.cardBorder },
                      ]}
 />
                    <View style={styles.profileHeader}>
                      <View style={styles.profileHeaderIcon}>
                        <Ionicons
                          name="storefront-outline"
                          size={16}
                          color={theme.app.dashboard.accentBlue}
 />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="medium" style={{ fontWeight: '700' }}>
                          Company profile
                        </Typography>
                        <Typography variant="small" muted>
                          Basic branch details used in your directory and assignments.
                        </Typography>
                      </View>
                    </View>
                    <InputField
                      label="Company name"
                      value={childName}
                      onChangeText={setChildName}
                      placeholder="Child company name"
                      editable={canEdit && !updateChild.isPending}
                      error={
                        childFormErrors && Boolean(getRequiredError(childName, 'Child company name'))
                      }
                      helperText={
                        childFormErrors
                          ? getRequiredError(childName, 'Child company name') ?? undefined
                          : undefined
                      }
 />
                    <InputField
                      label="Contact email"
                      value={childEmail}
                      onChangeText={setChildEmail}
                      placeholder="Email"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={canEdit && !updateChild.isPending}
                      error={
                        childFormErrors &&
                        Boolean(childEmail.trim() && getEmailValidationError(childEmail))
                      }
                      helperText={
                        childFormErrors && childEmail.trim()
                          ? getEmailValidationError(childEmail) ?? undefined
                          : undefined
                      }
 />
                    <PhoneInputField
                      label="Phone"
                      value={childPhone}
                      onChangeText={setChildPhone}
                      disabled={!canEdit || updateChild.isPending}
                      error={
                        childFormErrors &&
                        Boolean(childPhone.trim() && getPhoneValidationError(childPhone))
                      }
 />
                    <InputField
                      label="Address"
                      value={childAddress}
                      onChangeText={setChildAddress}
                      placeholder="Address"
                      editable={canEdit && !updateChild.isPending}
 />

                    <ChildCompanyPocEditor
                      child={editingChild}
                      parentCompanyId={parentId}
                      resellerId={resellerId}
                      pocs={childPocs}
                      onPocsChange={(next) => {
                        setChildPocs(next);
                        setChildPocsTouched(true);
                      }}
                      disabled={!canEdit || updateChild.isPending}
                      prefetchLookups
 />

                    <ChildCompanyWebsitesEditor
                      parentCompanyId={parentId}
                      childCompanyId={editingChild.id}
                      websites={childWebsites}
                      onWebsitesChange={(next) => {
                        setChildWebsites(next);
                        setChildWebsitesTouched(true);
                      }}
                      disabled={!canEdit || updateChild.isPending}
 />
                  </View>
                ) : null}

                <View style={styles.step2Footer}>
                  <Button size="compact" variant="outlined" onPress={goToParentStep}>
                    ← Parent company
                  </Button>
                  <View style={styles.step2FooterRight}>
                    {canEdit ? (
                      <Button
                        size="compact"
                        onPress={() => void saveChild()}
                        disabled={!childName.trim() || updateChild.isPending}
                      >
                        {updateChild.isPending ? 'Saving…' : 'Save this child'}
                      </Button>
                    ) : null}
                  </View>
                </View>
              </>
            )}
          </DashboardCard>
        ) : null}

        {section === 'services' && canViewServices ? (
          <DashboardCard contentStyle={{ gap: theme.spacing.sm }}>
            <SectionHeader
              icon="grid-outline"
              title="Services & modules"
              subtitle="Assign modules for this reseller"
 />
            {resellerId ? (
              <ResellerModulesPanel
                resellerId={resellerId}
                resellerName={parent.reseller?.name}
                readOnly={!canEdit}
                promptOfferingType
                embedded
 />
            ) : (
              <Typography variant="small" muted>
                Reseller id missing — cannot load services for this company.
              </Typography>
            )}
          </DashboardCard>
        ) : null}
      </ScrollView>
    </MobileScreen>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color={theme.app.dashboard.accentBlue} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="medium16" style={{ fontWeight: '700' }}>
          {title}
        </Typography>
        <Typography variant="small" muted>
          {subtitle}
        </Typography>
      </View>
    </View>
  );
}

export function CompanyEditActionTiles({
  parentId,
  childCount,
  resellerName,
  canEdit,
  canViewServices,
}: {
  parentId: string;
  childCount: number;
  resellerName?: string | null;
  canEdit: boolean;
  canViewServices: boolean;
}) {
  const theme = useAppTheme();
  const router = useRouter();

  if (!canEdit && !canViewServices) return null;

  const tiles: {
    key: CompanyEditSection;
    title: string;
    subtitle: string;
    icon: ComponentProps<typeof Ionicons>['name'];
    href: Href;
    visible: boolean;
  }[] = [
    {
      key: 'parent',
      title: 'Edit parent',
      subtitle: 'Company name & profile',
      icon: 'business',
      href: `/companies/${parentId}/edit?section=parent` as Href,
      visible: canEdit,
    },
    {
      key: 'children',
      title: 'Edit children',
      subtitle:
        childCount > 0
          ? `${childCount} child compan${childCount === 1 ? 'y' : 'ies'}`
          : 'No children yet',
      icon: 'git-network-outline',
      href: `/companies/${parentId}/edit?section=children` as Href,
      visible: canEdit,
    },
    {
      key: 'services',
      title: 'Edit services',
      subtitle: resellerName ? `Modules for ${resellerName}` : 'Assign modules & services',
      icon: 'grid-outline',
      href: `/companies/${parentId}/edit?section=services` as Href,
      visible: canViewServices,
    },
  ];

  const visible = tiles.filter((t) => t.visible);
  if (visible.length === 0) return null;

  return (
    <DashboardCard contentStyle={{ gap: theme.spacing.sm }}>
      <Typography variant="medium16" style={{ fontWeight: '700' }}>
        Edit options
      </Typography>
      <Typography variant="small" muted>
        Choose what you want to update
      </Typography>
      <View style={styles.tiles}>
        {visible.map((tile) => (
          <Pressable
            key={tile.key}
            onPress={() => router.push(tile.href)}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: theme.app.dashboard.overlayLight,
                borderColor: theme.app.dashboard.cardBorder,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <View style={styles.tileIcon}>
              <Ionicons name={tile.icon} size={20} color={theme.app.dashboard.accentBlue} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography variant="medium" style={{ fontWeight: '700' }}>
                {tile.title}
              </Typography>
              <Typography variant="small" muted numberOfLines={2}>
                {tile.subtitle}
              </Typography>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.app.text.muted} />
          </Pressable>
        ))}
      </View>
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 8 },
  scroll: { paddingTop: 4, paddingBottom: 32 },
  backBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  titleRow: {
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 2,
  },
  stepCardActive: {
    borderWidth: 2,
  },
  stepCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  editPanels: {
    gap: 12,
  },
  editPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  readOnlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  step2Footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  step2FooterRight: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(88, 101, 242, 0.16)',
    borderWidth: 1,
    borderColor: glassUi.border.subtle,
  },
  childListPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  childListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  childDetailPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  childDetailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  childDetailDivider: {
    height: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  profileHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(88, 101, 242, 0.16)',
    borderWidth: 1,
    borderColor: glassUi.border.subtle,
    marginTop: 2,
  },
  childNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dirtyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f97316',
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  childIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(88, 101, 242, 0.16)',
    borderWidth: 1,
    borderColor: glassUi.border.subtle,
  },
  tiles: { gap: 10 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  tileIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(88, 101, 242, 0.16)',
    borderWidth: 1,
    borderColor: glassUi.border.subtle,
  },
});
