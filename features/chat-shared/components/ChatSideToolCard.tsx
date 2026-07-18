import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type ChatSideToolCardAccent = "default" | "guest" | "supervisor" | "danger";

export type ChatSideToolCardProps = {
  title: string;
  subtitle?: string;
  accent?: ChatSideToolCardAccent;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

function accentColor(accent: ChatSideToolCardAccent): string {
  switch (accent) {
    case "guest":
      return "#38BDF8";
    case "supervisor":
      return "#A855F7";
    case "danger":
      return tokens.colors.danger;
    default:
      return tokens.colors.accentBlue;
  }
}

/** Sidebar tool block (guest links, supervisor whisper/takeover). */
export function ChatSideToolCard({ title, subtitle, accent = "default", children, style }: ChatSideToolCardProps) {
  const main = accentColor(accent);
  return (
    <View style={[styles.card, { borderColor: `${main}47` }, style]}>
      <Typography variant="label" style={{ color: tokens.colors.textPrimary, fontWeight: "700", marginBottom: subtitle ? 2 : 8 }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="small" muted style={{ marginBottom: 10, lineHeight: 18 }}>
          {subtitle}
        </Typography>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: tokens.space.md,
    padding: tokens.space.md,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
});
