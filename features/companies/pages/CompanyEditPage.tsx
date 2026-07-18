import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import type { ParentCompanyChildDetail } from '@/api/types/companies.types';
import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  DashboardCard,
  FormModal,
  InputField,
  PhoneInputField,
  LoadingScreen,
  SegmentedControl,
  StatusChip,
  Typography,
} from '@/components/ui';
import {
  ChildCompanyPocEditor,
  savedPocRowsFromChild,
  type ChildPocEditRow,
} from '@/features/companies/components/ChildCompanyPocEditor';
import { ResellerModulesPanel } from '@/features/companies/components/ResellerModulesPanel';
import { normalizePocsFromCarrier } from '@/lib/companies/parent-detail-pocs';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import {
  useParentCompanyQuery,
  useUpdateCompanyMutation,
  useUpdateParentCompanyMutation,
} from '@/lib/hooks/query/companies/hooks';
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
  const params = useLocalSearchParams<{ section?: string }>();

  const canEdit = canCompaniesModuleAction(hasPage, hasOperational, 'update');
  const canViewServices =
    hasPage('page:resellers') || hasPage('page:clients') || hasPage('page:account-setup');

  const [section, setSection] = useState<CompanyEditSection>(
    () => initialSection ?? parseSection(params.section),
  );
  const [parentName, setParentName] = useState('');
  const [editingChild, setEditingChild] = useState<ParentCompanyChildDetail | null>(null);
  const [childName, setChildName] = useState('');
  const [childEmail, setChildEmail] = useState('');
  const [childPhone, setChildPhone] = useState('');
  const [childAddress, setChildAddress] = useState('');
  const [childPocs, setChildPocs] = useState<ChildPocEditRow[]>([]);
  const [childPocsTouched, setChildPocsTouched] = useState(false);
  const [childFormErrors, setChildFormErrors] = useState(false);

  const query = useParentCompanyQuery(parentId);
  const updateParent = useUpdateParentCompanyMutation();
  const updateChild = useUpdateCompanyMutation();

  const payload = query.data?.data;
  const parent = payload?.parentCompany;
  const children = payload?.children ?? [];
  const resellerId = parent?.resellerId?.trim() || parent?.reseller?.id?.trim() || '';

  useEffect(() => {
    if (initialSection) {
      setSection(initialSection);
      return;
    }
    setSection(parseSection(params.section));
  }, [initialSection, params.section]);

  useEffect(() => {
    if (parent?.name) setParentName(parent.name);
  }, [parent?.name]);

  const segmentOptions = useMemo(() => {
    const options: { label: string; value: CompanyEditSection }[] = [
      { label: 'Parent', value: 'parent' },
      { label: `Children (${children.length})`, value: 'children' },
    ];
    if (canViewServices) {
      options.push({ label: 'Services', value: 'services' });
    }
    return options;
  }, [canViewServices, children.length]);

  const openChildEditor = (child: ParentCompanyChildDetail) => {
    if (!canEdit) return;
    setEditingChild(child);
    setChildName(child.name ?? '');
    setChildEmail(child.companyEmail ?? child.email ?? '');
    setChildPhone(formatPhoneInputValue(child.phone ?? ''));
    setChildAddress(child.address ?? '');
    setChildPocs(savedPocRowsFromChild(child));
    setChildPocsTouched(false);
    setChildFormErrors(false);
  };

  const closeChildEditor = () => {
    if (updateChild.isPending) return;
    setEditingChild(null);
    setChildPocs([]);
    setChildPocsTouched(false);
  };

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
    if (!editingChild) return;
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
    try {
      await updateChild.mutateAsync({
        companyId: editingChild.id,
        parentIdForList: parentId,
        body,
      });
      setEditingChild(null);
      setChildPocs([]);
      setChildPocsTouched(false);
      setChildFormErrors(false);
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
    <MobileScreen contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.md }}>
        <DashboardPageIntro subtitle="Edit parent, child companies, and services">
          <View style={styles.headerRow}>
            <StatusChip label="Edit" tone="info" />
            <Button
              size="compact"
              variant="outlined"
              onPress={() => router.replace(`/companies/parent/${parentId}/detail` as Href)}
            >
              Back to detail
            </Button>
          </View>
        </DashboardPageIntro>

        <DashboardCard contentStyle={{ gap: 8 }}>
          <Typography variant="medium16" style={{ fontWeight: '700' }}>
            {parent.name}
          </Typography>
          <Typography variant="small" muted>
            Reseller: {parent.reseller?.name ?? '—'}
          </Typography>
        </DashboardCard>

        <SegmentedControl
          options={segmentOptions}
          value={section}
          onChange={(value) => setSection(value as CompanyEditSection)}
        />

        {section === 'parent' ? (
          <DashboardCard contentStyle={{ gap: theme.spacing.md }}>
            <SectionHeader
              icon="business"
              title="Parent company"
              subtitle="Update the parent company profile"
            />
            <InputField
              label="Company name"
              value={parentName}
              onChangeText={setParentName}
              editable={canEdit && !updateParent.isPending}
              placeholder="Parent company name"
            />
            <InputField label="Reseller" value={parent.reseller?.name ?? '—'} editable={false} />
            {canEdit ? (
              <Button
                onPress={() => void saveParent()}
                disabled={updateParent.isPending || !parentName.trim()}
              >
                {updateParent.isPending ? 'Saving…' : 'Save parent company'}
              </Button>
            ) : (
              <Typography variant="small" muted>
                You do not have permission to edit this company.
              </Typography>
            )}
          </DashboardCard>
        ) : null}

        {section === 'children' ? (
          <DashboardCard contentStyle={{ gap: theme.spacing.sm }}>
            <SectionHeader
              icon="git-network-outline"
              title="Child companies"
              subtitle={
                canEdit
                  ? 'Tap a child company to edit its details'
                  : 'View-only — no edit permission'
              }
            />
            {children.length === 0 ? (
              <Typography variant="small" muted>
                No child companies under this parent.
              </Typography>
            ) : (
              children.map((child) => (
                <Pressable
                  key={child.id}
                  onPress={() => openChildEditor(child)}
                  disabled={!canEdit}
                  style={({ pressed }) => [
                    styles.childRow,
                    {
                      backgroundColor: theme.app.dashboard.overlayLight,
                      borderColor: theme.app.dashboard.cardBorder,
                      opacity: pressed && canEdit ? 0.88 : 1,
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
                    <Typography variant="medium" style={{ fontWeight: '600' }} numberOfLines={1}>
                      {child.name}
                    </Typography>
                    <Typography variant="small" muted numberOfLines={1}>
                      {(() => {
                        const pocCount = normalizePocsFromCarrier(child).length;
                        const contact = child.email || child.phone || 'No contact info';
                        return pocCount > 0 ? `${contact} · ${pocCount} POC` : contact;
                      })()}
                    </Typography>
                  </View>
                  <StatusChip label="Child" tone="success" />
                  {canEdit ? (
                    <Ionicons name="create-outline" size={18} color={theme.app.text.muted} />
                  ) : null}
                </Pressable>
              ))
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
      </View>

      <FormModal
        open={Boolean(editingChild)}
        title={editingChild ? `Edit ${editingChild.name}` : 'Edit child company'}
        onClose={closeChildEditor}
        onSave={() => void saveChild()}
        primaryButtonLabel={updateChild.isPending ? 'Saving…' : 'Save changes'}
        cancelButtonLabel="Cancel"
        primaryButtonDisabled={!childName.trim() || updateChild.isPending}
      >
        <View style={{ gap: 12 }}>
          <InputField
            label="Company name"
            value={childName}
            onChangeText={setChildName}
            placeholder="Child company name"
            error={childFormErrors && Boolean(getRequiredError(childName, 'Child company name'))}
            helperText={
              childFormErrors
                ? getRequiredError(childName, 'Child company name') ?? undefined
                : undefined
            }
          />
          <InputField
            label="Email"
            value={childEmail}
            onChangeText={setChildEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            error={childFormErrors && Boolean(childEmail.trim() && getEmailValidationError(childEmail))}
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
            error={childFormErrors && Boolean(childPhone.trim() && getPhoneValidationError(childPhone))}
          />
          <InputField
            label="Address"
            value={childAddress}
            onChangeText={setChildAddress}
            placeholder="Address"
          />
          {editingChild ? (
            <ChildCompanyPocEditor
              child={editingChild}
              parentCompanyId={parentId}
              pocs={childPocs}
              onPocsChange={(next) => {
                setChildPocs(next);
                setChildPocsTouched(true);
              }}
              disabled={updateChild.isPending}
            />
          ) : null}
        </View>
      </FormModal>
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
  screen: { paddingTop: 4, paddingBottom: 28 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
