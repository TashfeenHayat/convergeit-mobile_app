import { Image, StyleSheet, View } from 'react-native';

import { TextUsLauncherChip } from '@/components/embed/TextUsLauncherChip';
import { Typography } from '@/components/ui';
import type { LauncherIconPresetId } from '@/lib/chat-widget/launcher-icon-presets';
import type { WidgetLauncherStyleId } from '@/lib/chat-widget/launcher-style';
import type { TextUsFormFieldDraft } from '@/lib/chat-widget/widgetDraft';
import { useAppTheme } from '@/theme';

export type TextUsWizardLivePreviewProps = {
  buttonColor: string;
  buttonHoverColor?: string;
  iconColor?: string;
  buttonLabel?: string;
  launcherIconPreset?: LauncherIconPresetId | string;
  launcherIconEnabled?: boolean;
  launcherStyle?: WidgetLauncherStyleId | string;
  panelBackground?: string;
  position: string;
  verticalAnchor: 'top' | 'bottom';
  insetBottomPx: number;
  insetTopPx: number;
  insetSidePx: number;
  boxWidth: number;
  boxHeight: number;
  headerTitle: string;
  headerTitleEnabled?: boolean;
  headerLogoDataUrl?: string;
  headerLogoHeightPx?: number;
  headerLogoMaxWidthPx?: number;
  headerAlign?: 'left' | 'center' | 'right';
  headerMode?: 'attached' | 'detached';
  headerMinHeightPx?: number;
  headerRadiusPx?: number;
  glowColor?: string;
  welcomeMessage: string;
  welcomeEnabled: boolean;
  fields: TextUsFormFieldDraft[];
};

