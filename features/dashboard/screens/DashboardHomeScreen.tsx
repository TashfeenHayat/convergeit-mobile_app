import { Link, type Href } from 'expo-router';

import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import { LinearGradient } from 'expo-linear-gradient';

import type { ComponentProps } from 'react';

import { useIsFetching, useQueryClient } from '@tanstack/react-query';



import { MobileScreen } from '@/components/layout';
import { LiquidGlass, MetricCard, Typography } from '@/components/ui';
import { webHrefToMobile } from '@/constants/navigation';
import { glassUi } from '@/lib/theme/glass-ui';

import { useAuth } from '@/lib/auth';

import { useAccessToken } from '@/lib/auth/use-access-token';

import { useAgentInboxQueues } from '@/lib/hooks/chat/useAgentInboxQueues';

import { dashboardKeys } from '@/lib/hooks/query/dashboard/keys';

import { useDashboardActivityNavItems } from '@/lib/hooks/useDashboardActivityNavItems';

import { useDashboardWidgets } from '@/lib/permissions/use-dashboard-widgets';

import { useChatApiGates } from '@/lib/permissions/use-chat-api-gates';
import { tokens } from '@/theme/tokens';

import { DashboardAttendancePanel } from '../components/DashboardAttendancePanel';
import { DashboardMetricGrid } from '../components/DashboardMetricGrid';

import {

  DashboardQuickActionGrid,

  type QuickActionItem,

} from '../components/DashboardQuickActionGrid';

import { DashboardSectionHeader } from '../components/DashboardSectionHeader';

import {

  PlatformOverviewDashboard,

  blocksForWidgets,

} from '../components/PlatformOverviewDashboard';



type IconName = ComponentProps<typeof Ionicons>['name'];



const QUICK_ACTIONS: QuickActionItem[] = [

  { label: 'Messages', href: '/dashboard/chat-operations', icon: 'chatbubbles', tint: '#0084FF' },

  { label: 'My Attendance', href: '/dashboard/attendance/my-attendance', icon: 'calendar', tint: '#A855F7' },

  { label: 'Apply Leave', href: '/dashboard/leave/apply-leave', icon: 'airplane', tint: '#F97316' },

  { label: 'Leave Balance', href: '/dashboard/leave/leave-balance', icon: 'wallet', tint: '#EC4899' },

  { label: 'Notifications', href: '/dashboard/notifications', icon: 'notifications', tint: '#EAB308' },

  { label: 'Profile', href: '/dashboard/settings/profile', icon: 'person', tint: '#67E8F9' },

];



function greetingForHour(hour: number): string {

  if (hour < 12) return 'Good morning';

  if (hour < 17) return 'Good afternoon';

  return 'Good evening';

}



function formatHeaderDate(): string {

  return new Intl.DateTimeFormat(undefined, {

    weekday: 'short',

    month: 'short',

    day: 'numeric',

  }).format(new Date());

}



