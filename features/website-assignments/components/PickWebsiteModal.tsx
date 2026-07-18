import { useEffect, useState } from "react";

import { FormModal } from "@/components/ui";
import { isPickWebsiteComplete, PickWebsiteFields } from "./PickWebsiteFields";

export type PickWebsitePreset = {
  websiteId: string;
  parentCompanyId: string;
  childCompanyId?: string;
  resellerId?: string;
};

const EMPTY_PRESET: PickWebsitePreset = {
  websiteId: "",
  parentCompanyId: "",
  childCompanyId: "",
  resellerId: "",
};

export function PickWebsiteModal({
  open,
  title,
  description,
  primaryLabel,
  onClose,
  onContinue,
  preset,
}: {
  open: boolean;
  title: string;
  description: string;
  primaryLabel: string;
  onClose: () => void;
  onContinue: (picked: PickWebsitePreset) => void;
  preset?: PickWebsitePreset | null;
}) {
  const [value, setValue] = useState<PickWebsitePreset>(EMPTY_PRESET);

  useEffect(() => {
    if (!open) {
      setValue(EMPTY_PRESET);
      return;
    }
    if (preset?.websiteId) {
      setValue({
        websiteId: preset.websiteId,
        parentCompanyId: preset.parentCompanyId,
        childCompanyId: preset.childCompanyId ?? "",
        resellerId: preset.resellerId ?? "",
      });
    } else {
      setValue(EMPTY_PRESET);
    }
  }, [open, preset]);

  const canContinue = isPickWebsiteComplete(value);

  return (
    <FormModal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      onSave={() => {
        if (!canContinue) return;
        onContinue({
          websiteId: value.websiteId.trim(),
          parentCompanyId: value.parentCompanyId.trim(),
          childCompanyId: value.childCompanyId?.trim() || undefined,
          resellerId: value.resellerId?.trim() || undefined,
        });
      }}
      primaryButtonLabel={primaryLabel}
      primaryButtonDisabled={!canContinue}
    >
      <PickWebsiteFields value={value} onChange={setValue} />
    </FormModal>
  );
}
