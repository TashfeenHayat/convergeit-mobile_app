import type { CSSProperties } from "react";

/** Inline styles for root error boundaries (no MUI theme — layout may be unavailable). */

export const segmentErrorContainerStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  padding: 24,
  fontFamily: "system-ui, sans-serif",
  color: "#e2e8f0",
  background: "linear-gradient(180deg, #050508 0%, #0a0a2c 100%)",
};

export const globalErrorBodyStyle: CSSProperties = {
  margin: 0,
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  padding: 24,
  fontFamily: "system-ui, sans-serif",
  color: "#e2e8f0",
  background: "#0a0a2c",
};

export const errorHeadingStyle: CSSProperties = {
  fontSize: "1.125rem",
  fontWeight: 600,
  margin: 0,
};

export const errorMessageStyle: CSSProperties = {
  margin: 0,
  opacity: 0.85,
  textAlign: "center",
  maxWidth: 420,
};

export const errorButtonStyle: CSSProperties = {
  cursor: "pointer",
  padding: "10px 20px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontWeight: 600,
};
