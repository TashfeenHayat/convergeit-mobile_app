import { StyleSheet, View } from "react-native";

import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type NavItemBadgeProps = {
  count?: number;
};

/** Compact unread/count badge for nav rows. */
export function NavItemBadge({ count = 0 }: NavItemBadgeProps) {
  if (!count) return null;
  return (
    <View style={styles.badge}>
      <Typography variant="small" style={styles.text}>
        {count > 99 ? "99+" : count}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colors.accentBlue,
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 12,
  },
});
