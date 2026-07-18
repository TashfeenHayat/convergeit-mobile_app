/**
 * React Native port shell — source: converge_saas_frontend/components/layout/dashboard/DashboardSidebar/DashboardSidebar.tsx
 * Nav drawer is implemented in `app/(dashboard)/_layout.tsx`; this export keeps tree parity.
 */
import { View } from "react-native";

export { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH } from "./styles/sidebar.styles";

export default function DashboardSidebar(): null {
  return null;
}

/** Placeholder container if a screen needs sidebar-width spacing. */
export function DashboardSidebarSpacer() {
  return <View />;
}
