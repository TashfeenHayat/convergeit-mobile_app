import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/components/common/icons/app-icons.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type AppIconSvgProps = Record<string, unknown>;
export type SidebarNavIconSlotProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function SidebarNavIconSlot(props: SidebarNavIconSlotProps) {
  const label = props.title ?? "SidebarNavIconSlot";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type SidebarReactIconProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function SidebarReactIcon(props: SidebarReactIconProps) {
  const label = props.title ?? "SidebarReactIcon";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type SearchIconProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function SearchIcon(props: SearchIconProps) {
  const label = props.title ?? "SearchIcon";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type AddCircleIconProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function AddCircleIcon(props: AddCircleIconProps) {
  const label = props.title ?? "AddCircleIcon";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type CloseCircleIconProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function CloseCircleIcon(props: CloseCircleIconProps) {
  const label = props.title ?? "CloseCircleIcon";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type BellIconProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function BellIcon(props: BellIconProps) {
  const label = props.title ?? "BellIcon";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type HeaderSettingsIconProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function HeaderSettingsIcon(props: HeaderSettingsIconProps) {
  const label = props.title ?? "HeaderSettingsIcon";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type DeleteCircleIconProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function DeleteCircleIcon(props: DeleteCircleIconProps) {
  const label = props.title ?? "DeleteCircleIcon";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type ChatsByDepartmentIconProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function ChatsByDepartmentIcon(props: ChatsByDepartmentIconProps) {
  const label = props.title ?? "ChatsByDepartmentIcon";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type DollarBadgeIconProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function DollarBadgeIcon(props: DollarBadgeIconProps) {
  const label = props.title ?? "DollarBadgeIcon";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type SIDEBAR_ICON_BY_KEYProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function SIDEBAR_ICON_BY_KEY(props: SIDEBAR_ICON_BY_KEYProps) {
  const label = props.title ?? "SIDEBAR_ICON_BY_KEY";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    padding: tokens.space.md,
    gap: tokens.space.sm,
  },
});