export function TextUsWizardLivePreview({
  buttonColor,
  buttonHoverColor,
  iconColor = '#ffffff',
  buttonLabel = 'Text Us',
  launcherIconPreset = 'phosphor-chat-circle',
  launcherIconEnabled = true,
  panelBackground = '#f8fafc',
  position,
  verticalAnchor,
  insetBottomPx,
  insetTopPx,
  insetSidePx,
  boxWidth,
  boxHeight,
  headerTitle,
  headerTitleEnabled = true,
  headerLogoDataUrl,
  headerLogoHeightPx = 28,
  headerLogoMaxWidthPx = 96,
  headerAlign = 'left',
  headerMode = 'attached',
  headerMinHeightPx = 44,
  headerRadiusPx = 12,
  glowColor,
  welcomeMessage,
  welcomeEnabled,
  fields,
}: TextUsWizardLivePreviewProps) {
  const theme = useAppTheme();
  const btn = buttonColor.trim() || '#1E63D5';
  const title = headerTitle.trim();
  const showHeaderTitle = headerTitleEnabled !== false && Boolean(title);
  const welcome = welcomeEnabled ? welcomeMessage.trim() : '';
  const headerDetached = headerMode === 'detached';
  const logoHeight = Math.min(48, Math.max(16, headerLogoHeightPx));
  const headerMinH = Math.max(
    Math.min(64, Math.max(36, headerMinHeightPx)),
    headerLogoDataUrl ? logoHeight + 12 : 0,
  );
  const headerRadius = Math.min(28, Math.max(0, headerRadiusPx));
  const alignSelf =
    String(position).toLowerCase() === 'left'
      ? 'flex-start'
      : String(position).toLowerCase() === 'center'
        ? 'center'
        : 'flex-end';
  const headerJustify =
    headerAlign === 'center'
      ? 'center'
      : headerAlign === 'right'
        ? 'flex-end'
        : 'flex-start';

  const scale = 0.42;
  const panelW = Math.max(140, Math.min(220, boxWidth * scale));
  const panelH = Math.max(160, Math.min(260, boxHeight * scale));
  const padSide = Math.max(8, Math.min(28, insetSidePx * 0.35));
  const padVert = Math.max(
    8,
    Math.min(28, (verticalAnchor === 'top' ? insetTopPx : insetBottomPx) * 0.35),
  );

  const headerBar = (
    <View
      style={[
        styles.headerBar,
        {
          backgroundColor: btn,
          minHeight: headerMinH * 0.7,
          justifyContent: headerJustify,
          borderRadius: headerDetached ? headerRadius : 0,
        },
      ]}
    >
      {headerLogoDataUrl ? (
        <Image
          source={{ uri: headerLogoDataUrl }}
          style={{
            height: logoHeight * 0.7,
            width: Math.min(headerLogoMaxWidthPx * 0.5, 72),
            resizeMode: 'contain',
          }}
        />
      ) : null}
      {showHeaderTitle ? (
        <Typography
          variant="small"
          color="#fff"
          style={{ fontWeight: '700', flexShrink: 1 }}
          numberOfLines={1}
        >
          {title}
        </Typography>
      ) : null}
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.offlineBadge}>
        <Typography
          variant="small"
          style={{ color: '#FB923C', fontWeight: '700' }}
        >
          Offline — Go live when ready
        </Typography>
      </View>
      <Typography variant="medium" style={{ fontWeight: '700' }}>
        Live preview (draft)
      </Typography>
      <Typography variant="small" muted>
        Matches your edits here — customer sites update after you publish on
        Install.
      </Typography>

      <View
        style={[
          styles.stage,
          {
            borderColor: theme.app.dashboard.cardBorder,
            paddingBottom: verticalAnchor === 'bottom' ? padVert : 12,
            paddingTop: verticalAnchor === 'top' ? padVert : 12,
            paddingLeft: String(position).toLowerCase() === 'left' ? padSide : 12,
            paddingRight:
              String(position).toLowerCase() === 'right' ? padSide : 12,
          },
        ]}
      >
        <Typography variant="small" muted style={{ marginBottom: 6 }}>
          Text Us on your website
        </Typography>
        <View
          style={{
            alignSelf,
            flexDirection:
              verticalAnchor === 'bottom' ? 'column-reverse' : 'column',
            gap: 8,
            maxWidth: '100%',
          }}
        >
          <TextUsLauncherChip
            size="preview"
            buttonColor={btn}
            buttonHoverColor={buttonHoverColor}
            iconColor={iconColor}
            iconPreset={launcherIconPreset}
            iconEnabled={launcherIconEnabled}
            glowColor={glowColor}
            buttonLabel={buttonLabel}
          />

          <View style={{ width: panelW, gap: headerDetached ? 6 : 0 }}>
            {headerDetached ? headerBar : null}
            <View
              style={[
                styles.panel,
                {
                  height: panelH,
                  backgroundColor: panelBackground,
                  borderColor: 'rgba(15,23,42,0.12)',
                },
              ]}
            >
              {!headerDetached ? headerBar : null}
              <View style={styles.panelBody}>
                {welcome ? (
                  <View
                    style={[
                      styles.welcome,
                      { backgroundColor: `${btn}14`, borderColor: `${btn}22` },
                    ]}
                  >
                    <Typography
                      variant="small"
                      style={{ color: '#334155', fontSize: 11, lineHeight: 15 }}
                    >
                      {welcome}
                    </Typography>
                  </View>
                ) : null}
                {fields.slice(0, 3).map((field) => (
                  <View key={field.key} style={styles.fieldMock}>
                    <Typography
                      variant="small"
                      style={{ color: '#475569', fontSize: 10, fontWeight: '600' }}
                    >
                      {field.label || field.key}
                    </Typography>
                    <Typography
                      variant="small"
                      style={{ color: '#94A3B8', fontSize: 11 }}
                      numberOfLines={1}
                    >
                      {field.placeholder?.trim() || ' '}
                    </Typography>
                  </View>
                ))}
                {fields.length > 3 ? (
                  <Typography
                    variant="small"
                    style={{ color: '#64748b', fontSize: 10 }}
                  >
                    +{fields.length - 3} more field
                    {fields.length - 3 === 1 ? '' : 's'}
                  </Typography>
                ) : null}
                <View style={[styles.sendBtn, { backgroundColor: btn }]}>
                  <Typography
                    variant="small"
                    color="#fff"
                    style={{ fontWeight: '700', fontSize: 11 }}
                  >
                    Send message
                  </Typography>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  offlineBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(251,146,60,0.12)',
  },
  stage: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 280,
    backgroundColor: '#0B1220',
    padding: 12,
    overflow: 'hidden',
  },
  panel: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  panelBody: {
    flex: 1,
    padding: 10,
    gap: 8,
  },
  welcome: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  fieldMock: {
    borderWidth: 1,
    borderColor: '#CCD6E6',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  sendBtn: {
    marginTop: 'auto',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
});
