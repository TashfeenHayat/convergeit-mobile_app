import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui';
import {
  textUsSavedConfigPreview,
} from '@/lib/chat-widget/text-us-form-defaults';
import type { TextUsThemePreviewInput } from '@/lib/chat-widget/text-us-design-json';
import type { TextUsFormFieldDraft } from '@/lib/chat-widget/widgetDraft';
import { useAppTheme } from '@/theme';

export type TextUsConfigJsonPreviewProps = {
  theme: TextUsThemePreviewInput;
  fields: TextUsFormFieldDraft[];
};

export function TextUsConfigJsonPreview({
  theme: themeInput,
  fields,
}: TextUsConfigJsonPreviewProps) {
  const theme = useAppTheme();
  const json = useMemo(
    () =>
      JSON.stringify(
        textUsSavedConfigPreview({ theme: themeInput, fields }),
        null,
        2,
      ),
    [themeInput, fields],
  );

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: theme.app.dashboard.cardBorder,
          backgroundColor: 'rgba(0,0,0,0.22)',
        },
      ]}
    >
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.app.dashboard.cardBorder },
        ]}
      >
        <Typography variant="small" muted style={{ fontWeight: '600' }}>
          Saved config preview (readable JSON)
        </Typography>
      </View>
      <ScrollView
        style={styles.body}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <Typography
          variant="small"
          muted
          style={styles.mono}
        >
          {json}
        </Typography>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  body: {
    maxHeight: 280,
    padding: 12,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 17,
  },
});