export function DashboardHomeScreen() {
  const { user } = useAuth();

  const navItems = useDashboardActivityNavItems();

  const widgets = useDashboardWidgets();

  const gates = useChatApiGates();

  const accessToken = useAccessToken() ?? '';

  const queryClient = useQueryClient();



  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'there';

  const initials =

    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() ||

    user?.email?.[0]?.toUpperCase() ||

    'U';

  const greeting = greetingForHour(new Date().getHours());

  const firstName = name.split(' ')[0];



  const overviewBlocks = blocksForWidgets(widgets);

  const showPlatformOverview =

    widgets.platformOverview || widgets.revenue || widgets.orgSummary;

  const overviewFetching = useIsFetching({ queryKey: dashboardKeys.root }) > 0;



  const agentQueues = useAgentInboxQueues(

    accessToken,

    Boolean(gates.agentInbox && widgets.chatAgent),

    user?.id,

  );



  const onRefresh = () => {

    if (showPlatformOverview) {

      void queryClient.invalidateQueries({ queryKey: dashboardKeys.root });

      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'activity-log'] });

    }

    if (gates.agentInbox && widgets.chatAgent) void agentQueues.refreshQueues();

  };



  const activeCount = agentQueues.activeChats?.length ?? 0;

  const closedCount = agentQueues.closedChats?.length ?? 0;



  return (

    <MobileScreen

      contentStyle={styles.screen}

      refreshControl={

        <RefreshControl

          refreshing={overviewFetching}

          onRefresh={onRefresh}

          tintColor={tokens.colors.accentBlue}

        />

      }

    >

      <View style={styles.stack}>

        {/* Hero */}

        <LiquidGlass intensity="medium" radius={glassUi.radius.lg} elevated contentStyle={styles.hero}>

          <LinearGradient

            colors={[...glassUi.gradient.headerSheen]}

            start={{ x: 0, y: 0 }}

            end={{ x: 1, y: 1 }}

            style={StyleSheet.absoluteFillObject}

          />

          <View style={styles.heroTop}>

            <View style={styles.heroAvatar}>

              <Typography variant="medium16" style={styles.avatarText}>

                {initials}

              </Typography>

            </View>

            <View style={styles.heroCopy}>

              <View style={styles.heroMetaRow}>

                <Typography variant="small" muted style={styles.eyebrow}>

                  ConvergeIT

                </Typography>

                <View style={styles.datePill}>

                  <Ionicons name="calendar-outline" size={12} color={tokens.colors.textMuted} />

                  <Typography variant="small" muted>

                    {formatHeaderDate()}

                  </Typography>

                </View>

              </View>

              <Typography variant="boldLarge" numberOfLines={1}>

                {greeting}, {firstName}

              </Typography>

              <Typography variant="small" muted numberOfLines={2}>

                Everything you need — one tap away

              </Typography>

            </View>

          </View>

        </LiquidGlass>



        {/* Attendance — primary action */}

        <DashboardAttendancePanel />



        {/* Agent inbox snapshot */}

        {widgets.chatAgent && gates.agentInbox ? (

          <View style={styles.section}>

            <DashboardSectionHeader

              title="Live conversations"

              subtitle="Your active queue"

              icon="chatbubbles"

              iconColor="#0084FF"

            />

            <DashboardMetricGrid>
              <MetricCard
                title="Active"
                value={String(activeCount)}
                subtitle="In progress"
                showTrendArrow={false}
                valueColor="#0084FF"
                iconBgColor="rgba(0, 132, 255, 0.2)"
                icon={<Ionicons name="chatbubbles" size={20} color="#0084FF" />}
              />
              <MetricCard
                title="Recent"
                value={String(closedCount)}
                subtitle="Closed today"
                showTrendArrow={false}
                valueColor={tokens.colors.accentOrange}
                iconBgColor="rgba(249, 115, 22, 0.18)"
                icon={<Ionicons name="time" size={20} color={tokens.colors.accentOrange} />}
              />
            </DashboardMetricGrid>

            <Link href={webHrefToMobile('/dashboard/chat-operations') as Href} asChild>

              <Pressable style={({ pressed }) => [styles.inboxCta, pressed && styles.pressed]}>

                <LiquidGlass intensity="subtle" radius={16} contentStyle={styles.inboxCtaInner}>

                  <View style={[styles.inboxIcon, { backgroundColor: 'rgba(0, 132, 255, 0.2)' }]}>

                    <Ionicons name="chatbubbles" size={18} color="#0084FF" />

                  </View>

                  <View style={styles.inboxCopy}>

                    <Typography variant="medium16" style={styles.inboxTitle}>

                      Open Messages

                    </Typography>

                    <Typography variant="small" muted>

                      Reply to customers in real time

                    </Typography>

                  </View>

                  <Ionicons name="arrow-forward" size={18} color={tokens.colors.accentBlue} />

                </LiquidGlass>

              </Pressable>

            </Link>

          </View>

        ) : null}



        {/* Platform metrics */}

        {showPlatformOverview && overviewBlocks.length > 0 ? (

          <View style={styles.section}>

            <PlatformOverviewDashboard
              blocks={overviewBlocks}
              showHeader={false}
              showDateFilter
              embedded
            />

          </View>

        ) : null}



        {/* Fallback when no widgets */}

        {!showPlatformOverview && !widgets.chatAgent ? (

          <DashboardMetricGrid>
            <MetricCard
              title="Modules"
              value={String(Math.max(navItems.length, QUICK_ACTIONS.length))}
              subtitle="Quick access"
              showTrendArrow={false}
              iconBgColor="rgba(88, 101, 242, 0.18)"
              icon={<Ionicons name="apps" size={20} color={tokens.colors.accentBlue} />}
            />
            <MetricCard
              title="Role access"
              value={String(navItems.length)}
              subtitle="In your menu"
              showTrendArrow={false}
              valueColor={tokens.colors.accentOrange}
              iconBgColor="rgba(249, 115, 22, 0.16)"
              icon={
                <Ionicons name="shield-checkmark" size={20} color={tokens.colors.accentOrange} />
              }
            />
          </DashboardMetricGrid>

        ) : null}



        {/* Quick actions grid */}

        <View style={styles.section}>

          <DashboardSectionHeader

            title="Quick actions"

            subtitle="Shortcuts to daily tools"

            icon="flash-outline"

            iconColor={tokens.colors.accentPurple}

          />

          <DashboardQuickActionGrid items={QUICK_ACTIONS} />

        </View>



        {navItems.length > 0 ? (

          <LiquidGlass intensity="subtle" radius={16} contentStyle={styles.footerNote}>

            <Ionicons name="shield-checkmark-outline" size={16} color={tokens.colors.textMuted} />

            <Typography variant="small" muted style={{ flex: 1 }}>

              {navItems.length} modules available from your role permissions.

            </Typography>

          </LiquidGlass>

        ) : null}
      </View>
    </MobileScreen>
  );
}



const styles = StyleSheet.create({

  screen: {

    paddingBottom: tokens.space.xxl,

  },

  stack: {

    gap: 20,

  },

  section: {

    gap: 4,

  },

  hero: {

    padding: 18,

    overflow: 'hidden',

  },

  heroTop: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 14,

  },

  heroAvatar: {

    width: 56,

    height: 56,

    borderRadius: 28,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: 'rgba(110, 142, 251, 0.38)',

    borderWidth: 2,

    borderColor: 'rgba(255,255,255,0.28)',

  },

  avatarText: {

    fontWeight: '800',

  },

  heroCopy: {

    flex: 1,

    minWidth: 0,

    gap: 2,

  },

  heroMetaRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    gap: 8,

    marginBottom: 2,

  },

  eyebrow: {

    textTransform: 'uppercase',

    letterSpacing: 1.1,

    fontWeight: '700',

    fontSize: 11,

  },

  datePill: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    paddingHorizontal: 8,

    paddingVertical: 4,

    borderRadius: 999,

    backgroundColor: 'rgba(255,255,255,0.06)',

  },

  inboxCta: {

    marginTop: 4,

  },

  inboxCtaInner: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 12,

    paddingVertical: 14,

    paddingHorizontal: 14,

  },

  inboxIcon: {

    width: 42,

    height: 42,

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',

  },

  inboxCopy: {

    flex: 1,

    minWidth: 0,

    gap: 2,

  },

  inboxTitle: {

    fontWeight: '700',

  },

  footerNote: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 10,

    padding: 14,

  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});


