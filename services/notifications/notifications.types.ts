export type NotificationBadgeGroup = "chat" | "qa" | "hrms_leave" | "hrms_attendance";

export type NotificationSoundKey = "chat" | "qa" | "hrms_leave" | "hrms_attendance";

export type NotificationDto = {
  id: string;
  type: string;
  badgeGroup: NotificationBadgeGroup;
  soundKey?: NotificationSoundKey | null;
  title: string;
  body?: string | null;
  href?: string | null;
  payload?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
};

export type BadgeCounts = {
  chat: number;
  qa: number;
  hrms_leave: number;
  hrms_attendance: number;
};

export type NotificationSocketEvent = {
  event: "new" | "read" | "read_all";
  notification?: NotificationDto;
  badgeCounts: BadgeCounts;
  /** Present on `read_all` when only one badge group was cleared. */
  badgeGroup?: NotificationBadgeGroup;
};

export type NotificationsListResponse = {
  items: NotificationDto[];
  badgeCounts?: BadgeCounts;
};
