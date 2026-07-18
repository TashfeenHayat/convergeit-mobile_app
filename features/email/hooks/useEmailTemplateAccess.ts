import { useAuth } from "@/lib/auth";
import { EMAIL_TEMPLATE_PAGE_PERMISSIONS } from "@/lib/permissions/permission-constants";
import { OP } from "@/lib/permissions/operational-keys";

/** Page + operational checks for email template / design / forms screens. */
export function useEmailTemplateAccess() {
  const { hasOperational, hasPage, isPlatformAdmin } = useAuth();

  const hasTemplatePage = EMAIL_TEMPLATE_PAGE_PERMISSIONS.some((p) => hasPage(p));

  const canView =
    isPlatformAdmin || hasOperational(OP.emailTemplate.view) || hasTemplatePage;

  const canUpdate =
    isPlatformAdmin || hasOperational(OP.emailTemplate.update);

  const canPublish =
    isPlatformAdmin || hasOperational(OP.emailTemplate.publish);

  return { canView, canUpdate, canPublish };
}
