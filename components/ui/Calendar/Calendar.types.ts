export type CalendarProps = {
  label: string;
  /** ISO date `YYYY-MM-DD` */
  value: string;
  onChange: (value: string) => void;
  name?: string;
  id?: string;
  min?: string;
  max?: string;
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
  /**
   * Optional other end of a from/to range — shown with an outline
   * (web date-picker range hint).
   */
  rangeMate?: string;
};
