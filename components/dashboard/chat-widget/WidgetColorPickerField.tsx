import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { InputField, Typography } from '@/components/ui';
import { useAppTheme } from '@/theme';

export function toWidgetColorInputValue(
  raw: string | undefined,
  fallback: string,
): string {
  const t = (raw ?? '').trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t.toUpperCase()}`;
  return fallback.toUpperCase();
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = toWidgetColorInputValue(hex, '#1E63D5').slice(1);
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0').toUpperCase();
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** HSV: h 0–360, s/v 0–1 */
function rgbToHsv(r: number, g: number, b: number): {
  h: number;
  s: number;
  v: number;
} {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function hsvToRgb(
  h: number,
  s: number,
  v: number,
): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (h < 60) {
    rp = c;
    gp = x;
  } else if (h < 120) {
    rp = x;
    gp = c;
  } else if (h < 180) {
    gp = c;
    bp = x;
  } else if (h < 240) {
    gp = x;
    bp = c;
  } else if (h < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }
  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  };
}

function hueToHex(h: number): string {
  const { r, g, b } = hsvToRgb(h, 1, 1);
  return rgbToHex(r, g, b);
}

export type WidgetColorPickerFieldProps = {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  fallback?: string;
};

/**
 * Color field with swatch + hex, and a popover picker (SV map, hue, RGB)
 * matching the web widget color picker UX.
 */
export function WidgetColorPickerField({
  label,
  value,
  onChange,
  disabled,
  fallback = '#1E63D5',
}: WidgetColorPickerFieldProps) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const hex = toWidgetColorInputValue(value, fallback);
  const swatch = value?.trim()
    ? toWidgetColorInputValue(value, fallback)
    : fallback;

  return (
    <View style={styles.field}>
      <Typography
        variant="small"
        muted
        style={{ fontWeight: '600', marginBottom: 6 }}
      >
        {label}
      </Typography>
      <View style={styles.row}>
        <Pressable
          disabled={disabled}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`${label} — open color picker`}
          style={[
            styles.swatch,
            {
              backgroundColor: swatch,
              borderColor: theme.app.dashboard.cardBorder,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        />
        <View style={{ flex: 1 }}>
          <InputField
            value={hex}
            editable={!disabled}
            autoCapitalize="characters"
            autoCorrect={false}
            onChangeText={(t) => {
              const next = t.trim();
              if (/^#[0-9A-Fa-f]{0,6}$/.test(next) || /^[0-9A-Fa-f]{0,6}$/.test(next)) {
                const withHash = next.startsWith('#') ? next : `#${next}`;
                if (/^#[0-9A-Fa-f]{6}$/.test(withHash)) {
                  onChange(withHash.toUpperCase());
                } else {
                  onChange(withHash);
                }
              }
            }}
            onBlur={() => onChange(toWidgetColorInputValue(value, fallback))}
          />
        </View>
      </View>

      <ColorPickerModal
        open={open}
        color={hex}
        onClose={() => setOpen(false)}
        onChange={onChange}
      />
    </View>
  );
}

