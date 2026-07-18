import { useQueryClient } from "@tanstack/react-query";

import { ResellerModulesPanel } from "@/features/companies/components/ResellerModulesPanel";
import { servicesAccessKeys } from "@/lib/hooks/query/companies/services-access";
import { ServicesDialogShell } from "./ServicesDialogShell";

type Props = {
  open: boolean;
  resellerId: string;
  resellerName?: string;
  canEdit: boolean;
  onClose: () => void;
};

export function ResellerModulesEditModal({
  open,
  resellerId,
  resellerName,
  canEdit,
  onClose,
}: Props) {
  const qc = useQueryClient();

  const handleSaved = () => {
    void qc.invalidateQueries({ queryKey: servicesAccessKeys.all });
  };

  return (
    <ServicesDialogShell
      open={open}
      onClose={onClose}
      title={resellerName ? `Edit modules — ${resellerName}` : "Edit reseller modules"}
    >
      {resellerId ? (
        <ResellerModulesPanel
          resellerId={resellerId}
          resellerName={resellerName}
          embedded
          readOnly={!canEdit}
          promptOfferingType
          onSaved={handleSaved}
        />
      ) : null}
    </ServicesDialogShell>
  );
}
