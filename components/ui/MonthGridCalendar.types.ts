import type { ReactNode } from "react";

export type MonthGridCalendarCell = {
  iso: string; // YYYY-MM-DD
  day: number;
  inMonth: boolean;
};

export type MonthGridCalendarEvent = {
  id: string;
  label: string;
  fromIso: string;
  toIso: string;
  /** Optional tooltip/title text. */
  title?: string;
  /**
   * When set with `shiftTimeZone`, cells in range use this mask to show weekly off days
   * (label becomes a muted "Off" chip instead of `label`).
   */
  effectiveWorkingDaysMask?: number;
  shiftTimeZone?: string;
};

export type MonthGridCalendarProps = {
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  cells: MonthGridCalendarCell[];
  todayIso: string;
  events: MonthGridCalendarEvent[];
  onPickDate: (iso: string) => void;
  renderEmpty?: () => ReactNode;
};

