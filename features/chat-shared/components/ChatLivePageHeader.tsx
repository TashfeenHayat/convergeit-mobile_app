import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { chatLiveHeaderCard, chatLiveNavStrip } from "../styles/chat-live.styles";
import { CHAT_CONFIGURE_NAV_ITEMS, CHAT_LIVE_NAV_ITEMS } from "../constants/chat-live-nav";
import { ChatLiveViewSwitch, type ChatLiveViewOption } from "./ChatLiveViewSwitch";

export type ChatLiveNavItem = {
  href: string;
  label: string;
};

export type ChatLiveNavPreset = "triage" | "configure" | "none";

interface ChatLivePageHeaderProps {
  title: string;
  subtitle?: string;
  /** Triage = inbox/monitor/QA. Configure = roster/reports/widget/settings. None = hide. */
  navPreset?: ChatLiveNavPreset;
  navItems?: ChatLiveNavItem[];
  /** Current route (from expo-router `usePathname()`), used to highlight the active tab. */
  currentPath?: string;
  onNavigate?: (href: string) => void;
  trailing?: ReactNode;
  hideBottomBorder?: boolean;
  viewSwitch?: {
    options: ChatLiveViewOption[];
    value: string;
    onChange: (id: string) => void;
    ariaLabel?: string;
  };
}

function resolveNavItems(preset: ChatLiveNavPreset, override?: ChatLiveNavItem[]): ChatLiveNavItem[] {
  if (override !== undefined) return override;
  if (preset === "none") return [];
  if (preset === "configure") return CHAT_CONFIGURE_NAV_ITEMS;
  return CHAT_LIVE_NAV_ITEMS;
}

export function ChatLivePageHeader({
  title,
  subtitle,
  navPreset = "triage",
  navItems,
  currentPath,
  onNavigate,
  trailing,
  hideBottomBorder = false,
  viewSwitch,
}: ChatLivePageHeaderProps) {
  const stripItems = resolveNavItems(navPreset, navItems);

  return (
    <View style={[chatLiveHeaderCard.root, hideBottomBorder ? { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 } : null]}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: tokens.space.sm }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Typography variant="regularLarge" style={{ fontWeight: "700", color: tokens.colors.textPrimary }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="medium" muted style={{ marginTop: 3, lineHeight: 20 }}>
              {subtitle}
            </Typography>
          ) : null}
        </View>
        {trailing ? <View>{trailing}</View> : null}
      </View>

      {viewSwitch ? (
        <ChatLiveViewSwitch
          options={viewSwitch.options}
          value={viewSwitch.value}
          onChange={viewSwitch.onChange}
          ariaLabel={viewSwitch.ariaLabel}
 />
      ) : null}

      {stripItems.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={chatLiveNavStrip.scroll}
          contentContainerStyle={chatLiveNavStrip.row} showsVerticalScrollIndicator={false}>
          {stripItems.map((item) => {
            const active = Boolean(currentPath) && (currentPath === item.href || currentPath?.startsWith(`${item.href}/`));
            return (
              <Pressable
                key={item.href}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => onNavigate?.(item.href)}
                style={[chatLiveNavStrip.link, active && chatLiveNavStrip.linkActive]}
              >
                <Typography
                  variant="label"
                  color={active ? tokens.colors.textPrimary : tokens.colors.textMuted}
                  style={{ fontWeight: active ? "600" : "500" }}
                >
                  {item.label}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

/** @deprecated kept for barrel/type-parity with web; nav items are plain data on mobile. */
export function ChatLiveNavItemView(_props: { title?: string; children?: ReactNode }) {
  return null;
}

export type ChatLiveNavPresetProps = ChatLiveNavPreset;
