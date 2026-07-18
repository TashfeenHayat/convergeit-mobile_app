import { Pressable, View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { chatLiveViewSwitch } from "../styles/chat-live.styles";

export type ChatLiveViewOption = {
  id: string;
  label: string;
};

type ChatLiveViewSwitchProps = {
  options: ChatLiveViewOption[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
};

/** Underline view switch — no card wrapper (Intercom-style). */
export function ChatLiveViewSwitch({ options, value, onChange, ariaLabel = "View" }: ChatLiveViewSwitchProps) {
  return (
    <View style={chatLiveViewSwitch.row} accessibilityRole="tablist" accessibilityLabel={ariaLabel}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.id)}
            style={[chatLiveViewSwitch.btn, active && chatLiveViewSwitch.btnActive]}
          >
            <Typography
              variant="label"
              color={active ? tokens.colors.textPrimary : tokens.colors.textMuted}
              style={{ fontWeight: active ? "600" : "500" }}
            >
              {opt.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}
