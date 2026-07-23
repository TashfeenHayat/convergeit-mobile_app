import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Typography } from "@/components/ui";
import { useAppTheme } from "@/theme";
import { tokens } from "@/theme/tokens";

type PayPageShellProps = {
  children: ReactNode;
  title?: string;
};

export function PayPageShell({ children, title }: PayPageShellProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.appBackground }]}>
      <View style={styles.header}>
        <Typography variant="boldLarge" style={{ letterSpacing: 0.3 }}>
          ConvergeIT
        </Typography>
        {title ? (
          <Typography variant="small" muted>
            {title}
          </Typography>
        ) : null}
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
       showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: tokens.space.lg,
    paddingTop: tokens.space.md,
    paddingBottom: tokens.space.sm,
  },
  content: {
    paddingHorizontal: tokens.space.lg,
    paddingBottom: tokens.space.xl,
    flexGrow: 1,
  },
});