function ColorPickerModal({
  open,
  color,
  onClose,
  onChange,
}: {
  open: boolean;
  color: string;
  onClose: () => void;
  onChange: (hex: string) => void;
}) {
  const theme = useAppTheme();
  const initial = hexToRgb(color);
  const initialHsv = rgbToHsv(initial.r, initial.g, initial.b);

  const [h, setH] = useState(initialHsv.h);
  const [s, setS] = useState(initialHsv.s);
  const [v, setV] = useState(initialHsv.v);
  const [rText, setRText] = useState(String(initial.r));
  const [gText, setGText] = useState(String(initial.g));
  const [bText, setBText] = useState(String(initial.b));

  const [svSize, setSvSize] = useState({ w: 280, h: 180 });
  const [hueWidth, setHueWidth] = useState(280);

  useEffect(() => {
    if (!open) return;
    const rgb = hexToRgb(color);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setH(hsv.h);
    setS(hsv.s);
    setV(hsv.v);
    setRText(String(rgb.r));
    setGText(String(rgb.g));
    setBText(String(rgb.b));
  }, [open, color]);

  const commitHsv = useCallback(
    (nh: number, ns: number, nv: number) => {
      const rgb = hsvToRgb(nh, ns, nv);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setH(nh);
      setS(ns);
      setV(nv);
      setRText(String(Math.round(rgb.r)));
      setGText(String(Math.round(rgb.g)));
      setBText(String(Math.round(rgb.b)));
      onChange(hex);
    },
    [onChange],
  );

  const commitRgb = useCallback(
    (r: number, g: number, b: number) => {
      const hex = rgbToHex(r, g, b);
      const hsv = rgbToHsv(r, g, b);
      setH(hsv.h);
      setS(hsv.s);
      setV(hsv.v);
      setRText(String(clamp(Math.round(r), 0, 255)));
      setGText(String(clamp(Math.round(g), 0, 255)));
      setBText(String(clamp(Math.round(b), 0, 255)));
      onChange(hex);
    },
    [onChange],
  );

  const currentHex = useMemo(() => {
    const rgb = hsvToRgb(h, s, v);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }, [h, s, v]);

  const hueColor = hueToHex(h);

  const hsvRef = useRef({ h, s, v });
  hsvRef.current = { h, s, v };
  const svSizeRef = useRef(svSize);
  svSizeRef.current = svSize;
  const hueWidthRef = useRef(hueWidth);
  hueWidthRef.current = hueWidth;

  const onSvLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSvSize({ w: width, h: height });
  };

  const applySvFromXY = useCallback(
    (x: number, y: number) => {
      const size = svSizeRef.current;
      const ns = clamp(x / Math.max(size.w, 1), 0, 1);
      const nv = 1 - clamp(y / Math.max(size.h, 1), 0, 1);
      commitHsv(hsvRef.current.h, ns, nv);
    },
    [commitHsv],
  );

  const applyHueFromX = useCallback(
    (x: number) => {
      const nh = clamp(x / Math.max(hueWidthRef.current, 1), 0, 1) * 360;
      const cur = hsvRef.current;
      commitHsv(nh, cur.s, cur.v);
    },
    [commitHsv],
  );

  const svPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          applySvFromXY(e.nativeEvent.locationX, e.nativeEvent.locationY);
        },
        onPanResponderMove: (e) => {
          applySvFromXY(e.nativeEvent.locationX, e.nativeEvent.locationY);
        },
      }),
    [applySvFromXY],
  );

  const huePan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          applyHueFromX(e.nativeEvent.locationX);
        },
        onPanResponderMove: (e) => {
          applyHueFromX(e.nativeEvent.locationX);
        },
      }),
    [applyHueFromX],
  );

  const knobLeft = s * svSize.w;
  const knobTop = (1 - v) * svSize.h;
  const hueKnobLeft = (h / 360) * hueWidth;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.popover,
            {
              backgroundColor: '#FFFFFF',
              borderColor: theme.app.dashboard.cardBorder,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.popoverHeader}>
            <Typography
              variant="medium"
              color="#0F172A"
              style={{ fontWeight: '700' }}
            >
              Pick a color
            </Typography>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          <View
            style={styles.svWrap}
            onLayout={onSvLayout}
            {...svPan.panHandlers}
          >
            <LinearGradient
              colors={['#FFFFFF', hueColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0)', '#000000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              pointerEvents="none"
              style={[
                styles.svKnob,
                {
                  left: clamp(knobLeft - 8, 0, Math.max(svSize.w - 16, 0)),
                  top: clamp(knobTop - 8, 0, Math.max(svSize.h - 16, 0)),
                  borderColor: '#FFFFFF',
                  backgroundColor: currentHex,
                },
              ]}
            />
          </View>

          <View style={styles.toolsRow}>
            <View
              style={[
                styles.previewCircle,
                { backgroundColor: currentHex, borderColor: '#E2E8F0' },
              ]}
            />
            <View style={{ flex: 1, gap: 8 }}>
              <View
                style={styles.hueTrack}
                onLayout={(e) => setHueWidth(e.nativeEvent.layout.width)}
                {...huePan.panHandlers}
              >
                <LinearGradient
                  colors={[
                    '#FF0000',
                    '#FFFF00',
                    '#00FF00',
                    '#00FFFF',
                    '#0000FF',
                    '#FF00FF',
                    '#FF0000',
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.hueKnob,
                    {
                      left: clamp(
                        hueKnobLeft - 8,
                        0,
                        Math.max(hueWidth - 16, 0),
                      ),
                    },
                  ]}
                />
              </View>
              <Typography variant="small" color="#64748B">
                {currentHex}
              </Typography>
            </View>
          </View>

          <View style={styles.rgbRow}>
            <RgbBox
              label="R"
              value={rText}
              onChangeText={(t) => {
                setRText(t.replace(/[^\d]/g, '').slice(0, 3));
              }}
              onCommit={() => {
                const r = clamp(Number(rText) || 0, 0, 255);
                const g = clamp(Number(gText) || 0, 0, 255);
                const b = clamp(Number(bText) || 0, 0, 255);
                commitRgb(r, g, b);
              }}
            />
            <RgbBox
              label="G"
              value={gText}
              onChangeText={(t) => {
                setGText(t.replace(/[^\d]/g, '').slice(0, 3));
              }}
              onCommit={() => {
                const r = clamp(Number(rText) || 0, 0, 255);
                const g = clamp(Number(gText) || 0, 0, 255);
                const b = clamp(Number(bText) || 0, 0, 255);
                commitRgb(r, g, b);
              }}
            />
            <RgbBox
              label="B"
              value={bText}
              onChangeText={(t) => {
                setBText(t.replace(/[^\d]/g, '').slice(0, 3));
              }}
              onCommit={() => {
                const r = clamp(Number(rText) || 0, 0, 255);
                const g = clamp(Number(gText) || 0, 0, 255);
                const b = clamp(Number(bText) || 0, 0, 255);
                commitRgb(r, g, b);
              }}
            />
          </View>

          <Pressable
            onPress={onClose}
            style={[styles.doneBtn, { backgroundColor: theme.app.dashboard.accentBlue }]}
          >
            <Typography
              variant="medium"
              color="#FFFFFF"
              style={{ fontWeight: '700', textAlign: 'center' }}
            >
              Done
            </Typography>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function RgbBox({
  label,
  value,
  onChangeText,
  onCommit,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  onCommit: () => void;
}) {
  return (
    <View style={styles.rgbBox}>
      <Typography variant="small" color="#64748B" style={{ fontWeight: '700' }}>
        {label}
      </Typography>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onCommit}
        onSubmitEditing={onCommit}
        keyboardType="number-pad"
        style={styles.rgbInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { width: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 2,
    marginBottom: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  popover: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    maxWidth: 360,
    width: '100%',
    alignSelf: 'center',
  },
  popoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  svWrap: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  svKnob: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
  },
  hueTrack: {
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    position: 'relative',
  },
  hueKnob: {
    position: 'absolute',
    top: 1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  rgbRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rgbBox: {
    flex: 1,
    gap: 4,
  },
  rgbInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#0F172A',
    fontWeight: '600',
    backgroundColor: '#F8FAFC',
  },
  doneBtn: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 12,
  },
});
