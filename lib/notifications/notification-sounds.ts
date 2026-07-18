import type { NotificationSoundKey } from "@/services/notifications/notifications.types";

const CHAT_TYPES = new Set([
  "chat.new_assignment",
  "chat.queue_waiting",
  "chat.takeover_requested",
  "chat.transferred_to_pool_head",
]);

const QA_TYPES = new Set(["qa.review_assigned"]);

const HRMS_TYPES = new Set([
  "hrms.leave.pending_approval",
  "hrms.leave.forwarded",
  "hrms.leave.decided",
]);

const HRMS_ATTENDANCE_TYPES = new Set([
  "hrms.attendance.member_on_break",
  "hrms.attendance.over_break",
]);

const SOUND_SRC: Record<NotificationSoundKey, string> = {
  chat: "/sounds/notifications/chat.wav",
  qa: "/sounds/notifications/qa.wav",
  hrms_leave: "/sounds/notifications/leave.wav",
  hrms_attendance: "/sounds/notifications/leave.wav",
};

const audioCache = new Map<NotificationSoundKey, HTMLAudioElement>();
let audioUnlocked = false;

function unlockAudioOnce(): void {
  if (audioUnlocked || typeof window === "undefined") return;
  audioUnlocked = true;
  for (const key of Object.keys(SOUND_SRC) as NotificationSoundKey[]) {
    const audio = getNotificationAudio(key);
    audio.volume = 0.45;
    void audio.play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
      })
      .catch(() => {
        /* Autoplay policy — real plays happen after user gesture. */
      });
  }
}

function getNotificationAudio(soundKey: NotificationSoundKey): HTMLAudioElement {
  let audio = audioCache.get(soundKey);
  if (!audio) {
    audio = new Audio(SOUND_SRC[soundKey]);
    audio.preload = "auto";
    audioCache.set(soundKey, audio);
  }
  return audio;
}

function beep(frequency: number, durationMs: number, volume = 0.12): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
    void ctx.close();
  } catch {
    /* Web Audio unavailable */
  }
}

function playBeepFallback(soundKey: NotificationSoundKey): void {
  if (soundKey === "chat") {
    beep(880, 120);
    window.setTimeout(() => beep(660, 100), 140);
    return;
  }
  if (soundKey === "qa") {
    beep(520, 160);
    return;
  }
  beep(400, 180);
}

export function soundKeyForNotificationType(type: string): NotificationSoundKey | null {
  if (CHAT_TYPES.has(type)) return "chat";
  if (QA_TYPES.has(type)) return "qa";
  if (HRMS_TYPES.has(type)) return "hrms_leave";
  if (HRMS_ATTENDANCE_TYPES.has(type)) return "hrms_attendance";
  return null;
}

export function playNotificationSound(soundKey: NotificationSoundKey): void {
  if (typeof window === "undefined") return;
  unlockAudioOnce();
  const audio = getNotificationAudio(soundKey);
  audio.volume = 0.55;
  audio.currentTime = 0;
  void audio.play().catch(() => playBeepFallback(soundKey));
}

export function playSoundForNotificationType(type: string): void {
  const key = soundKeyForNotificationType(type);
  if (key) playNotificationSound(key);
}

if (
  typeof window !== 'undefined' &&
  typeof window.addEventListener === 'function'
) {
  window.addEventListener('pointerdown', unlockAudioOnce, { once: true });
}

