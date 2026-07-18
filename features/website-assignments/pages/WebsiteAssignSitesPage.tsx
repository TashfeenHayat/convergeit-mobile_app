import { useLocalSearchParams } from 'expo-router';

import { WebsiteAssignmentsListPage } from '@/features/website-assignments/pages/WebsiteAssignmentsListPage';

export function WebsiteAssignSitesPage() {
  const params = useLocalSearchParams<{
    parentCompanyId?: string | string[];
    childCompanyId?: string | string[];
  }>();
  const parentRaw = params.parentCompanyId;
  const childRaw = params.childCompanyId;
  const parentCompanyId = Array.isArray(parentRaw) ? (parentRaw[0] ?? '') : (parentRaw ?? '');
  const childCompanyId = Array.isArray(childRaw) ? (childRaw[0] ?? '') : (childRaw ?? '');

  return (
    <WebsiteAssignmentsListPage
      lockedParentCompanyId={parentCompanyId === 'none' ? '' : parentCompanyId}
      lockedChildCompanyId={childCompanyId === '__none__' ? '' : childCompanyId}
    />
  );
}
