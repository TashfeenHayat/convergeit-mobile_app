import { StyleSheet } from "react-native";
import { tokens } from "@/theme/tokens";

/** Match web sidebar width constants for mirrored exports. */
export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_COLLAPSED_WIDTH = 72;

/** RN stub for web styles: layout/dashboard/DashboardSidebar/styles/sidebar.styles.ts */
export const styles = StyleSheet.create({
  root: { padding: tokens.space.md },
});

export default styles;
