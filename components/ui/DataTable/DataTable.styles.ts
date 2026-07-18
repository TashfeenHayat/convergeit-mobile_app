import { StyleSheet } from 'react-native';

import { tokens } from '@/theme/tokens';

export const dataTableActionButton = {
  color: tokens.colors.textMuted,
} as const;

export const dataTableStyles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  table: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
  },
  bodyRowLast: {
    borderBottomWidth: 0,
  },
  bodyRowSelected: {
    backgroundColor: 'rgba(88, 101, 242, 0.2)',
    borderLeftWidth: 2,
    borderLeftColor: tokens.colors.accentBlue,
  },
  bodyRowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cell: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  cellSmall: {
    paddingVertical: 10,
  },
  cellMedium: {
    paddingVertical: 14,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cellText: {
    fontSize: 14,
    lineHeight: 20,
    color: tokens.colors.textPrimary,
  },
  cellTextMuted: {
    fontSize: 14,
    lineHeight: 20,
    color: tokens.colors.textSecondary,
  },
  emptyWrap: {
    width: '100%',
    marginVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: tokens.colors.cardBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 10,
  },
  emptyIconWell: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.pillBg,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    marginBottom: 4,
  },
  emptyTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    maxWidth: 360,
    lineHeight: 20,
  },
  skeletonBlock: {
    height: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionCell: {
    alignItems: 'flex-end',
  },
});
