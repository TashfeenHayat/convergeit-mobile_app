import { useMemo, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { chatSemanticSurface, type ChatSemanticTone } from "../styles/chat-semantic";

type ContextItem = {
  id: string;
  tone: ChatSemanticTone;
  title: string;
  content: ReactNode;
};

type Props = {
  readOnly?: boolean;
  availabilityHint?: string | null;
  hasConversation: boolean;
};

export function ChatContextRail({ readOnly = false, availabilityHint = null, hasConversation }: Props) {
  const [expanded, setExpanded] = useState(true);

  const items = useMemo((): ContextItem[] => {
    if (!hasConversation) return [];
    const list: ContextItem[] = [];
    if (readOnly) {
      list.push({
        id: "readonly",
        tone: "muted",
        title: "Read-only",
        content: <Typography variant="small" muted style={{ lineHeight: 18 }}>Closed conversation — transcript is read-only. New visitor messages may reopen the chat.</Typography>,
      });
    }
    if (availabilityHint && !readOnly) {
      list.push({
        id: "availability",
        tone: "warning",
        title: "Service window",
        content: <Typography variant="small" muted style={{ lineHeight: 18 }}>{availabilityHint}</Typography>,
      });
    }
    return list;
  }, [availabilityHint, hasConversation, readOnly]);

  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setExpanded((e) => !e)} style={styles.header} accessibilityRole="button">
        <FontAwesome name="bell" size={15} color={tokens.colors.accentBlue} />
        <Typography variant="small" style={{ fontWeight: "700" }}>
          Context
        </Typography>
        <View style={styles.countChip}>
          <Typography variant="small" color={tokens.colors.accentBlue} style={{ fontWeight: "700", fontSize: 10 }}>
            {items.length}
          </Typography>
        </View>
        <View style={{ flex: 1 }} />
        <FontAwesome name={expanded ? "chevron-up" : "chevron-down"} size={13} color={tokens.colors.textMuted} />
      </Pressable>
      {expanded ? (
        <View style={styles.body}>
          {items.map((item) => {
            const surface = chatSemanticSurface(item.tone);
            return (
              <View key={item.id} style={[styles.item, { borderColor: surface.borderColor }]}>
                <View style={[styles.itemHeader, { backgroundColor: surface.backgroundColor }]}>
                  <Typography variant="small" color={surface.labelColor} style={{ fontWeight: "700" }}>
                    {item.title}
                  </Typography>
                </View>
                <View style={{ padding: tokens.space.sm }}>{item.content}</View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexShrink: 0,
    marginHorizontal: tokens.space.md,
    marginTop: tokens.space.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 10,
  },
  countChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: "rgba(88, 101, 242, 0.16)",
  },
  body: {
    paddingHorizontal: tokens.space.sm,
    paddingBottom: tokens.space.sm,
    gap: tokens.space.sm,
  },
  item: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  itemHeader: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
