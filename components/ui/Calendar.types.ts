
export interface CalendarProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  name?: string;
  id?: string;
  min?: string;
  max?: string;
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
  sx?: SxProps<Theme>;
}
