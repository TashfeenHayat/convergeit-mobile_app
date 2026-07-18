import { View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

const STEPS = ["Button", "Box", "Notifications", "Install"];

export function WidgetWizardStepper({ currentStep = 0 }: { currentStep?: number }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: tokens.space.md, marginBottom: tokens.space.sm }}>
      {STEPS.map((label, index) => {
        const active = index === currentStep;
        const done = index < currentStep;
        return (
          <View
            key={label}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: active ? tokens.colors.accentBlue : tokens.colors.border,
              backgroundColor: done ? "rgba(88,101,242,0.12)" : tokens.colors.pillBg,
            }}
          >
            <Typography variant="small" style={{ fontWeight: active ? "700" : "500" }}>
              {index + 1}. {label}
            </Typography>
          </View>
        );
      })}
    </View>
  );
}
