import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui';
import type { WidgetDeployState } from '@/lib/chat-widget/widget-admin-meta';
import { useAppTheme } from '@/theme';

export type WidgetDraftStatusBarProps = {
  /** Wizard steps vs detail page banner copy. */
  variant?: 'wizard' | 'detail';
  deployState?: WidgetDeployState | null;
  /** Legacy wizard props */
  statusLabel?: string | null;
  unpublishedDraft?: boolean;
};

const WIZARD_COPY =
  'Working draft — each step saves with PATCH. Real sites show the widget only after you click Go live. Use the test link to preview anytime.';

function detailCopy(deployState: WidgetDeployState | null | undefined): string {
  if (deployState === 'live') {
    return 'Live on customer sites. Wizard edits save as draft until you publish changes or take offline.';
  }
  if (deployState === 'live_with_pending_draft') {
    return 'Live version is on sites. You have newer saved changes — click Go live to update the embed.';
  }
  if (deployState === 'draft_only') {
    return 'Offline on real sites. Share the test link to preview. Click Go live when you want visitors to see it.';
  }
  return 'Widget configuration.';
}

export function WidgetDraftStatusBar({
  variant = 'wizard',
  deployState = null,
  statusLabel,
  unpublishedDraft = false,
}: WidgetDraftStatusBarProps) {
  const theme = useAppTheme();
  const info = theme.app.dashboard.accentCyan || '#38BDF8';

  if (variant === 'wizard' && !statusLabel && !unpublishedDraft && !deployState) {
    return null;
  }

  const copy =
    variant === 'detail'
      ? detailCopy(deployState)
      : statusLabel
        ? `${statusLabel}${unpublishedDraft ? ' · Unpublished changes' : ''}`
        : WIZARD_COPY;

  return (
    <View
      style={[
        styles.bar,
        {
          borderColor: `${info}4D`,
          backgroundColor: `${info}1A`,
        },
      ]}
    >
      <Ionicons name="information-circle-outline" size={18} color={info} />
      <Typography variant="small" muted style={{ flex: 1, lineHeight: 18 }}>
        {copy}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
});
