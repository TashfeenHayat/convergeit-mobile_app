import { Alert, Pressable, StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";

import { Typography } from "@/components/ui";
import { useAppTheme } from "@/theme";
import { tokens } from "@/theme/tokens";

type CopyableFieldProps = {
  label: string;
  value: string;
  mono?: boolean;
};

export function CopyableField({ label, value, mono = true }: CopyableFieldProps) {
  const theme = useAppTheme();

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(value);
      Alert.alert("Copied", "Copied to clipboard.");
    } catch {
      Alert.alert(label, value);
    }
  };

  return (
    <View style={{ gap: 4 }}>
      <Typography variant="small" muted>
        {label}
      </Typography>
      <View style={[styles.row, { borderColor: theme.app.dashboard.cardBorder }]}>
        <Typography
          variant="small"
          style={[styles.value, mono && styles.mono]}
          numberOfLines={4}
        >
          {value}
        </Typography>
        <Pressable onPress={() => void handleCopy()} style={styles.copyBtn}>
          <Typography variant="small" color={theme.app.dashboard.accentBlue} style={{ fontWeight: "700" }}>
            Copy
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: tokens.radius.md,
    backgroundColor: "rgba(110, 142, 251, 0.1)",
    borderWidth: 1,
  },
  value: {
    flex: 1,
  },
  mono: {
    fontFamily: "SpaceMono",
    fontSize: 12,
  },
  copyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
