import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppCard, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type SmtpEmailWizardShellProps = {
  step: 1 | 2;
  cardTitle: string;
  children: ReactNode;
  subtitle?: string;
  footer?: ReactNode | null;
};

const STEPS = [
  { n: 1, label: "Reseller setup" },
  { n: 2, label: "SMTP configuration" },
] as const;

/** Mobile SMTP wizard layout — step indicator + card body + footer slot. */
export function SmtpEmailWizardShell({
  step,
  cardTitle,
  children,
  subtitle = "Configure your organization's outgoing email server settings.",
  footer = null,
}: SmtpEmailWizardShellProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.stepper}>
        {STEPS.map((s) => {
          const active = s.n === step;
          const done = s.n < step;
          return (
            <View key={s.n} style={styles.stepSegment}>
              <View
                style={[
                  styles.stepCircle,
                  active && styles.stepCircleActive,
                  done && styles.stepCircleDone,
                ]}
              >
                <Typography variant="small" color={active || done ? "#fff" : tokens.colors.textMuted}>
                  {done ? "✓" : String(s.n)}
                </Typography>
              </View>
              <Typography variant="small" muted={!active}>
                {s.label}
              </Typography>
            </View>
          );
        })}
      </View>

      <AppCard style={styles.card}>
        <Typography variant="boldLarge">{cardTitle}</Typography>
        <Typography variant="medium" muted style={{ marginTop: 4, marginBottom: 12 }}>
          {subtitle}
        </Typography>
        {children}
      </AppCard>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: tokens.space.md },
  stepper: { flexDirection: "row", gap: tokens.space.md },
  stepSegment: { flex: 1, alignItems: "center", gap: 6 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    backgroundColor: tokens.colors.accentBlue,
    borderColor: tokens.colors.accentBlue,
  },
  stepCircleDone: {
    backgroundColor: tokens.colors.accentGreen,
    borderColor: tokens.colors.accentGreen,
  },
  card: { gap: tokens.space.sm },
  footer: { marginTop: tokens.space.sm },
});
