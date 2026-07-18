import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const logo = require('../../assets/images/logo.png');

/** Brand splash palette — fixed so light OS theme never flashes white. */
const BRAND = {
  top: '#050508',
  mid: '#0a0a2c',
  bottom: '#12142a',
  glow: '#5865F2',
  text: 'rgba(248, 250, 252, 0.72)',
} as const;

export type SplashScreenProps = {
  message?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Modern branded splash — shown until fonts / session / first data are ready.
 * Native cold-start splash (`app.json`) uses the same background `#050508`.
 */
export function SplashScreen({ message = 'Loading…', style }: SplashScreenProps) {
  const pulse = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.96, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={[styles.root, style]} accessibilityLabel="ConvergeIT splash">
      <StatusBar style="light" />
      <LinearGradient
        colors={[BRAND.top, BRAND.mid, BRAND.bottom]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.glow} pointerEvents="none" />
      <Animated.View style={[styles.center, { transform: [{ scale: pulse }] }]}>
        <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityLabel="ConvergeIT" />
      </Animated.View>
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={BRAND.glow} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.top,
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: BRAND.glow,
    opacity: 0.16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 74,
  },
  footer: {
    position: 'absolute',
    bottom: 72,
    alignItems: 'center',
    gap: 12,
  },
  message: {
    color: BRAND.text,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
