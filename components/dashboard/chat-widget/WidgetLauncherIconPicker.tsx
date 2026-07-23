import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui';
import {
  LAUNCHER_ICON_PRESETS,
  type LauncherIconPresetId,
} from '@/lib/chat-widget/launcher-icon-presets';

export function WidgetLauncherIconPicker({
  value,
  onChange,
  accentColor,
  disabled,
}: {
  value: LauncherIconPresetId;
  onChange: (id: LauncherIconPresetId) => void;
  accentColor: string;
  disabled?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <Typography variant="medium" style={{ fontWeight: '700', marginBottom: 8 }}>
        Default launcher icon
      </Typography>
      <View style={styles.grid}>
        {LAUNCHER_ICON_PRESETS.map((item) => {
          const active = value === item.id;
          return (
            <Pressable
              key={item.id}
              disabled={disabled}
              onPress={() => onChange(item.id)}
              style={[
                styles.cell,
                {
                  backgroundColor: accentColor,
                  borderColor: active ? '#FFFFFF' : 'transparent',
                  borderWidth: 2,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <Ionicons name={item.ionicon} size={18} color="#FFFFFF" />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
