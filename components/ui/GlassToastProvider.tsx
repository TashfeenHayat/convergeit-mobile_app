import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LiquidGlass } from '@/components/ui/LiquidGlass';
import { Typography } from '@/components/ui/Typography';
import { glassUi } from '@/lib/theme/glass-ui';
import { subscribeAppToasts, type AppToastPayload } from '@/lib/notify';
import { useAppTheme } from '@/theme';

type ToastItem = AppToastPayload & { id: string };

const AUTO_DISMISS_MS = 3200;

/**
 * Frosted glass toast stack (Control Center style) — replaces native Alert bridge.
 */
export function GlassToastProvider({ children }: { children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    return subscribeAppToasts((payload) => {
      idRef.current += 1;
      const id = `toast-${idRef.current}`;
      setToasts((prev) => [...prev.slice(-2), { ...payload, id }]);
    });
  }, []);

  return (
    <>
      {children}
      <View
        pointerEvents="box-none"
        style={[styles.host, { top: Math.max(insets.top, 12) + 8 }]}
      >
        {toasts.map((toast) => (
          <GlassToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => dismiss(toast.id)}
            accent={
              toast.variant === 'error'
                ? theme.app.dashboard.accentRed
                : theme.app.dashboard.accentGreen
            }
          />
        ))}
      </View>
    </>
  );
}

function GlassToastItem({
  toast,
  onDismiss,
  accent,
}: {
  toast: ToastItem;
  onDismiss: () => void;
  accent: string;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -8, duration: 180, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [onDismiss, opacity, translateY]);

  const icon = toast.variant === 'error' ? 'alert-circle' : 'checkmark-circle';

  return (
    <Animated.View style={[styles.toastWrap, { opacity, transform: [{ translateY }] }]}>
      <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss toast">
        <LiquidGlass
          intensity="strong"
          radius={glassUi.radius.pill}
          elevated
          contentStyle={styles.toastInner}
        >
          <View style={[styles.iconWell, { backgroundColor: `${accent}33` }]}>
            <Ionicons name={icon} size={18} color={accent} />
          </View>
          <Typography variant="medium" style={styles.message} numberOfLines={3}>
            {toast.message}
          </Typography>
        </LiquidGlass>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 9999,
    elevation: 9999,
    gap: 8,
  },
  toastWrap: {
    width: '100%',
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  iconWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    minWidth: 0,
    fontWeight: '600',
  },
});
