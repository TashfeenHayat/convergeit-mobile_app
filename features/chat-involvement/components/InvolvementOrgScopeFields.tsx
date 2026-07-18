import { View } from "react-native";
import { ScopeSelectField } from "@/features/chat-shared";
import { tokens } from "@/theme/tokens";
import type { InvolvementModalScope } from "../hooks/useInvolvementModalScope";

interface InvolvementOrgScopeFieldsProps {
  scope: InvolvementModalScope;
  canEdit: boolean;
  disabled?: boolean;
}

/** Website picker for the Add-users modal. Mobile flattens the web's
 * reseller → parent → child cascade to a single website field (see
 * `useInvolvementModalScope`). */
export function InvolvementOrgScopeFields({ scope, canEdit, disabled = false }: InvolvementOrgScopeFieldsProps) {
  return (
    <View style={{ gap: tokens.space.md }}>
      <ScopeSelectField
        label="Website"
        value={scope.websiteId}
        onChange={scope.setWebsiteId}
        options={scope.websiteOptions}
        disabled={!canEdit || disabled}
        searchPlaceholder="Search website…"
      />
    </View>
  );
}
