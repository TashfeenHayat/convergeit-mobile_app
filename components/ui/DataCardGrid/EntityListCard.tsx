import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Typography } from '@/components/ui/Typography';
import { hexAlpha, useThemeColors } from '@/lib/theme/use-theme-colors';
import { glassUi } from '@/lib/theme/glass-ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type EntityListCardBadgeTone = 'internal' | 'external' | 'neutral';

export type EntityListCardDetail = {
  label: string;
  value: string;
};

export type EntityListCardProps = {
  /** Primary label (e.g. user name). */
  title: string;
  /** Secondary line under title (e.g. email). */
  subtitle?: string;
  /** Labeled rows, e.g. Role / Department / Reseller. */
  details?: EntityListCardDetail[];
  /** Accent meta under header (e.g. role) — lavender in the reference UI. */
  meta?: string;
  /** Footer left label (e.g. department). */
  footerLabel?: string;
  footerIcon?: IconName;
  /** Extra footer line (e.g. reseller). */
  secondaryFooterLabel?: string;
  secondaryFooterIcon?: IconName;
  /** Pill on footer right — string uses built-in Internal/External tones. */
  badge?: ReactNode;
  badgeLabel?: string;
  badgeTone?: EntityListCardBadgeTone;
  /** Avatar initials; derived from `title` when omitted. */
  initials?: string;
  /** Solid avatar fill; hashed from `title` when omitted. */
  avatarColor?: string;
  /** Green status dot on avatar. */
  status?: 'online' | 'offline' | null;
  onPress?: () => void;
  /** Visible edit icon (purple pencil). */
  onEditPress?: () => void;
  /** Visible delete icon (red trash). */
  onDeletePress?: () => void;
  /** Vertical ellipsis — opens row actions (optional if edit/delete shown). */
  onMenuPress?: () => void;
  menuAccessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const AVATAR_PALETTE = [
  '#7C3AED',
  '#0D9488',
  '#EA580C',
  '#2563EB',
  '#DB2777',
  '#059669',
  '#4F46E5',
  '#CA8A04',
] as const;

function initialsFromTitle(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function colorFromTitle(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function ToneBadge({
  label,
  tone,
}: {
  label: string;
  tone: EntityListCardBadgeTone;
}) {
  const colors = useThemeColors();
  const palette =
    tone === 'external'
      ? {
          bg: hexAlpha(colors.accentPurple, colors.isLight ? 0.18 : 0.32),
          border: hexAlpha(colors.accentPurple, 0.45),
          text: colors.isLight ? colors.accentPurple : '#E9D5FF',
        }
      : tone === 'internal'
        ? {
            bg: hexAlpha(colors.accentBlue, colors.isLight ? 0.16 : 0.3),
            border: hexAlpha(colors.accentBlue, 0.45),
            text: colors.isLight ? colors.accentBlue : '#BFDBFE',
          }
        : {
            bg: hexAlpha(colors.textMuted, 0.16),
            border: hexAlpha(colors.textMuted, 0.35),
            text: colors.textSecondary,
          };

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Typography variant="small" color={palette.text} style={styles.badgeLabel} numberOfLines={1}>
        {label}
      </Typography>
    </View>
  );
}

/**
 * Profile-style list card (avatar · title · meta · footer badge).
 * Reusable for users, agents, contacts, and similar directories.
 */
export function EntityListCard({
  title,
  subtitle,
  details,
  meta,
  footerLabel,
  footerIcon = 'briefcase-outline',
  secondaryFooterLabel,
  secondaryFooterIcon = 'storefront-outline',
  badge,
  badgeLabel,
  badgeTone = 'neutral',
  initials,
  avatarColor,
  status = null,
  onPress,
  onEditPress,
  onDeletePress,
  onMenuPress,
  menuAccessibilityLabel = 'Open actions',
  style,
}: EntityListCardProps) {
  const colors = useThemeColors();
  const fill = avatarColor ?? colorFromTitle(title);
  const letters = (initials ?? initialsFromTitle(title)).slice(0, 2);
  const detailRows = (details ?? []).filter((d) => d.value.trim());
  const hasDetails = detailRows.length > 0;
  const showLegacyFooter =
    !hasDetails &&
    (Boolean(footerLabel) || Boolean(secondaryFooterLabel) || badge != null || Boolean(badgeLabel));
  const showBadge = badge != null || Boolean(badgeLabel);
  const showActions = Boolean(onEditPress || onDeletePress || onMenuPress);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.isLight
            ? hexAlpha('#FFFFFF', 0.92)
            : hexAlpha(colors.surfaceElevated || colors.surface || '#1E293B', 0.72),
          borderColor: colors.cardBorder,
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={onPress}
          disabled={!onPress}
          style={styles.headerMain}
          accessibilityRole={onPress ? 'button' : undefined}
        >
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: fill }]}>
              <Typography variant="small" color="#FFFFFF" style={styles.avatarText}>
                {letters}
              </Typography>
            </View>
            {status === 'online' ? (
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: colors.accentGreen,
                    borderColor: colors.surfaceElevated || colors.cardBg || '#0F172A',
                  },
                ]}
              />
            ) : null}
          </View>

          <View style={styles.headerText}>
            <Typography
              variant="medium16"
              color={colors.textPrimary}
              style={styles.title}
              numberOfLines={1}
            >
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="small" color={colors.textMuted} numberOfLines={1}>
                {subtitle}
              </Typography>
            ) : null}
          </View>
        </Pressable>

        {showActions ? (
          <View style={styles.actions}>
            {onEditPress ? (
              <Pressable
                onPress={onEditPress}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${title}`}
                style={styles.actionBtn}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={colors.isLight ? colors.accentPurple : '#E9D5FF'}
                />
              </Pressable>
            ) : null}
            {onDeletePress ? (
              <Pressable
                onPress={onDeletePress}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${title}`}
                style={styles.actionBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.isLight ? colors.accentRed : '#FCA5A5'}
                />
              </Pressable>
            ) : null}
            {onMenuPress ? (
              <Pressable
                onPress={onMenuPress}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={menuAccessibilityLabel}
                style={styles.actionBtn}
              >
                <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {hasDetails ? (
        <View style={styles.detailsBlock}>
          <View style={styles.detailsList}>
            {detailRows.map((row) => (
              <Typography
                key={`${row.label}:${row.value}`}
                variant="small"
                color={colors.textMuted}
                numberOfLines={1}
              >
                <Typography variant="small" color={colors.textSecondary} style={styles.detailLabel}>
                  {row.label}:
                </Typography>{' '}
                <Typography variant="small" color={colors.textPrimary} style={styles.detailValue}>
                  {row.value}
                </Typography>
              </Typography>
            ))}
          </View>
          {showBadge ? (
            badge != null ? (
              badge
            ) : (
              <ToneBadge label={badgeLabel!} tone={badgeTone} />
            )
          ) : null}
        </View>
      ) : (
        <>
          {meta ? (
            <Typography
              variant="small"
              color={colors.isLight ? colors.accentPurple : '#C4B5FD'}
              style={styles.meta}
              numberOfLines={1}
            >
              {meta}
            </Typography>
          ) : null}

          {showLegacyFooter ? (
            <View style={styles.footerBlock}>
              {footerLabel || secondaryFooterLabel ? (
                <View style={styles.footerMeta}>
                  {footerLabel ? (
                    <View style={styles.footerLeft}>
                      <Ionicons name={footerIcon} size={13} color={colors.textMuted} />
                      <Typography
                        variant="small"
                        color={colors.textMuted}
                        numberOfLines={1}
                        style={styles.footerLabel}
                      >
                        {footerLabel}
                      </Typography>
                    </View>
                  ) : null}
                  {secondaryFooterLabel ? (
                    <View style={styles.footerLeft}>
                      <Ionicons name={secondaryFooterIcon} size={13} color={colors.textMuted} />
                      <Typography
                        variant="small"
                        color={colors.textMuted}
                        numberOfLines={1}
                        style={styles.footerLabel}
                      >
                        {secondaryFooterLabel}
                      </Typography>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.footerLeft} />
              )}
              {badge != null ? (
                badge
              ) : badgeLabel ? (
                <ToneBadge label={badgeLabel} tone={badgeTone} />
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: glassUi.radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  statusDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingTop: 1,
  },
  title: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: -2,
    marginRight: -4,
  },
  actionBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    fontWeight: '600',
    marginLeft: 52,
  },
  detailsBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    marginLeft: 52,
  },
  detailsList: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  detailLabel: {
    fontWeight: '600',
  },
  detailValue: {
    fontWeight: '500',
  },
  footerBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    marginLeft: 52,
  },
  footerMeta: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  footerLabel: {
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 110,
  },
  badgeLabel: {
    fontWeight: '700',
    fontSize: 11,
  },
});
