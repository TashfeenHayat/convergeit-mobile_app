export type AppBoundaryKind =
  | "session_expired"
  | "network"
  | "permission_denied"
  | "server_error"
  | "unexpected";

export type AppBoundaryAction = {
  id: string;
  label: string;
  variant?: "primary" | "secondary";
  /** Runs before the modal closes (unless `keepOpen` is set). */
  onClick?: () => void | Promise<void>;
  keepOpen?: boolean;
  loading?: boolean;
};

export type AppBoundaryPayload = {
  kind: AppBoundaryKind;
  title: string;
  description: string;
  /** Replace an open boundary of the same kind instead of stacking. Default true. */
  dedupeByKind?: boolean;
  /** When false, backdrop click / Escape do nothing. Default true for network, false for session. */
  dismissible?: boolean;
  actions?: AppBoundaryAction[];
  /** Shown for `network` / query retry flows. */
  onRetry?: () => void;
};

export type AppBoundaryState = AppBoundaryPayload & {
  requestId: string;
};
