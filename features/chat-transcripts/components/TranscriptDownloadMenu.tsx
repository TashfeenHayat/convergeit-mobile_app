import { useState } from "react";
import { Modal, Pressable, Share, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { ChatMessage } from "@/services/chat/chat.types";
import { publishAppToast } from "@/lib/notify";
import { buildTranscriptPlainText, type TranscriptExportMeta } from "../utils/export-transcript";

type Props = {
  messages: ChatMessage[];
  meta: TranscriptExportMeta;
  disabled?: boolean;
};

export function TranscriptDownloadMenu({ messages, meta, disabled = false }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const canDownload = !disabled && messages.length > 0;

  const sharePlainText = async () => {
    setMenuOpen(false);
    try {
      await Share.share({
        title: meta.title,
        message: buildTranscriptPlainText(messages, meta),
      });
    } catch {
      publishAppToast({ variant: "error", message: "Could not share transcript." });
    }
  };

  const notifyExcelWord = () => {
    setMenuOpen(false);
    publishAppToast({
      variant: "error",
      message: "Excel and Word export are available on the web dashboard.",
    });
  };

  return (
    <>
      <Button variant="secondary" size="compact" disabled={!canDownload} onPress={() => setMenuOpen(true)}>
        Download
      </Button>
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <Typography variant="medium" style={{ fontWeight: "700", marginBottom: tokens.space.sm }}>
              Export transcript
            </Typography>
            <Pressable style={styles.menuItem} onPress={() => void sharePlainText()}>
              <Ionicons name="share-outline" size={18} color={tokens.colors.textPrimary} />
              <Typography variant="medium">Share as text</Typography>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={notifyExcelWord}>
              <Ionicons name="document-outline" size={18} color={tokens.colors.textMuted} />
              <Typography variant="medium" muted>
                Excel (.xlsx) — web only
              </Typography>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={notifyExcelWord}>
              <Ionicons name="document-text-outline" size={18} color={tokens.colors.textMuted} />
              <Typography variant="medium" muted>
                Word (.docx) — web only
              </Typography>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  menu: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    padding: tokens.space.lg,
    gap: tokens.space.xs,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    paddingVertical: tokens.space.sm,
  },
});
