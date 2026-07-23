import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { MobileScreen } from "@/components/layout";
import { useColorScheme } from "@/components/useColorScheme";
import { AppCard, Button, InputField, Typography } from "@/components/ui";
import { ThemeSwatchButton } from "@/features/theme/components/ThemeSwatchButton";
import { useThemeAppearanceSave } from "@/features/theme/use-theme-appearance-save";
import { useAppearance } from "@/lib/theme/appearance-context";
import {
  APPEARANCE_PRESET_BY_ID,
  PICK_COLOR_PRESET_ID,
  SYSTEM_APPEARANCE_PRESET_ID,
  resolveEffectiveAppearancePresetId,
} from "@/lib/theme/appearance-presets";
import type { AppearancePreset } from "@/lib/theme/appearance-preset.types";
import { getCustomAccentTheme } from "@/lib/theme/custom-accent-theme";
import {
  getDefaultThemePresets,
  getSolidColorPresets,
} from "@/lib/theme/theme-appearance.utils";
import { useAppTheme } from "@/theme";
import { tokens } from "@/theme/tokens";

export function ThemeCustomizePageClient() {
  const theme = useAppTheme();
  const colorScheme = useColorScheme();
  const {
    presetId,
    setPresetId,
    presets,
    customAccentHex,
    setCustomAccentHex,
    customAccentEndHex,
    setCustomAccentEndHex,
  } = useAppearance();

  const [hexDraft, setHexDraft] = useState(customAccentHex);
  const [endHexDraft, setEndHexDraft] = useState(customAccentEndHex);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { platformThemeQuery, syncedHex, needsSave, isSavingTheme, handleSaveTheme } =
    useThemeAppearanceSave(presetId, customAccentHex, customAccentEndHex);

  const defaultThemePresets = useMemo(() => getDefaultThemePresets(presets), [presets]);
  const solidColorPresets = useMemo(() => getSolidColorPresets(presets), [presets]);
  const pickSelected = presetId === PICK_COLOR_PRESET_ID;
  const systemSelected = presetId === SYSTEM_APPEARANCE_PRESET_ID;

  useEffect(() => {
    setHexDraft(customAccentHex);
  }, [customAccentHex]);

  useEffect(() => {
    setEndHexDraft(customAccentEndHex);
  }, [customAccentEndHex]);

  const swatchColors = useCallback(
    (p: AppearancePreset) => {
      if (p.id === PICK_COLOR_PRESET_ID) {
        const custom = getCustomAccentTheme(customAccentHex, customAccentEndHex);
        return { previewBar: custom.previewBar, previewTab: custom.previewTab };
      }
      if (p.id === SYSTEM_APPEARANCE_PRESET_ID) {
        const effectiveId = resolveEffectiveAppearancePresetId(SYSTEM_APPEARANCE_PRESET_ID, colorScheme);
        const effective = APPEARANCE_PRESET_BY_ID[effectiveId] ?? p;
        return { previewBar: effective.previewBar, previewTab: effective.previewTab };
      }
      return { previewBar: p.previewBar, previewTab: p.previewTab };
    },
    [colorScheme, customAccentHex, customAccentEndHex],
  );

  const applyHexDraft = () => setCustomAccentHex(hexDraft);
  const applyEndHexDraft = () => setCustomAccentEndHex(endHexDraft);

  return (
    <MobileScreen scroll={false}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: theme.spacing.screen }]}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ gap: theme.spacing.md }}>
          <View>
            <Typography variant="boldLarge">Customize appearance</Typography>
            <Typography variant="medium" muted style={{ marginTop: 4 }}>
              System follows your phone light/dark setting. Pick another theme to lock it, then save to sync your account.
            </Typography>
          </View>

          {platformThemeQuery.isLoading ? (
            <Typography variant="small" muted>
              Loading saved theme…
            </Typography>
          ) : platformThemeQuery.isError ? (
            <Typography variant="small" muted>
              Could not load saved theme; showing local settings.
            </Typography>
          ) : null}

          {syncedHex !== undefined && needsSave ? (
            <AppCard style={styles.alertCard}>
              <Typography variant="small" color={theme.app.dashboard.accentOrange}>
                Unsaved changes — colors are only on this device until you save to your account.
              </Typography>
              <Button size="compact" loading={isSavingTheme} disabled={isSavingTheme} onPress={handleSaveTheme}>
                Save to account
              </Button>
            </AppCard>
          ) : null}

          {syncedHex !== undefined && !needsSave && !platformThemeQuery.isLoading ? (
            <Typography variant="small" color={theme.app.dashboard.accentGreen}>
              Saved — dashboard matches your account.
            </Typography>
          ) : null}

          {defaultThemePresets.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Typography variant="medium16" style={{ fontWeight: "700" }}>
                Default theme
              </Typography>
              <View style={styles.swatchRow}>
                {defaultThemePresets.map((p) => {
                  const colors = swatchColors(p);
                  return (
                    <ThemeSwatchButton
                      key={p.id}
                      compact
                      shape="tile"
                      selected={presetId === p.id}
                      accessibilityLabel={p.label}
                      previewBar={colors.previewBar}
                      previewTab={colors.previewTab}
                      onPress={() => setPresetId(p.id)}
 />
                  );
                })}
              </View>
              {systemSelected ? (
                <Typography variant="small" muted>
                  Using {colorScheme === "light" ? "light" : "dark"} mode from your device.
                </Typography>
              ) : null}
            </View>
          ) : null}

          <View style={{ gap: 8 }}>
            <Typography variant="medium16" style={{ fontWeight: "700" }}>
              Color themes
            </Typography>
            <View style={styles.colorGrid}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Custom gradient picker"
                accessibilityState={{ selected: pickSelected }}
                onPress={() => {
                  setPickerOpen(true);
                  setPresetId(PICK_COLOR_PRESET_ID);
                }}
                style={[
                  styles.customPicker,
                  pickSelected && { borderColor: tokens.colors.accentBlue, borderWidth: 2.5 },
                ]}
              >
                <Ionicons name="color-palette-outline" size={22} color={tokens.colors.textPrimary} />
              </Pressable>

              {solidColorPresets.map((p) => {
                const colors = swatchColors(p);
                return (
                  <ThemeSwatchButton
                    key={p.id}
                    shape="circle"
                    selected={p.id === presetId}
                    accessibilityLabel={p.label}
                    previewBar={colors.previewBar}
                    previewTab={colors.previewTab}
                    onPress={() => setPresetId(p.id)}
 />
                );
              })}
            </View>
          </View>

          {pickerOpen || pickSelected ? (
            <AppCard style={{ gap: 12 }}>
              <Typography variant="medium16" style={{ fontWeight: "600" }}>
                Custom gradient
              </Typography>
              <InputField
                label="Start color"
                value={hexDraft}
                onChangeText={setHexDraft}
                onBlur={applyHexDraft}
                placeholder="#ec4899"
                autoCapitalize="none"
 />
              <InputField
                label="End color"
                value={endHexDraft}
                onChangeText={setEndHexDraft}
                onBlur={applyEndHexDraft}
                placeholder="#831843"
                autoCapitalize="none"
 />
              <Button
                variant="outlined"
                onPress={() => {
                  applyHexDraft();
                  applyEndHexDraft();
                }}
              >
                Apply gradient
              </Button>
            </AppCard>
          ) : null}
        </View>
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32, gap: 16 },
  alertCard: { gap: 10 },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" },
  customPicker: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});
