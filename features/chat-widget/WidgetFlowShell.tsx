import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { AppCard, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { ChatLivePageHeader, ChatLivePageShell } from "@/features/chat-shared";
import { WidgetWizardStepper } from "./components/WidgetWizardStepper";

export interface WidgetFlowShellProps {
  pageTitle: string;
  subtitle: string;
  cardTitle: string;
  children: ReactNode;
  footer?: ReactNode | null;
  currentStep?: number;
}

export function WidgetFlowShell({
  pageTitle,
  subtitle,
  cardTitle,
  children,
  footer,
  currentStep = 0,
}: WidgetFlowShellProps) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <ChatLivePageShell>
        <ChatLivePageHeader title={pageTitle} subtitle={subtitle} navPreset="configure" />
        <WidgetWizardStepper currentStep={currentStep} />
        <AppCard style={styles.card}>
          <Typography variant="mediumLarge" style={{ fontWeight: "700" }}>
            {cardTitle}
          </Typography>
          <View style={styles.body}>{children}</View>
          {footer ?? (
            <Typography variant="small" muted>
              Full widget wizard editing is simplified on mobile — use web for advanced layout preview.
            </Typography>
          )}
        </AppCard>
      </ChatLivePageShell>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { gap: tokens.space.md },
  body: { gap: tokens.space.sm },
});
