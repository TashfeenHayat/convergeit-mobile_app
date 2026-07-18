import { useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { JsonRecord } from '@/api/types/common.types';
import {
  FormModal,
  InputField,
  PhoneInputField,
  SegmentedControl,
  SelectField,
  StatusChip,
  Typography,
} from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  resolveSessionParentCompanyId,
  resolveSessionResellerId,
  sessionMayAssignWideResellerScope,
  sessionMayPickInternalUserScope,
  useAuth,
  type SessionScopeUser,
} from '@/lib/auth';
import type { AuthUserType } from '@/lib/auth/types';
import {
  extractParentCompaniesFromByResellerTree,
  pickItemsArray,
  toIdNameOption,
} from '@/lib/companies/scope-tree-options';
import { useCompaniesByResellerQuery, useCompaniesSetupResellersQuery } from '@/lib/hooks/query/companies';
import { useDepartmentsListQuery } from '@/lib/hooks/query/hrms/departments';
import { useDesignationsListQuery } from '@/lib/hooks/query/hrms/designations';
import { useRolesListQuery } from '@/lib/hooks/query/roles';
import { useCreateUserMutation, useUpdateUserMutation, useUserQuery } from '@/lib/hooks/query/users';
import { isSelectableDepartmentId } from '@/lib/hrms/department-ids';
import { glassUi } from '@/lib/theme/glass-ui';
import { getEmailValidationError, getRequiredError } from '@/lib/ui/form-validation';
import { formatPhoneInputValue, getPhoneValidationError } from '@/lib/ui/format-phone-input';
import { DEFAULT_CREATED_USER_PASSWORD } from '@/lib/users/default-created-user-password';
import { extractUserRecordFromDetailPayload } from '@/lib/users/extract-user-record';
import {
  externalScopeUsesWideReseller,
  findDefaultStandardExternalRoleId,
  findPlatformAdminRoleId,
  isExternalAdminScope,
  resolveRoleIdForExternalAdminScope,
  type ExternalAdminScope,
  type InternalAdminScope,
} from '@/lib/users/user-admin-scope';
import { pickApiItems } from '@/lib/utils/admin-list';
import { isRecord, pickStr } from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

export type AddUserModalProps = {
  open: boolean;
  onClose: () => void;
  editUserId?: string;
  onSaved?: () => void;
};

