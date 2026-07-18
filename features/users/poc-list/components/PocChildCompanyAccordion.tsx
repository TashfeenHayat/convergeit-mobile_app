import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Typography } from '@/components/ui';
import { PocContactCard } from '@/features/users/poc-list/components/PocContactCard';
import type { PocChildGroup } from '@/features/users/poc-list/types';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

const POC_PREVIEW_LIMIT = 4;

function CountBadge({ label, accent }: { label: string; accent?: boolean }) {
  const theme = useAppTheme();
  const accentColor = theme.app.dashboard.accentBlue;
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: accent ? `${accentColor}22` : theme.app.dashboard.overlayLight,
          borderColor: accent ? `${accentColor}55` : theme.app.dashboard.cardBorder,
        },
      ]}
    >
      <Typography
        variant="small"
        style={{ fontWeight: '600', color: accent ? accentColor : theme.app.text.secondary }}
      >
        {label}
      </Typography>
    </View>
  );
}

export type PocChildCompanyAccordionProps = {
  child: PocChildGroup;
  expanded: boolean;
  onToggle: (open: boolean) => void;
};

export function PocChildCompanyAccordion({
  child,
  expanded,
  onToggle,
}: PocChildCompanyAccordionProps) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const [showAllPocs, setShowAllPocs] = useState(false);
  const pocCount = child.contacts.length;
  const hasMorePocs = pocCount > POC_PREVIEW_LIMIT;
  const visibleContacts =
    showAllPocs || !hasMorePocs ? child.contacts : child.contacts.slice(0, POC_PREVIEW_LIMIT);

  useEffect(() => {
    if (!expanded) setShowAllPocs(false);
  }, [expanded]);

  return (
    <View
      style={[
        styles.shell,
        {
          borderColor: theme.app.dashboard.cardBorder,
          backgroundColor: theme.app.dashboard.overlayLight,
        },
      ]}
    >
      <Pressable
        onPress={() => onToggle(!expanded)}
        style={({ pressed }) => [styles.header, { opacity: pressed ? 0.9 : 1 }]}
      >
        <View
          style={[
            styles.icon,
            {
              backgroundColor: `${accent}18`,
              borderColor: glassUi.border.subtle,
            },
          ]}
        >
          <Ionicons name="business-outline" size={16} color={accent} />
        </View>
        <View style={styles.headerBody}>
          <View style={styles.titleRow}>
            <Typography variant="medium" style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>
              {child.name}
            </Typography>
            <CountBadge accent label={`${pocCount} POC${pocCount === 1 ? '' : 's'}`} />
          </View>
          {!expanded ? (
            <Typography variant="small" muted numberOfLines={1}>
              {pocCount} contact{pocCount === 1 ? '' : 's'} — expand to view
            </Typography>
          ) : null}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.app.text.secondary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          <View style={{ gap: 8 }}>
            {visibleContacts.map((contact) => (
              <PocContactCard key={contact.companyContactId} contact={contact} />
            ))}
          </View>
          {hasMorePocs && !showAllPocs ? (
            <Pressable
              onPress={() => setShowAllPocs(true)}
              style={({ pressed }) => [
                styles.showAll,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Typography variant="small" style={{ fontWeight: '700', color: accent }}>
                Show all {pocCount} contacts
              </Typography>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  details: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  showAll: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
