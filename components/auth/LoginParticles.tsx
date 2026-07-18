import { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * Mobile port of web `LoginParticles` (tsparticles twinkle).
 * Same look: white dots that twinkle + drift on the auth backdrop.
 * Uses Reanimated (no DOM/tsparticles) — design of the shell is unchanged.
 */

type ParticleSpec = {
  id: number;
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
};

function hash01(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildParticles(count: number, width: number, height: number): ParticleSpec[] {
  const list: ParticleSpec[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = hash01(i + 1);
    const b = hash01(i + 17);
    const c = hash01(i + 41);
    const d = hash01(i + 73);
    const e = hash01(i + 97);
    list.push({
      id: i,
      x: a * width,
      y: b * height,
      size: 1 + c * 2,
      baseOpacity: 0.12 + d * 0.38,
      duration: 1400 + e * 2200,
      delay: a * 1800,
      driftX: (b - 0.5) * 28,
      driftY: (c - 0.5) * 28,
    });
  }
  return list;
}

function TwinkleDot({ particle }: { particle: ParticleSpec }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(1, {
          duration: particle.duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
  }, [particle.delay, particle.duration, progress]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: interpolate(t, [0, 0.5, 1], [particle.baseOpacity, 1, particle.baseOpacity]),
      transform: [
        { translateX: interpolate(t, [0, 1], [0, particle.driftX]) },
        { translateY: interpolate(t, [0, 1], [0, particle.driftY]) },
        { scale: interpolate(t, [0, 0.5, 1], [1, 1.35, 1]) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dot,
        {
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
        },
        style,
      ]}
    />
  );
}

/** Matches web auth tsparticles density on a phone viewport (~60–80). */
const PARTICLE_COUNT = 72;

export function LoginParticles() {
  const { width, height } = useWindowDimensions();
  const particles = useMemo(
    () => buildParticles(PARTICLE_COUNT, width, height),
    [width, height],
  );

  return (
    <View pointerEvents="none" style={styles.layer} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {particles.map((p) => (
        <TwinkleDot key={p.id} particle={p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
});