export function AddUserModal({ open, onClose, editUserId, onSaved }: AddUserModalProps) {
  const theme = useAppTheme();
  const mode = editUserId?.trim() ? 'edit' : 'create';
  const trimmedEditId = editUserId?.trim() ?? '';
  const { isPlatformAdmin, user: authUser } = useAuth();

  const mayPickInternal = sessionMayPickInternalUserScope(
    isPlatformAdmin,
    authUser as SessionScopeUser | null,
  );
  const mayAssignWideReseller = sessionMayAssignWideResellerScope(
    isPlatformAdmin,
    (authUser?.userType ?? undefined) as AuthUserType | undefined,
    authUser?.wideResellerScope,
    authUser?.resellerId,
  );
  const sessionResellerId = resolveSessionResellerId(authUser?.resellerId);
  const sessionParentCompanyId = resolveSessionParentCompanyId(authUser?.parentCompanyId);

  const [userType, setUserType] = useState<'Internal' | 'External'>('Internal');
  const [resellerId, setResellerId] = useState('');
  const [parentCompanyId, setParentCompanyId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [internalAdminScope, setInternalAdminScope] = useState<InternalAdminScope>('standard');
  const [externalAdminScope, setExternalAdminScope] = useState<ExternalAdminScope>('standard');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const hydratedEditUserIdRef = useRef<string | null>(null);

  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const userQuery = useUserQuery(trimmedEditId, { enabled: open && mode === 'edit' });
  const rolesQuery = useRolesListQuery({ all: true }, { enabled: open });
  const deptsQuery = useDepartmentsListQuery(
    userType === 'External' && resellerId.trim() && parentCompanyId.trim()
      ? {
          all: true,
          type: 'External',
          resellerId: resellerId.trim(),
          parentCompanyId: parentCompanyId.trim(),
        }
      : userType === 'Internal'
        ? { all: true, type: 'Internal' }
        : { all: true },
    {
      enabled:
        open &&
        (userType === 'Internal' ||
          (userType === 'External' &&
            Boolean(resellerId.trim()) &&
            Boolean(parentCompanyId.trim()))),
      scope: 'add-user-modal',
    },
  );
  const designationsQuery = useDesignationsListQuery(
    departmentId ? { departmentId, all: true } : { all: true },
    { enabled: open && isSelectableDepartmentId(departmentId), scope: 'add-user-modal' },
  );
  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: open && userType === 'External' && mayPickInternal,
  });
  const companiesQuery = useCompaniesByResellerQuery(
    resellerId,
    { view: 'tree', sortBy: 'name', sortOrder: 'asc', all: true },
    { enabled: open && userType === 'External' && Boolean(resellerId.trim()) },
  );

  const roleOptions = useMemo(
    () =>
      pickApiItems(rolesQuery.data)
        .filter(isRecord)
        .map((r) => {
          const id = pickStr(r, ['id']);
          return id ? { label: pickStr(r, ['name']) || id, value: id } : null;
        })
        .filter((x): x is { label: string; value: string } => x !== null),
    [rolesQuery.data],
  );

  const deptOptions = useMemo(
    () =>
      pickApiItems(deptsQuery.data)
        .filter(isRecord)
        .map((r) => {
          const id = pickStr(r, ['id']);
          return id && isSelectableDepartmentId(id)
            ? { label: pickStr(r, ['name']) || id, value: id }
            : null;
        })
        .filter((x): x is { label: string; value: string } => x !== null),
    [deptsQuery.data],
  );

  const designationOptions = useMemo(
    () =>
      pickApiItems(designationsQuery.data)
        .filter(isRecord)
        .map((r) => {
          const id = pickStr(r, ['id']);
          return id ? { label: pickStr(r, ['title', 'name']) || id, value: id } : null;
        })
        .filter((x): x is { label: string; value: string } => x !== null),
    [designationsQuery.data],
  );

  const resellerOptions = useMemo(
    () =>
      pickItemsArray(resellersQuery.data)
        .map((row) => toIdNameOption(row))
        .filter((x): x is { label: string; value: string } => x !== null),
    [resellersQuery.data],
  );

  const parentOptions = useMemo(
    () => extractParentCompaniesFromByResellerTree(companiesQuery.data),
    [companiesQuery.data],
  );

  useEffect(() => {
    hydratedEditUserIdRef.current = null;
  }, [trimmedEditId]);

  useEffect(() => {
    if (open) return;
    const defaultUserType: 'Internal' | 'External' = mayPickInternal ? 'Internal' : 'External';
    setUserType(defaultUserType);
    setResellerId(sessionResellerId ?? '');
    setParentCompanyId(sessionParentCompanyId ?? '');
    setRoleId('');
    setDepartmentId('');
    setDesignationId('');
    setInternalAdminScope('standard');
    setExternalAdminScope('standard');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setShowErrors(false);
    hydratedEditUserIdRef.current = null;
  }, [open, mayPickInternal, sessionResellerId, sessionParentCompanyId]);

  useEffect(() => {
    if (!open || mode !== 'create') return;
    setUserType(mayPickInternal ? 'Internal' : 'External');
    setResellerId(sessionResellerId ?? '');
    setParentCompanyId(sessionParentCompanyId ?? '');
    setRoleId('');
    setDepartmentId('');
    setDesignationId('');
    setInternalAdminScope('standard');
    setExternalAdminScope('standard');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setShowErrors(false);
    hydratedEditUserIdRef.current = null;
  }, [open, mode, mayPickInternal, sessionResellerId, sessionParentCompanyId]);

  useEffect(() => {
    if (!open || mode !== 'edit' || !trimmedEditId) return;
    if (!userQuery.isSuccess || !userQuery.data) return;
    if (hydratedEditUserIdRef.current === trimmedEditId) return;

    const u = extractUserRecordFromDetailPayload(userQuery.data);
    if (!u) return;

    const roleObj = isRecord(u.role) ? u.role : null;
    const deptObj = isRecord(u.department) ? u.department : null;
    const desObj = isRecord(u.designation) ? u.designation : null;
    const resellerObj = isRecord(u.reseller) ? u.reseller : null;
    const companyObj = isRecord(u.company) ? u.company : null;
    const parentCompanyObj = isRecord(u.parentCompany) ? u.parentCompany : null;

    setFirstName(pickStr(u, ['firstName', 'first_name']) || '');
    setLastName(pickStr(u, ['lastName', 'last_name']) || '');
    setEmail(pickStr(u, ['email']) || '');
    setPhone(
      formatPhoneInputValue(
        pickStr(u, ['phoneNo', 'phone_no', 'phone', 'phoneNumber', 'mobile', 'phone_number']) || '',
      ),
    );

    const nextType = pickStr(u, ['userType', 'user_type']) === 'External' ? 'External' : 'Internal';
    setUserType(nextType);

    setResellerId(
      pickStr(u, ['resellerId', 'reseller_id']) || pickStr(resellerObj, ['id']) || '',
    );
    setParentCompanyId(
      pickStr(u, ['companyId', 'company_id', 'parentCompanyId', 'parent_company_id']) ||
        pickStr(companyObj, ['id']) ||
        pickStr(parentCompanyObj, ['id']) ||
        '',
    );

    setRoleId(pickStr(u, ['roleId', 'role_id']) || pickStr(roleObj, ['id']) || '');
    setDepartmentId(
      pickStr(u, ['departmentId', 'department_id']) || pickStr(deptObj, ['id']) || '',
    );
    setDesignationId(
      pickStr(u, ['designationId', 'designation_id']) || pickStr(desObj, ['id']) || '',
    );

    const wideRaw = u.wideResellerScope ?? u.wide_reseller_scope;
    const wide = wideRaw === true || wideRaw === 'true' || wideRaw === 1 || wideRaw === '1';
    if (nextType === 'External') {
      const roleName = pickStr(roleObj, ['name']) || pickStr(u, ['roleName', 'role_name']);
      if (wide) setExternalAdminScope('wide_reseller');
      else if (/parent/i.test(roleName)) setExternalAdminScope('parent_company');
      else setExternalAdminScope('standard');
    } else {
      const roleName = pickStr(roleObj, ['name']) || pickStr(u, ['roleName', 'role_name']);
      setInternalAdminScope(/platform\s*admin/i.test(roleName) ? 'platform_admin' : 'standard');
    }

    hydratedEditUserIdRef.current = trimmedEditId;
    setShowErrors(false);
  }, [open, mode, trimmedEditId, userQuery.isSuccess, userQuery.data]);

  useEffect(() => {
    if (!open || userType !== 'Internal') return;
    if (internalAdminScope === 'platform_admin') {
      const id = findPlatformAdminRoleId(roleOptions);
      if (id) setRoleId(id);
    }
  }, [open, userType, internalAdminScope, roleOptions]);

  useEffect(() => {
    if (!open || userType !== 'External') return;
    if (isExternalAdminScope(externalAdminScope)) {
      const id = resolveRoleIdForExternalAdminScope(externalAdminScope, roleOptions);
      if (id) setRoleId(id);
    } else if (!roleId && roleOptions.length) {
      const id = findDefaultStandardExternalRoleId(roleOptions);
      if (id) setRoleId(id);
    }
  }, [open, userType, externalAdminScope, roleOptions, roleId]);

  useEffect(() => {
    if (!departmentId || !designationOptions.length) return;
    if (!designationOptions.some((o) => o.value === designationId)) {
      setDesignationId(designationOptions[0]?.value ?? '');
    }
  }, [departmentId, designationOptions, designationId]);

  const wideResellerScope =
    userType === 'External' && externalScopeUsesWideReseller(externalAdminScope);

  const save = async () => {
    setShowErrors(true);
    const nameErr = getRequiredError(firstName, 'First name');
    const emailErr = getEmailValidationError(email, { required: true });
    const phoneErr = phone.trim() ? getPhoneValidationError(phone) : null;
    if (nameErr || emailErr || phoneErr) {
      Alert.alert('Validation', nameErr || emailErr || phoneErr || 'Check the form fields.');
      return;
    }
    if (!roleId || !isSelectableDepartmentId(departmentId) || !designationId) {
      Alert.alert('Validation', 'Role, department, and designation are required.');
      return;
    }
    if (userType === 'External' && (!resellerId.trim() || !parentCompanyId.trim())) {
      Alert.alert('Validation', 'Select reseller and parent company for external users.');
      return;
    }

    const body: JsonRecord = {
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      email: email.trim(),
      phoneNo: phone.trim() ? formatPhoneInputValue(phone) : undefined,
      userType,
      roleId,
      departmentId,
      designationId,
    };

    if (userType === 'External') {
      body.resellerId = resellerId.trim();
      body.companyId = parentCompanyId.trim();
      if (mayAssignWideReseller) body.wideResellerScope = wideResellerScope;
    }

    try {
      if (editUserId) {
        await updateMutation.mutateAsync({ id: editUserId, body });
        Alert.alert('Saved', 'User updated.');
      } else {
        await createMutation.mutateAsync(body);
        Alert.alert('User created', `Default password: ${DEFAULT_CREATED_USER_PASSWORD}`);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      Alert.alert('Save failed', extractApiErrorMessage(err));
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;
  const firstNameErr = showErrors ? getRequiredError(firstName, 'First name') : null;
  const emailErr = showErrors ? getEmailValidationError(email, { required: true }) : null;
  const phoneErr = showErrors && phone.trim() ? getPhoneValidationError(phone) : null;

  return (
    <FormModal
      open={open}
      title={mode === 'edit' ? 'Edit user' : 'Add user'}
      description={
        mode === 'edit'
          ? 'Update profile, phone, and access settings.'
          : 'Create access with role, department, and designation.'
      }
      onClose={onClose}
      onSave={() => void save()}
      primaryButtonLabel={mode === 'edit' ? 'Save changes' : 'Create user'}
      primaryButtonDisabled={saving || (mode === 'edit' && userQuery.isLoading)}
    >
      <View style={{ gap: 14 }}>
        <FormSection
          icon="people-outline"
          title="Account type"
          chip={<StatusChip label={userType} tone={userType === 'Internal' ? 'info' : 'success'} />}
        >
          {mayPickInternal ? (
            <SegmentedControl
              value={userType}
              onChange={(v) => setUserType(v as 'Internal' | 'External')}
              options={[
                { value: 'Internal', label: 'Internal' },
                { value: 'External', label: 'External' },
              ]}
            />
          ) : (
            <Typography variant="small" muted>
              External user for your organization scope.
            </Typography>
          )}

          {userType === 'Internal' && mayPickInternal ? (
            <SelectField
              label="Internal admin scope"
              value={internalAdminScope}
              onChange={(v) => setInternalAdminScope(v as InternalAdminScope)}
              options={[
                { value: 'standard', label: 'Standard staff' },
                { value: 'platform_admin', label: 'Platform admin' },
              ]}
            />
          ) : null}

          {userType === 'External' ? (
            <>
              {mayPickInternal ? (
                <SelectField
                  label="Reseller"
                  value={resellerId}
                  onChange={setResellerId}
                  options={
                    resellerOptions.length
                      ? resellerOptions
                      : [
                          {
                            value: '',
                            label: resellersQuery.isLoading ? 'Loading…' : 'No resellers',
                          },
                        ]
                  }
                />
              ) : null}
              <SelectField
                label="Parent company"
                value={parentCompanyId}
                onChange={setParentCompanyId}
                options={
                  parentOptions.length
                    ? parentOptions
                    : [
                        {
                          value: '',
                          label: companiesQuery.isLoading ? 'Loading…' : 'Select reseller first',
                        },
                      ]
                }
              />
              {mayAssignWideReseller ? (
                <SelectField
                  label="External admin scope"
                  value={externalAdminScope}
                  onChange={(v) => setExternalAdminScope(v as ExternalAdminScope)}
                  options={[
                    { value: 'standard', label: 'Standard external' },
                    { value: 'parent_company', label: 'Parent company admin' },
                    { value: 'wide_reseller', label: 'Reseller admin' },
                  ]}
                />
              ) : null}
            </>
          ) : null}
        </FormSection>

        <FormSection icon="person-outline" title="Profile">
          <View style={styles.nameRow}>
            <View style={styles.nameCol}>
              <InputField
                label="First name"
                value={firstName}
                onChangeText={setFirstName}
                error={Boolean(firstNameErr)}
                helperText={firstNameErr ?? undefined}
                placeholder="First name"
              />
            </View>
            <View style={styles.nameCol}>
              <InputField
                label="Last name"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
              />
            </View>
          </View>
          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            error={Boolean(emailErr)}
            helperText={emailErr ?? undefined}
            placeholder="name@company.com"
          />
          <PhoneInputField
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            error={Boolean(phoneErr)}
            helperText={phoneErr ?? 'Optional — pick country code, then enter the number'}
          />
        </FormSection>

        <FormSection icon="key-outline" title="Access">
          <SelectField
            label="Role"
            value={roleId}
            onChange={setRoleId}
            options={roleOptions.length ? roleOptions : [{ value: '', label: 'Loading roles…' }]}
            disabled={userType === 'Internal' && internalAdminScope === 'platform_admin'}
            error={showErrors && !roleId}
            helperText={showErrors && !roleId ? 'Select a role.' : undefined}
          />
          <SelectField
            label="Department"
            value={departmentId}
            onChange={setDepartmentId}
            options={
              deptOptions.length ? deptOptions : [{ value: '', label: 'Loading departments…' }]
            }
            error={showErrors && !isSelectableDepartmentId(departmentId)}
            helperText={
              showErrors && !isSelectableDepartmentId(departmentId)
                ? 'Select a department.'
                : undefined
            }
          />
          <SelectField
            label="Designation"
            value={designationId}
            onChange={setDesignationId}
            options={
              designationOptions.length
                ? designationOptions
                : [
                    {
                      value: '',
                      label: departmentId ? 'Loading designations…' : 'Select department first',
                    },
                  ]
            }
            error={showErrors && !designationId}
            helperText={showErrors && !designationId ? 'Select a designation.' : undefined}
          />
        </FormSection>

        {mode === 'create' ? (
          <View
            style={[
              styles.hintCard,
              {
                backgroundColor: `${theme.app.dashboard.accentBlue}14`,
                borderColor: `${theme.app.dashboard.accentBlue}33`,
              },
            ]}
          >
            <Ionicons name="lock-closed-outline" size={16} color={theme.app.dashboard.accentBlue} />
            <Typography variant="small" muted style={{ flex: 1 }}>
              Password is set automatically to {DEFAULT_CREATED_USER_PASSWORD}
            </Typography>
          </View>
        ) : null}

        {mode === 'edit' && userQuery.isLoading ? (
          <Typography variant="small" muted>
            Loading user…
          </Typography>
        ) : null}
      </View>
    </FormModal>
  );
}

function FormSection({
  icon,
  title,
  chip,
  children,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  chip?: ReactNode;
  children: ReactNode;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: theme.app.dashboard.overlayLight,
          borderColor: theme.app.dashboard.cardBorder,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionIcon,
            {
              backgroundColor: `${theme.app.dashboard.accentBlue}18`,
              borderColor: glassUi.border.subtle,
            },
          ]}
        >
          <Ionicons name={icon} size={16} color={theme.app.dashboard.accentBlue} />
        </View>
        <Typography variant="medium" style={{ fontWeight: '700', flex: 1 }}>
          {title}
        </Typography>
        {chip}
      </View>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nameCol: { flex: 1, minWidth: 0 },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
});
