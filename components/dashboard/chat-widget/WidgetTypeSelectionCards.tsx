import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui';
import type { WidgetKind } from '@/lib/chat-widget/widgetDraft';
import { useAppTheme } from '@/theme';

const CARD_ITEMS: {
  id: WidgetKind;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}[] = [
  {
    id: 'chat',
    title: 'Chat Widget',
    description: 'Live chat launcher, pre-chat form, and agent inbox routing.',
    icon: 'chatbubble-outline',
    iconColor: '#7DD3FC',
  },
  {
    id: 'text',
    title: 'Text Us Widget',
    description: 'SMS-style visitor form with your branding and Twilio replies.',
    icon: 'chatbox-ellipses-outline',
    iconColor: '#FDBA74',
  },
  {
    id: 'both',
    title: 'Chat + Text Us',
    description:
      'One embed script — visitors choose chat or Text Us in the same panel.',
    icon: 'albums-outline',
    iconColor: '#C4B5FD',
  },
];

export type WidgetTypeSelectionCardsProps = {
  selectedType: WidgetKind;
  onSelect: (kind: WidgetKind) => void;
  disabled?: boolean;
  /** When set, only these widget types are shown. */
  allowedKinds?: readonly WidgetKind[];
};

export function WidgetTypeSelectionCards({
  selectedType,
  onSelect,
  disabled,
  allowedKinds,
}: WidgetTypeSelectionCardsProps) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;

  const visibleItems = allowedKinds?.length
    ? CARD_ITEMS.filter((item) => allowedKinds.includes(item.id))
    : CARD_ITEMS;

  if (visibleItems.length === 0) {
    return (
      <Typography variant="medium" muted>
        No widget products are enabled for this reseller. Turn on Chat Widget
        and/or Text Us under Services.
      </Typography>
    );
  }

  return (
    <View style={styles.grid}>
      {visibleItems.map((item, index) => {
        const active = selectedType === item.id;
        const isThirdOfThree =
          visibleItems.length === 3 && index === 2;
        return (
          <Pressable
            key={item.id}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: Boolean(disabled) }}
            onPress={() => {
              if (disabled) return;
              onSelect(item.id);
            }}
            style={({ pressed }) => [
              styles.card,
              isThirdOfThree ? styles.cardFull : styles.cardHalf,
              {
                borderColor: active
                  ? accent
                  : theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
                opacity: disabled ? 0.65 : pressed ? 0.92 : 1,
              },
            ]}
          >
            <View style={styles.cardTop}>
              <View
                style={[styles.iconWrap, { backgroundColor: item.iconColor }]}
              >
                <Ionicons name={item.icon} size={18} color="#0B1024" />
              </View>
              <Ionicons
                name={active ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={active ? accent : theme.app.text.muted}
              />
            </View>
            <Typography variant="mediumLarge" style={{ fontWeight: '700' }}>
              {item.title}
            </Typography>
            <Typography variant="small" muted>
              {item.description}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cardHalf: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
  },
  cardFull: {
    width: '100%',
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
