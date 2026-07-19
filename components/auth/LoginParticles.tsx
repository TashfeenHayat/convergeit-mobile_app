import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

/**
 * Mobile port of web `LoginParticles` (tsparticles ^3.9.1 links + twinkle).
 * Same options as `converge_saas_frontend/app/auth/login/LoginParticles.tsx`.
 * tsparticles is DOM/canvas-only — this mirrors links/move/twinkle on SVG.
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseOpacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
};

type Link = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
};

/** Mirrors web `loginTwinkleOptions.particles` */
const LINK_DISTANCE = 130;
const LINK_OPACITY = 0.35;
const LINK_WIDTH = 1;
const MOVE_SPEED = 0.45;
const SIZE_MIN = 1;
const SIZE_MAX = 3;
const OPACITY_MIN = 0.12;
const OPACITY_MAX = 0.5;
/** Web uses 120 on ~1000×1000 density; phone viewports need fewer. */
const BASE_COUNT = 120;
const DENSITY_AREA = 1000 * 1000;

function hash01(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function particleCountForViewport(width: number, height: number) {
  const area = Math.max(width * height, 1);
  const scaled = Math.round(BASE_COUNT * (area / DENSITY_AREA));
  return Math.max(48, Math.min(90, scaled || 60));
}

function buildParticles(count: number, width: number, height: number): Particle[] {
  const list: Particle[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = hash01(i + 1);
    const b = hash01(i + 17);
    const c = hash01(i + 41);
    const d = hash01(i + 73);
    const e = hash01(i + 97);
    const angle = a * Math.PI * 2;
    const speed = MOVE_SPEED * (0.35 + b * 0.9);
    list.push({
      x: c * width,
      y: d * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: SIZE_MIN + e * (SIZE_MAX - SIZE_MIN),
      baseOpacity: OPACITY_MIN + a * (OPACITY_MAX - OPACITY_MIN),
      twinklePhase: b * Math.PI * 2,
      twinkleSpeed: 0.04 + c * 0.08,
    });
  }
  return list;
}

function stepParticles(particles: Particle[], width: number, height: number) {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.twinklePhase += p.twinkleSpeed;

    // outModes: "out" — wrap like web density field
    if (p.x < -4) p.x = width + 4;
    else if (p.x > width + 4) p.x = -4;
    if (p.y < -4) p.y = height + 4;
    else if (p.y > height + 4) p.y = -4;
  }
}

function buildLinks(particles: Particle[]): Link[] {
  const links: Link[] = [];
  const distSqMax = LINK_DISTANCE * LINK_DISTANCE;
  for (let i = 0; i < particles.length; i += 1) {
    const a = particles[i];
    for (let j = i + 1; j < particles.length; j += 1) {
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > distSqMax) continue;
      const dist = Math.sqrt(distSq);
      const fade = 1 - dist / LINK_DISTANCE;
      links.push({
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        opacity: LINK_OPACITY * fade,
      });
    }
  }
  return links;
}

type Frame = {
  particles: { x: number; y: number; size: number; opacity: number }[];
  links: Link[];
};

export function LoginParticles() {
  const { width, height } = useWindowDimensions();
  const particlesRef = useRef<Particle[]>([]);
  const [frame, setFrame] = useState<Frame>({ particles: [], links: [] });

  const count = useMemo(
    () => particleCountForViewport(width, height),
    [width, height],
  );

  useEffect(() => {
    particlesRef.current = buildParticles(count, width, height);
  }, [count, width, height]);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      // ~30fps — enough for soft drift, lighter than 60 on phones
      if (now - last >= 33) {
        last = now;
        const particles = particlesRef.current;
        if (particles.length > 0) {
          stepParticles(particles, width, height);
          const links = buildLinks(particles);
          setFrame({
            particles: particles.map((p) => {
              // twinkle.particles — occasional brighten toward opacity 1
              const twinkle = 0.5 + 0.5 * Math.sin(p.twinklePhase);
              const sparkle = twinkle > 0.92 ? 1 : p.baseOpacity + (1 - p.baseOpacity) * twinkle * 0.35;
              return {
                x: p.x,
                y: p.y,
                size: p.size,
                opacity: Math.min(1, sparkle),
              };
            }),
            links,
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width, height]);

  return (
    <View
      pointerEvents="none"
      style={styles.layer}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {frame.links.map((link, i) => (
          <Line
            key={`l-${i}`}
            x1={link.x1}
            y1={link.y1}
            x2={link.x2}
            y2={link.y2}
            stroke="#ffffff"
            strokeWidth={LINK_WIDTH}
            strokeOpacity={link.opacity}
          />
        ))}
        {frame.particles.map((p, i) => (
          <Circle
            key={`p-${i}`}
            cx={p.x}
            cy={p.y}
            r={p.size / 2}
            fill="#ffffff"
            opacity={p.opacity}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
  },
});
