import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui';
import { LauncherPresetIcon } from '@/lib/chat-widget/launcherIcons';
import type { LauncherIconPresetId } from '@/lib/chat-widget/launcher-icon-presets';
import type { ParsedSnapshotPreview } from '@/lib/chat-widget/snapshot-preview-model';
import { isRecord } from '@/lib/utils';
import { useAppTheme } from '@/theme';

export type WidgetSnapshotPreviewProps = {
  parsed: ParsedSnapshotPreview;
};

function ChatMiniPreview({ chat }: { chat: Record<string, unknown> }) {
  const theme = useAppTheme();
  const launcher = isRecord(chat.launcher) ? chat.launcher : {};
  const chatBox = isRecord(chat.chatBox) ? chat.chatBox : {};
  const colors = isRecord(chat.colors) ? chat.colors : {};

  const btn = String(colors.button ?? '#1E63D5');
  const iconCol = String(colors.icon ?? '#FFFFFF');
  const headerTextCol = String(colors.headerText ?? '#FFFFFF');
  const headerTitle = String(chatBox.headerTitle ?? 'Chat');
  const greeting = String(chatBox.greetingMessage ?? '');
  const iconPreset = String(launcher.iconPreset ?? '') as LauncherIconPresetId;
  const label = String(launcher.label ?? 'Chat with us');
  const invitation = String(
    launcher.invitationText ?? launcher.proactiveMessage ?? '',
  );

  return (
    <View
      style={[
        styles.stage,
        { borderColor: theme.app.dashboard.cardBorder },
      ]}
    >
      <Typography variant="small" muted style={styles.caption}>
        Visual preview from your saved configuration
      </Typography>

      <View style={[styles.panel, { backgroundColor: btn }]}>
        <View style={styles.panelHeader}>
          <Typography
            variant="medium"
            style={{ color: headerTextCol, fontWeight: '700' }}
          >
            {headerTitle}
          </Typography>
          <Typography variant="small" style={{ color: headerTextCol }}>
            Online
          </Typography>
        </View>
        <View style={styles.panelBody}>
          {greeting ? (
            <View style={styles.bubble}>
              <Typography variant="small" color="#0F172A">
                {greeting}
              </Typography>
            </View>
          ) : (
            <Typography variant="small" muted>
              Message area
            </Typography>
          )}
        </View>
      </View>

      {invitation ? (
        <View style={styles.invitation}>
          <Typography variant="small" color="#0F172A">
            {invitation}
          </Typography>
        </View>
      ) : null}

      <View style={[styles.fab, { backgroundColor: btn }]}>
        {iconPreset ? (
          <LauncherPresetIcon
            presetId={iconPreset}
            color={iconCol}
            fontSizePx={18}
          />
        ) : (
          <Ionicons name="chatbubble-ellipses" size={18} color={iconCol} />
        )}
        {label ? (
          <Typography
            variant="small"
            style={{ color: iconCol, fontWeight: '700' }}
          >
            {label}
          </Typography>
        ) : null}
        <View style={styles.badge}>
          <Typography variant="small" color="#FFFFFF" style={{ fontSize: 10 }}>
            1
          </Typography>
        </View>
      </View>
    </View>
  );
}

export function WidgetSnapshotPreview({ parsed }: WidgetSnapshotPreviewProps) {
  if (!parsed.hasRenderable) {
    return (
      <Typography variant="small" muted>
        No saved design to preview.
      </Typography>
    );
  }

  if (parsed.chat) {
    return <ChatMiniPreview chat={parsed.chat} />;
  }

  return (
    <Typography variant="small" muted>
      {parsed.widgetTypeLabel} preview
    </Typography>
  );
}

const styles = StyleSheet.create({
  stage: {
    minHeight: 280,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#E8ECF4',
    padding: 12,
    gap: 10,
    overflow: 'hidden',
  },
  caption: { marginBottom: 4 },
  panel: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 160,
  },
  panelHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  panelBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    minHeight: 100,
  },
  bubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: '90%',
  },
  invitation: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  fab: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
