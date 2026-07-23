import { useEffect, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { InputField, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { AgentVisitorPresentation } from "@/services/chat/chat.types";
import { canUseSupervisorTools } from "@/lib/permissions/chat-access";
import {
  formatProfileChatDurationMinutes,
  formatProfileChatId,
  formatProfileChatTimeUtc,
  isConversationClosed,
  readAgentLabelFromMeta,
  resolveChatEndedAt,
  resolveChatStartedAt,
} from "../utils/visitor-profile-meta";
import { parseVisitorInfo } from "../utils/visitor-info";
import { useConversationSupervisor } from "../hooks/useConversationSupervisor";
import { VisitorLocationMap } from "./VisitorLocationMap";
import { CloseChatSection } from "./CloseChatSection";
import { SupervisorToolsPanel } from "./SupervisorToolsPanel";
import { ProfileMetaGridCell, ProfileMetaGridSection } from "./VisitorProfileBlocks";
import { EmptyState, PanelColumn, PanelHeader, ProfileHeroCard, QueueAvatar } from "../styles/chat-operations.styled";

interface VisitorInfoPanelProps {
  visitor: Record<string, unknown> | null;
  conversationId: string | null;
  websiteId?: string | null;
  conversationMeta?: Record<string, unknown> | null;
  visitorPresentation?: AgentVisitorPresentation | null;
  assignedAgentLabel?: string | null;
  assignedAgentId?: string | null;
  currentUserId?: string;
  hasOperational: (p: string) => boolean;
  supervisorReadOnly?: boolean;
  showWebsiteFallback?: boolean;
  fallbackWebsiteId?: string;
  onFallbackWebsiteIdChange?: (value: string) => void;
  onCloseChat?: () => void | Promise<void>;
  closeDisabled?: boolean;
  hideSupervisorTools?: boolean;
}

function sessionFieldIcon(label: string): keyof typeof Ionicons.glyphMap {
  const lower = label.toLowerCase();
  if (lower.includes("session")) return "pricetag-outline";
  if (lower.includes("start") || lower.includes("time")) return "time-outline";
  if (lower.includes("duration")) return "hourglass-outline";
  if (lower.includes("agent")) return "headset-outline";
  if (lower.includes("referrer") || lower.includes("traffic")) return "globe-outline";
  if (lower.includes("browser") || lower.includes("device") || lower.includes("os")) return "desktop-outline";
  if (lower.includes("country") || lower.includes("region") || lower.includes("zip") || lower.includes("ip")) {
    return "location-outline";
  }
  return "information-circle-outline";
}

function contactFieldIcon(label: string): keyof typeof Ionicons.glyphMap {
  const lower = label.toLowerCase();
  if (lower.includes("email")) return "mail-outline";
  if (lower.includes("phone")) return "call-outline";
  if (lower.includes("company")) return "business-outline";
  return "person-outline";
}

function AccordionSection({
  sectionId,
  expanded,
  onToggle,
  icon,
  label,
  children,
}: {
  sectionId: string;
  expanded: string | false;
  onToggle: (key: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: ReactNode;
}) {
  const open = expanded === sectionId;

  return (
    <View style={styles.sectionBorder}>
      <Pressable onPress={() => onToggle(sectionId)} style={styles.sectionHeader} accessibilityRole="button">
        <View style={styles.sectionTitleRow}>
          <Ionicons name={icon} size={17} color={tokens.colors.accentBlue} />
          <Typography variant="medium" style={{ fontWeight: "600" }}>
            {label}
          </Typography>
        </View>
        <Ionicons
          name="chevron-down"
          size={16}
          color={tokens.colors.textMuted}
          style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
 />
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

export function VisitorInfoPanel({
  visitor,
  conversationId,
  conversationMeta,
  visitorPresentation = null,
  assignedAgentLabel = null,
  assignedAgentId = null,
  currentUserId,
  hasOperational,
  supervisorReadOnly = false,
  showWebsiteFallback = false,
  fallbackWebsiteId = "",
  onFallbackWebsiteIdChange,
  onCloseChat,
  closeDisabled = false,
  hideSupervisorTools = false,
}: VisitorInfoPanelProps) {
  const parsed = parseVisitorInfo(visitor, conversationMeta ?? undefined);
  const displayName = visitorPresentation?.displayName?.trim() || parsed.displayName;
  const originLine = visitorPresentation?.originLabel?.trim() || null;
  const locationLine = visitorPresentation?.locationLabel?.trim() || parsed.location?.label || null;
  const [expanded, setExpanded] = useState<string | false>(false);
  const supervisorEnabled = canUseSupervisorTools(hasOperational) && Boolean(conversationId) && !supervisorReadOnly;
  const supervisor = useConversationSupervisor(conversationId, supervisorEnabled);

  const startedAt = resolveChatStartedAt(conversationMeta ?? undefined, parsed.sessionStartedAt);
  const endedAt = resolveChatEndedAt(conversationMeta ?? undefined);
  const closed = isConversationClosed(conversationMeta ?? undefined);
  const [durationLabel, setDurationLabel] = useState(() =>
    startedAt ? formatProfileChatDurationMinutes(startedAt, endedAt ? new Date(endedAt).getTime() : undefined) : "—",
  );

  useEffect(() => {
    if (!startedAt) {
      setDurationLabel("—");
      return;
    }
    const endMs = endedAt ? new Date(endedAt).getTime() : undefined;
    const tick = () => setDurationLabel(formatProfileChatDurationMinutes(startedAt, endMs));
    tick();
    if (closed || endMs != null) return;
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [startedAt, endedAt, closed]);

  if (!conversationId) {
    return (
      <PanelColumn style={{ flex: 1 }}>
        <EmptyState>
          <Ionicons name="person-outline" size={36} color={tokens.colors.textMuted} />
          <Typography variant="small" muted style={{ textAlign: "center", maxWidth: 200 }}>
            Visitor context appears here when you select a chat
          </Typography>
        </EmptyState>
      </PanelColumn>
    );
  }

  const websiteUrl =
    visitorPresentation?.websiteUrl?.trim() ||
    parsed.currentPageUrl?.trim() ||
    (typeof conversationMeta?.websiteUrl === "string" ? (conversationMeta.websiteUrl as string).trim() : "") ||
    "";
  const agentLabel = assignedAgentLabel?.trim() || readAgentLabelFromMeta(conversationMeta ?? undefined) || "Unassigned";
  const chatId = formatProfileChatId(conversationId);
  const chatTime = startedAt ? formatProfileChatTimeUtc(startedAt) : "—";
  const live = Boolean(startedAt && !closed);
  const deviceLabel = [parsed.browser, parsed.os].filter(Boolean).join(" · ") || null;
  const isMobileDevice = parsed.os?.toLowerCase().includes("mobile");
  const sessionField = (label: string) => parsed.sessionFields.find((f) => f.label === label)?.value ?? "—";
  const visitorTimezone = sessionField("Visitor timezone");
  const agentTimezoneLabel = sessionField("Agent timezone");

  const journey =
    parsed.journey.length > 0
      ? parsed.journey
      : parsed.currentPageUrl
        ? [{ url: parsed.currentPageUrl, at: undefined }]
        : [];

  const toggleSection = (key: string) => setExpanded((prev) => (prev === key ? false : key));

  return (
    <PanelColumn style={{ flex: 1 }}>
      <PanelHeader>
        <Typography variant="small" muted style={{ fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" }}>
          Visitor profile
        </Typography>
      </PanelHeader>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: tokens.space.lg }} showsVerticalScrollIndicator={false}>
        <ProfileHeroCard style={{ alignItems: "center", gap: 6 }}>
          <QueueAvatar style={{ width: 56, height: 56 }}>
            <Typography variant="mediumLarge" style={{ fontWeight: "700" }}>
              {parsed.initials}
            </Typography>
          </QueueAvatar>
          <Typography variant="medium" style={{ fontWeight: "700", textAlign: "center" }}>
            {displayName}
          </Typography>
          <View style={styles.pill}>
            <Typography variant="small" style={{ fontWeight: "600" }}>
              {visitorPresentation?.visitorProfileComplete ? "Profile complete" : "Active user"}
            </Typography>
          </View>
        </ProfileHeroCard>

        <ProfileMetaGridSection>
          <ProfileMetaGridCell icon={<Ionicons name="globe-outline" size={16} color={tokens.colors.accentBlue} />} label="Website" href={websiteUrl || null}>
            {websiteUrl || "—"}
          </ProfileMetaGridCell>
          <ProfileMetaGridCell icon={<Ionicons name="time-outline" size={16} color={tokens.colors.accentBlue} />} label="Chat time">
            {chatTime}
          </ProfileMetaGridCell>
          <ProfileMetaGridCell icon={<Ionicons name="headset-outline" size={16} color={tokens.colors.accentBlue} />} label="Agent">
            {agentLabel}
          </ProfileMetaGridCell>
          <ProfileMetaGridCell icon={<Ionicons name="hourglass-outline" size={16} color={tokens.colors.accentBlue} />} label="Chat duration">
            {durationLabel}
          </ProfileMetaGridCell>
          <ProfileMetaGridCell icon={<Ionicons name="pricetag-outline" size={16} color={tokens.colors.accentBlue} />} label="Chat ID">
            {chatId}
          </ProfileMetaGridCell>
          <ProfileMetaGridCell icon={<Ionicons name="alarm-outline" size={16} color={tokens.colors.accentBlue} />} label="Visitor timezone">
            {visitorTimezone}
          </ProfileMetaGridCell>
          <ProfileMetaGridCell icon={<Ionicons name="time-outline" size={16} color={tokens.colors.accentBlue} />} label="Agent timezone">
            {agentTimezoneLabel}
          </ProfileMetaGridCell>
        </ProfileMetaGridSection>

        <AccordionSection sectionId="visitor" expanded={expanded} onToggle={toggleSection} icon="person-outline" label="Visitor info">
          <ProfileMetaGridSection>
            {locationLine ? (
              <ProfileMetaGridCell icon={<Ionicons name="location-outline" size={16} color={tokens.colors.accentBlue} />} label="Location">
                {locationLine}
              </ProfileMetaGridCell>
            ) : null}
            {originLine ? (
              <ProfileMetaGridCell icon={<Ionicons name="globe-outline" size={16} color={tokens.colors.accentBlue} />} label="Origin">
                {originLine}
              </ProfileMetaGridCell>
            ) : null}
            {deviceLabel ? (
              <ProfileMetaGridCell
                icon={<Ionicons name={isMobileDevice ? "phone-portrait-outline" : "desktop-outline"} size={16} color={tokens.colors.accentBlue} />}
                label="Device"
                fullWidth={!locationLine && !originLine}
              >
                {deviceLabel}
              </ProfileMetaGridCell>
            ) : null}
          </ProfileMetaGridSection>
        </AccordionSection>

        <AccordionSection sectionId="session" expanded={expanded} onToggle={toggleSection} icon="time-outline" label="Chat session">
          <ProfileMetaGridSection>
            {live ? (
              <ProfileMetaGridCell icon={<Ionicons name="radio-button-on" size={16} color={tokens.colors.accentGreen} />} label="Status" fullWidth>
                <Typography variant="small" color={tokens.colors.accentGreen} style={{ fontWeight: "600" }}>
                  Live session
                </Typography>
              </ProfileMetaGridCell>
            ) : null}
            {parsed.sessionFields.map((f) => (
              <ProfileMetaGridCell
                key={f.label}
                icon={<Ionicons name={sessionFieldIcon(f.label)} size={16} color={tokens.colors.accentBlue} />}
                label={f.label}
                muted={f.value === "—"}
              >
                {f.value}
              </ProfileMetaGridCell>
            ))}
          </ProfileMetaGridSection>
        </AccordionSection>

        <AccordionSection sectionId="contact" expanded={expanded} onToggle={toggleSection} icon="mail-outline" label="Contact info">
          <ProfileMetaGridSection>
            {parsed.contactFields.map((f) => (
              <ProfileMetaGridCell
                key={f.label}
                icon={<Ionicons name={contactFieldIcon(f.label)} size={16} color={tokens.colors.accentBlue} />}
                label={f.label}
                muted={f.value === "—"}
              >
                {f.value}
              </ProfileMetaGridCell>
            ))}
          </ProfileMetaGridSection>
        </AccordionSection>

        {parsed.location ? (
          <AccordionSection sectionId="location" expanded={expanded} onToggle={toggleSection} icon="location-outline" label="Location map">
            <View style={{ paddingHorizontal: tokens.space.md, paddingBottom: tokens.space.sm }}>
              <VisitorLocationMap location={parsed.location} />
            </View>
          </AccordionSection>
        ) : null}

        {parsed.currentPageUrl ? (
          <AccordionSection sectionId="page" expanded={expanded} onToggle={toggleSection} icon="link-outline" label="Current page">
            <ProfileMetaGridSection>
              <ProfileMetaGridCell icon={<Ionicons name="link-outline" size={16} color={tokens.colors.accentBlue} />} label="Page URL" href={parsed.currentPageUrl} fullWidth>
                {parsed.currentPageUrl}
              </ProfileMetaGridCell>
            </ProfileMetaGridSection>
          </AccordionSection>
        ) : null}

        {journey.length > 0 ? (
          <AccordionSection sectionId="journey" expanded={expanded} onToggle={toggleSection} icon="git-network-outline" label="Visitor journey">
            <ProfileMetaGridSection>
              {journey.map((step, i) => (
                <ProfileMetaGridCell
                  key={`${step.url}-${i}`}
                  icon={<Ionicons name="navigate-outline" size={16} color={tokens.colors.accentBlue} />}
                  label={step.at ? `Visit · ${step.at}` : `Step ${i + 1}`}
                  href={step.url}
                  fullWidth={journey.length === 1}
                >
                  {step.url}
                </ProfileMetaGridCell>
              ))}
            </ProfileMetaGridSection>
          </AccordionSection>
        ) : null}

        {supervisorEnabled && !hideSupervisorTools ? (
          <View style={{ paddingHorizontal: tokens.space.md, paddingTop: 4 }}>
            <SupervisorToolsPanel
              conversationId={conversationId}
              assignedAgentId={assignedAgentId}
              currentUserId={currentUserId}
              hasOperational={hasOperational}
              supervisor={supervisor}
 />
          </View>
        ) : null}

        {showWebsiteFallback && onFallbackWebsiteIdChange ? (
          <View style={{ padding: tokens.space.md }}>
            <InputField
              label="Website UUID"
              placeholder="For AI when websiteId is missing"
              value={fallbackWebsiteId}
              onChangeText={onFallbackWebsiteIdChange}
 />
          </View>
        ) : null}

        {onCloseChat && !closed ? (
          <View style={{ paddingHorizontal: tokens.space.md, paddingTop: 4 }}>
            <CloseChatSection visitorName={displayName} conversationId={conversationId} disabled={closeDisabled} onCloseChat={onCloseChat} />
          </View>
        ) : null}
      </ScrollView>
    </PanelColumn>
  );
}

const styles = StyleSheet.create({
  pill: {
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(88, 101, 242, 0.22)",
  },
  sectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.space.md,
    paddingVertical: 10,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionBody: {
    paddingBottom: 4,
  },
});
