import { useAuth } from "@/lib/auth";
import { PAGE, SMTP_EMAIL_PAGE_PERMISSIONS } from "@/lib/permissions/permission-constants";
import { OP } from "@/lib/permissions/operational-keys";

/** Page + operational checks for SMTP / reseller mail screens. */
export function useSmtpEmailAccess() {
  const { hasOperational, hasPage, isPlatformAdmin } = useAuth();

  const hasSmtpPage = SMTP_EMAIL_PAGE_PERMISSIONS.some((p) => hasPage(p));

  const canView =
    isPlatformAdmin || hasOperational(OP.smtpEmail.view) || hasSmtpPage;

  const canUpdate =
    isPlatformAdmin ||
    hasOperational(OP.smtpEmail.update) ||
    hasOperational(OP.smtpEmail.create);

  const canDelete =
    isPlatformAdmin || hasOperational(OP.smtpEmail.delete);

  const canTest =
    isPlatformAdmin || hasOperational(OP.smtpEmail.test);

  return { canView, canUpdate, canDelete, canTest, hasResellerPage: hasPage(PAGE.SMTP_EMAIL_RESELLER) };
}
