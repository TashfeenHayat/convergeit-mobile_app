import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import { AppCard, Button, StatusChip, Typography } from '@/components/ui';
import { UserPermissionsEditor } from '@/features/users/components/UserPermissionsEditor';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useUserQuery, useUsersListQuery } from '@/lib/hooks/query/users';
import { glassUi } from '@/lib/theme/glass-ui';
import { extractUserRecordFromDetailPayload } from '@/lib/users/extract-user-record';
import { extractUsersRows } from '@/lib/users/user-list-rows';
import { isRecord, pickStr } from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

export type UserPermissionsDetailPageProps = {
  userId: string;
};

export function UserPermissionsDetailPage({ userId }: UserPermissionsDetailPageProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const trimmedId = userId.trim();
  const accent = theme.app.dashboard.accentBlue;

  const userQuery = useUserQuery(trimmedId, { enabled: trimmedId.length > 0 });
  const usersListQuery = useUsersListQuery({ all: true }, { enabled: trimmedId.length > 0 });

  const profile = useMemo(() => {
    const fromDetail = extractUserRecordFromDetailPayload(userQuery.data);
    if (fromDetail) {
      const roleObj = isRecord(fromDetail.role) ? fromDetail.role : null;
      const firstName = pickStr(fromDetail, ['firstName', 'first_name']);
      const lastName = pickStr(fromDetail, ['lastName', 'last_name']);
      const name =
        [firstName, lastName].filter(Boolean).join(' ').trim() ||
        pickStr(fromDetail, ['name', 'fullName', 'email']) ||
        '—';
      return {
        name,
        email: pickStr(fromDetail, ['email']) || '—',
        role: pickStr(roleObj, ['name']) || pickStr(fromDetail, ['roleName']) || '',
        userType: pickStr(fromDetail, ['userType', 'user_type']) || '',
      };
    }

    const fromList = extractUsersRows(usersListQuery.data).find((u) => u.id === trimmedId);
    if (fromList) {
      return {
        name: fromList.user || '—',
        email: fromList.email || '—',
        role: fromList.role || '',
        userType: fromList.type || '',
      };
    }

    return null;
  }, [trimmedId, userQuery.data, usersListQuery.data]);

  const refreshing =
    (userQuery.isRefetching || usersListQuery.isRefetching) &&
    !userQuery.isLoading &&
    !usersListQuery.isLoading;

  if (!trimmedId) {
    return (
      <MobileScreen>
        <AppCard style={{ gap: 12 }}>
          <Typography variant="medium" color={theme.app.danger}>
            Missing user id.
          </Typography>
          <Button size="compact" variant="outlined" onPress={() => router.back()}>
            Go back
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void userQuery.refetch();
              void usersListQuery.refetch();
            }}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backBtn,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={accent} />
          <Typography variant="small" style={{ fontWeight: '600', color: accent }}>
            Users
          </Typography>
        </Pressable>

        <DashboardPageIntro subtitle="Direct permission overrides for this user.">
          {userQuery.isLoading && !profile ? (
            <View style={styles.headerLoading}>
              <ActivityIndicator color={accent} />
              <Typography variant="small" muted>
                Loading user…
              </Typography>
            </View>
          ) : userQuery.isError && !profile ? (
            <AppCard style={{ gap: 10 }}>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(userQuery.error, 'Could not load user.')}
              </Typography>
              <Button size="compact" variant="outlined" onPress={() => void userQuery.refetch()}>
                Retry
              </Button>
            </AppCard>
          ) : (
            <View
              style={[
                styles.profileCard,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: theme.app.dashboard.overlayLight,
                },
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: `${accent}22`,
                    borderColor: glassUi.border.subtle,
                  },
                ]}
              >
                <Ionicons name="person-outline" size={22} color={accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Typography variant="medium16" style={{ fontWeight: '700' }} numberOfLines={1}>
                  {profile?.name ?? '—'}
                </Typography>
                <Typography variant="small" muted numberOfLines={1}>
                  {profile?.email ?? '—'}
                </Typography>
                <View style={styles.chipRow}>
                  {profile?.userType ? (
                    <StatusChip
                      label={profile.userType}
                      tone={
                        profile.userType.toLowerCase() === 'internal' ? 'info' : 'success'
                      }
 />
                  ) : null}
                  {profile?.role ? (
                    <Typography variant="small" muted numberOfLines={1}>
                      {profile.role}
                    </Typography>
                  ) : null}
                </View>
              </View>
            </View>
          )}
        </DashboardPageIntro>

        <UserPermissionsEditor userId={trimmedId} />
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 36 },
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
});
