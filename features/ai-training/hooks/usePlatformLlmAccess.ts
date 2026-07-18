import { useAuth } from "@/lib/auth";
import {
  canManageCopilotSetupFromArrays,
  canManagePlatformAiFromArrays,
} from "@/lib/permissions/chat-access";
import { OP } from "@/lib/permissions/operational-keys";
import { PAGE } from "@/lib/permissions/permission-constants";

/** Platform LLM keys and per-product AI manage gates. */
export function usePlatformLlmAccess() {
  const { hasOperational, hasPage, isPlatformAdmin, pagePermissions, operationalPermissions } =
    useAuth();

  const perms = {
    page: pagePermissions,
    operational: operationalPermissions,
    isPlatformAdmin,
  };

  const canManagePlatform =
    isPlatformAdmin || canManagePlatformAiFromArrays(perms);

  const canManageCopilot =
    isPlatformAdmin || canManageCopilotSetupFromArrays(perms);

  const canManageChatbot =
    isPlatformAdmin ||
    (hasPage(PAGE.AI_CHATBOT) && hasOperational(OP.aiChatbot.trainingManage));

  const canManage =
    canManagePlatform ||
    canManageCopilot ||
    canManageChatbot ||
    hasOperational(OP.aiAssistant.trainingManage);

  const canView =
    canManage ||
    hasOperational(OP.aiPlatform.manage) ||
    hasOperational(OP.aiCopilot.setupView) ||
    hasOperational(OP.aiAssistant.trainingView) ||
    hasOperational(OP.aiChatbot.trainingView);

  return { canView, canManage, canManagePlatform, canManageCopilot, canManageChatbot };
}
