import type { RuntimeChatAppearance } from "./widget-runtime-appearance";

export type WidgetSoundId = "soft" | "chime" | "ping" | "bell" | "pop" | "ding" | "none";

export type WidgetLauncherBadgeMode = "count" | "dot" | "none";

export const WIDGET_NOTIFICATION_SOUND_OPTIONS: {
  id: Exclude<WidgetSoundId, "none">;
  label: string;
  description: string;
}[] = [
  { id: "chime", label: "Chime", description: "Bright mid tone" },
  { id: "soft", label: "Soft", description: "Gentle low tone" },
  { id: "ping", label: "Ping", description: "Quick high ping" },
  { id: "bell", label: "Bell", description: "Two-note doorbell" },
  { id: "pop", label: "Pop", description: "Short punchy pop" },
  { id: "ding", label: "Ding", description: "Clear high ding" },
];

type ToneStep = { frequency: number; durationMs: number; gain: number; delayMs?: number };

const SOUND_PROFILES: Record<
  Exclude<WidgetSoundId, "none" | "bell">,
  { frequency: number; durationMs: number; gain: number }
> = {
  soft: { frequency: 520, durationMs: 180, gain: 0.42 },
  chime: { frequency: 880, durationMs: 165, gain: 0.5 },
  ping: { frequency: 1240, durationMs: 130, gain: 0.48 },
  pop: { frequency: 420, durationMs: 90, gain: 0.55 },
  ding: { frequency: 1318, durationMs: 240, gain: 0.46 },
};

const SOUND_SEQUENCES: Partial<Record<WidgetSoundId, ToneStep[]>> = {
  bell: [
    { frequency: 523, durationMs: 150, gain: 0.46 },
    { frequency: 784, durationMs: 200, gain: 0.44, delayMs: 95 },
  ],
};

let sharedAudioContext: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new Ctx();
  }
  return sharedAudioContext;
}

/** Call on first user gesture (launcher click) so autoplay policies allow beeps. */
export function unlockWidgetAudio(): void {
  const ctx = getSharedAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }
  try {
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    source.stop(0);
  } catch {
    /* ignore */
  }
}

export function normalizeWidgetSoundId(raw: unknown): WidgetSoundId {
  const id = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (
    id === "soft" ||
    id === "chime" ||
    id === "ping" ||
    id === "bell" ||
    id === "pop" ||
    id === "ding" ||
    id === "none"
  ) {
    return id;
  }
  return "chime";
}

function playToneStep(ctx: AudioContext, step: ToneStep, startOffsetMs = 0): void {
  const t0 = ctx.currentTime + startOffsetMs / 1000;
  const durationSec = step.durationMs / 1000;
  const peak = Math.min(0.72, step.gain);
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = step.frequency >= 1000 ? "sine" : "triangle";
  o.connect(g);
  g.connect(ctx.destination);
  o.frequency.value = step.frequency;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + durationSec);
  o.start(t0);
  o.stop(t0 + durationSec + 0.05);
}

export function normalizeLauncherBadgeMode(raw: unknown): WidgetLauncherBadgeMode {
  const id = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (id === "count" || id === "dot" || id === "none") return id;
  return "count";
}

export function resolveSoundIdFromAppearance(
  appearance: Pick<
    RuntimeChatAppearance,
    "soundNotification" | "notificationSoundId"
  >,
): WidgetSoundId {
  if (!appearance.soundNotification) return "none";
  const id = appearance.notificationSoundId;
  if (id && id !== "none") return id;
  return "chime";
}

/** Short browser beep (no asset files). */
export function playWidgetSound(soundId: WidgetSoundId): void {
  if (soundId === "none" || typeof window === "undefined") return;
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    const run = () => {
      const sequence = SOUND_SEQUENCES[soundId];
      if (sequence?.length) {
        let offset = 0;
        for (const step of sequence) {
          const delay = step.delayMs ?? 0;
          offset += delay;
          playToneStep(ctx, step, offset);
          offset += step.durationMs;
        }
        return;
      }
      const profile = SOUND_PROFILES[soundId as Exclude<WidgetSoundId, "none" | "bell">];
      if (!profile) return;
      playToneStep(ctx, profile);
    };
    if (ctx.state === "suspended") {
      void ctx.resume().then(run).catch(() => undefined);
      return;
    }
    run();
  } catch {
    /* ignore */
  }
}

export function truncateNotificationPreview(text: string, max = 72): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** ~Half of the last message for the closed-widget invitation preview bubble. */
export function truncateClosedMessagePreviewHalf(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= 28) return t;
  const target = Math.max(28, Math.ceil(t.length / 2));
  if (t.length <= target) return t;
  const slice = t.slice(0, target);
  const lastSpace = slice.lastIndexOf(" ");
  const cut =
    lastSpace > target * 0.5 ? slice.slice(0, lastSpace) : slice.trimEnd();
  return `${cut.trim()}…`;
}

export function resolveNotificationTitle(
  appearance: Pick<RuntimeChatAppearance, "fallbackNotificationText">,
  preview: string,
): string {
  const fallback = appearance.fallbackNotificationText.trim();
  if (preview) return preview;
  return fallback || "New message";
}

export function shouldPlayWidgetIncomingSound(options?: {
  panelOpen?: boolean;
  tabHidden?: boolean;
}): boolean {
  const panelOpen = options?.panelOpen === true;
  const tabHidden = options?.tabHidden === true;
  return !panelOpen || tabHidden;
}

export function notifyWidgetIncoming(
  appearance: RuntimeChatAppearance,
  preview: string,
  options?: { launcherOpen?: boolean; playSound?: boolean },
): void {
  const title = resolveNotificationTitle(appearance, truncateNotificationPreview(preview));
  const launcherOpen = options?.launcherOpen === true;
  const playSound =
    options?.playSound ??
    shouldPlayWidgetIncomingSound({
      panelOpen: launcherOpen,
      tabHidden: typeof document !== "undefined" && document.hidden,
    });

  if (playSound) {
    unlockWidgetAudio();
    playWidgetSound(resolveSoundIdFromAppearance(appearance));
  }

  if (
    launcherOpen ||
    !appearance.notificationEnabled ||
    typeof window === "undefined" ||
    !window.Notification ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  try {
    new Notification(title, {
      tag: `converge-widget-${appearance.launcher.buttonLabel}`,
    });
  } catch {
    /* ignore */
  }
}

export function requestWidgetNotificationPermission(): void {
  if (typeof window === "undefined" || !window.Notification) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission().catch(() => undefined);
  }
}
