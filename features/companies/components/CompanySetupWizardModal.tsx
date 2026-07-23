import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { FormModal, InputField, PhoneInputField, SegmentedControl, SelectField, Typography, Button } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { sessionMayPickInternalUserScope, useAuth, type SessionScopeUser } from "@/lib/auth";
import {
  extractParentCompaniesFromByResellerTree,
  pickItemsArray,
  toIdNameOption,
} from "@/lib/companies/scope-tree-options";
import {
  buildChildrenDraftPatchBody,
  buildResellerParentDraftSaveBody,
  emptyDraftChildRow,
  emptyPocSlice,
  extractCompanySetupDraftId,
  readWizardHydrationFromDraft,
} from "@/lib/companies/setup-draft.utils";
import { parseCompanySetupSubmitResult } from "@/lib/companies/parse-company-setup-submit";
import type { CompanySetupSubmitResult } from "@/lib/companies/parse-company-setup-submit";
import {
  useCompaniesByResellerQuery,
  useCompaniesSetupResellersQuery,
  useCompanySetupDraftByIdQuery,
  useCreateCompanySetupDraftMutation,
  useSubmitCompanySetupDraftMutation,
  useUpdateCompanySetupDraftMutation,
} from "@/lib/hooks/query/companies";
import { useRolesListQuery } from "@/lib/hooks/query/roles";
import { getEmailValidationError, getRequiredError } from "@/lib/ui/form-validation";
import { formatPhoneInputValue, getPhoneValidationError } from "@/lib/ui/format-phone-input";
import { pickApiItems } from "@/lib/utils/admin-list";
import { isRecord, pickStr } from "@/lib/utils/core";

export type CompanySetupWizardCloseReason = "completed" | "dismissed";

export type CompanySetupWizardModalProps = {
  open: boolean;
  onClose: (reason: CompanySetupWizardCloseReason) => void;
  /** Resume an existing in-progress setup draft. */
  draftId?: string | null;
  embedded?: boolean;
  /** When embedded in New contract, parent page owns the stepper. */
  hideInternalStepper?: boolean;
  onContractOrgComplete?: (result: CompanySetupSubmitResult) => void;
  onWizardStepChange?: (step: 1 | 2) => void;
};

type SetupKind = "new_reseller" | "existing_reseller";

export function CompanySetupWizardModal({
  open,
  onClose,
  draftId: resumeDraftId = null,
  embedded = false,
  hideInternalStepper = false,
  onContractOrgComplete,
  onWizardStepChange,
}: CompanySetupWizardModalProps) {
  const { isPlatformAdmin, user: authUser } = useAuth();
  const mayCreateNewReseller = sessionMayPickInternalUserScope(isPlatformAdmin, authUser as SessionScopeUser | null);
  const hydratedDraftRef = useRef<string | null>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [setupKind, setSetupKind] = useState<SetupKind>("new_reseller");
  const [resellerId, setResellerId] = useState("");
  const [parentCompanyName, setParentCompanyName] = useState("");
  const [childName, setChildName] = useState("");
  const [childEmail, setChildEmail] = useState("");
  const [childPhone, setChildPhone] = useState("");
  const [childAddress, setChildAddress] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [pocFirstName, setPocFirstName] = useState("");
  const [pocEmail, setPocEmail] = useState("");
  const [pocRoleId, setPocRoleId] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const createDraftMutation = useCreateCompanySetupDraftMutation();
  const updateDraftMutation = useUpdateCompanySetupDraftMutation({ skipGlobalToast: true });
  const submitDraftMutation = useSubmitCompanySetupDraftMutation();
  const resumeId = resumeDraftId?.trim() || "";
  const draftQuery = useCompanySetupDraftByIdQuery(resumeId || null, {
    enabled: open && resumeId.length > 0,
  });
  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: open && setupKind === "existing_reseller",
  });
  const companiesQuery = useCompaniesByResellerQuery(
    resellerId,
    { view: "tree", sortBy: "name", sortOrder: "asc", all: true },
    { enabled: open && setupKind === "existing_reseller" && Boolean(resellerId.trim()) },
  );
  const rolesQuery = useRolesListQuery({ page: 1, limit: 100 }, { enabled: open });

  const resellerOptions = useMemo(
    () =>
      pickItemsArray(resellersQuery.data)
        .map((row) => toIdNameOption(row))
        .filter((x): x is { label: string; value: string } => x !== null),
    [resellersQuery.data],
  );

  const parentOptions = useMemo(
    () => extractParentCompaniesFromByResellerTree(companiesQuery.data),
    [companiesQuery.data],
  );

  const roleOptions = useMemo(
    () =>
      pickApiItems(rolesQuery.data)
        .filter(isRecord)
        .map((r) => {
          const id = pickStr(r, ["id"]);
          return id ? { label: pickStr(r, ["name"]) || id, value: id } : null;
        })
        .filter((x): x is { label: string; value: string } => x !== null),
    [rolesQuery.data],
  );

  useEffect(() => {
    if (!open) {
      hydratedDraftRef.current = null;
      return;
    }
    hydratedDraftRef.current = null;
    setStep(1);
    setDraftId(resumeId || null);
    setSetupKind(mayCreateNewReseller ? "new_reseller" : "existing_reseller");
    setResellerId("");
    setParentCompanyName("");
    setChildName("");
    setChildEmail("");
    setChildPhone("");
    setChildAddress("");
    setWebsiteUrl("");
    setPocFirstName("");
    setPocEmail("");
    setPocRoleId("");
    setShowErrors(false);
  }, [open, mayCreateNewReseller, resumeId]);

  useEffect(() => {
    if (!open || pocRoleId.trim() || !roleOptions[0]?.value) return;
    if (hydratedDraftRef.current) return;
    setPocRoleId(roleOptions[0].value);
  }, [open, pocRoleId, roleOptions]);

  useEffect(() => {
    if (!open || !resumeId || !draftQuery.data) return;
    if (hydratedDraftRef.current === resumeId) return;
    const parsed = readWizardHydrationFromDraft(draftQuery.data);
    if (!parsed) return;
    hydratedDraftRef.current = resumeId;
    setDraftId(resumeId);
    setSetupKind(parsed.setupKind);
    setResellerId(parsed.resellerId);
    setParentCompanyName(parsed.parentCompanyName);
    setStep(parsed.modalStep);
    const child = parsed.draftChildRows[0];
    if (child) {
      setChildName(child.name);
      setChildEmail(child.email);
      setChildPhone(formatPhoneInputValue(child.phone));
      setChildAddress(child.address);
      setWebsiteUrl(child.websiteUrls.find((u) => u.trim()) || "");
      const matchedPoc = child.pocRows.find(
        (p) => Boolean(p.pocFirstName.trim()) || Boolean(p.pocEmail.trim()),
      );
      const poc = matchedPoc || child.pocRows[0];
      if (poc) {
        setPocFirstName(poc.pocFirstName);
        setPocEmail(poc.pocEmail);
        setPocRoleId(poc.roleId.trim() || roleOptions[0]?.value || "");
      }
    }
  }, [open, resumeId, draftQuery.data, roleOptions]);

  useEffect(() => {
    onWizardStepChange?.(step);
  }, [step, onWizardStepChange]);

  const ensureDraft = async (): Promise<string> => {
    if (draftId) return draftId;
    const res = await createDraftMutation.mutateAsync({});
    const id = extractCompanySetupDraftId(res);
    if (!id) throw new Error("Could not create setup draft.");
    setDraftId(id);
    return id;
  };

  const saveDraftOnly = async () => {
    try {
      if (step === 1) {
        if (!parentCompanyName.trim()) {
          Alert.alert("Validation", "Parent company name is required to save draft.");
          return;
        }
        if (setupKind === "existing_reseller" && !resellerId.trim()) {
          Alert.alert("Validation", "Select a reseller to save draft.");
          return;
        }
        const id = await ensureDraft();
        const body =
          setupKind === "new_reseller"
            ? buildResellerParentDraftSaveBody({
                kind: "new_reseller",
                parent: { name: parentCompanyName.trim() },
              })
            : buildResellerParentDraftSaveBody({
                kind: "existing_reseller",
                resellerId,
                parent: { name: parentCompanyName.trim() },
              });
        await updateDraftMutation.mutateAsync({ id, body });
      } else {
        const child = emptyDraftChildRow();
        child.name = childName.trim();
        child.email = childEmail.trim();
        child.phone = childPhone.trim() ? formatPhoneInputValue(childPhone) : "";
        child.address = childAddress.trim();
        child.websiteUrls = websiteUrl.trim() ? [websiteUrl.trim()] : [];
        const poc = emptyPocSlice();
        poc.pocFirstName = pocFirstName.trim();
        poc.pocEmail = pocEmail.trim();
        poc.roleId = pocRoleId.trim();
        poc.pocDepartmentMode = "new";
        poc.pocDepartmentName = "General";
        poc.pocDesignationMode = "new";
        poc.pocDesignationTitle = "Admin";
        child.pocRows = [poc];
        const id = await ensureDraft();
        await updateDraftMutation.mutateAsync({ id, body: buildChildrenDraftPatchBody([child]) });
      }
      Alert.alert("Draft saved", "You can resume this setup from Drafts anytime.");
      onClose("dismissed");
    } catch (err) {
      Alert.alert("Save failed", extractApiErrorMessage(err));
    }
  };

  const saveStep1 = async () => {
    if (!parentCompanyName.trim()) {
      Alert.alert("Validation", "Parent company name is required.");
      return false;
    }
    if (setupKind === "existing_reseller" && !resellerId.trim()) {
      Alert.alert("Validation", "Select a reseller.");
      return false;
    }
    try {
      const id = await ensureDraft();
      const body =
        setupKind === "new_reseller"
          ? buildResellerParentDraftSaveBody({
              kind: "new_reseller",
              parent: { name: parentCompanyName.trim() },
            })
          : buildResellerParentDraftSaveBody({
              kind: "existing_reseller",
              resellerId,
              parent: { name: parentCompanyName.trim() },
            });
      await updateDraftMutation.mutateAsync({ id, body });
      setStep(2);
      return true;
    } catch (err) {
      Alert.alert("Save failed", extractApiErrorMessage(err));
      return false;
    }
  };

  const submitWizard = async () => {
    setShowErrors(true);
    const nameErr = getRequiredError(childName, "Child company name");
    const emailErr = getEmailValidationError(childEmail, { required: true, label: "Email" });
    const phoneErr = getPhoneValidationError(childPhone, { required: true });
    const addressErr = getRequiredError(childAddress, "Address");
    const pocNameErr = getRequiredError(pocFirstName, "POC first name");
    const pocEmailErr = getEmailValidationError(pocEmail, { required: true, label: "POC email" });
    const firstError =
      nameErr || emailErr || phoneErr || addressErr || pocNameErr || pocEmailErr || (!pocRoleId.trim() ? "Select a POC role." : null);
    if (firstError) {
      Alert.alert("Validation", firstError);
      return;
    }

    const child = emptyDraftChildRow();
    child.name = childName.trim();
    child.email = childEmail.trim();
    child.phone = formatPhoneInputValue(childPhone);
    child.address = childAddress.trim();
    child.websiteUrls = websiteUrl.trim() ? [websiteUrl.trim()] : [];
    const poc = emptyPocSlice();
    poc.pocFirstName = pocFirstName.trim();
    poc.pocEmail = pocEmail.trim();
    poc.roleId = pocRoleId.trim();
    poc.pocDepartmentMode = "new";
    poc.pocDepartmentName = "General";
    poc.pocDesignationMode = "new";
    poc.pocDesignationTitle = "Admin";
    child.pocRows = [poc];

    try {
      const id = await ensureDraft();
      await updateDraftMutation.mutateAsync({ id, body: buildChildrenDraftPatchBody([child]) });
      const submitRes = await submitDraftMutation.mutateAsync(id);
      const parsed = parseCompanySetupSubmitResult(submitRes);
      if (!parsed) {
        Alert.alert("Submitted", "Company setup submitted.");
        onClose("completed");
        return;
      }
      if (onContractOrgComplete) {
        onContractOrgComplete(parsed);
      } else {
        Alert.alert("Success", `Created ${parsed.parentCompanyName}.`);
        onClose("completed");
      }
    } catch (err) {
      Alert.alert("Submit failed", extractApiErrorMessage(err));
    }
  };

  const saving =
    createDraftMutation.isPending || updateDraftMutation.isPending || submitDraftMutation.isPending;

  const content = (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
      {!hideInternalStepper ? (
        <Typography variant="small" muted>
          Step {step} of 2 — {step === 1 ? "Reseller / parent" : "Child company"}
        </Typography>
      ) : null}

      {step === 1 ? (
        <>
          {mayCreateNewReseller ? (
            <SegmentedControl
              value={setupKind}
              onChange={(v) => setSetupKind(v as SetupKind)}
              options={[
                { value: "new_reseller", label: "New reseller" },
                { value: "existing_reseller", label: "Existing reseller" },
              ]}
 />
          ) : null}
          {setupKind === "existing_reseller" ? (
            <SelectField
              label="Reseller"
              value={resellerId}
              onChange={setResellerId}
              options={
                resellerOptions.length
                  ? resellerOptions
                  : [{ value: "", label: resellersQuery.isLoading ? "Loading…" : "No resellers" }]
              }
 />
          ) : null}
          <InputField
            label="Parent company name"
            value={parentCompanyName}
            onChangeText={setParentCompanyName}
            placeholder="Agency or client parent"
 />
        </>
      ) : (
        <>
          <InputField
            label="Child company name"
            value={childName}
            onChangeText={setChildName}
            error={showErrors && Boolean(getRequiredError(childName, "Child company name"))}
            helperText={showErrors ? getRequiredError(childName, "Child company name") ?? undefined : undefined}
 />
          <InputField
            label="Email"
            value={childEmail}
            onChangeText={setChildEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            error={showErrors && Boolean(getEmailValidationError(childEmail, { required: true }))}
            helperText={
              showErrors
                ? getEmailValidationError(childEmail, { required: true }) ?? undefined
                : undefined
            }
 />
          <PhoneInputField
            label="Phone"
            value={childPhone}
            onChangeText={setChildPhone}
            required
            error={showErrors && Boolean(getPhoneValidationError(childPhone, { required: true }))}
 />
          <InputField
            label="Address"
            value={childAddress}
            onChangeText={setChildAddress}
            error={showErrors && Boolean(getRequiredError(childAddress, "Address"))}
            helperText={showErrors ? getRequiredError(childAddress, "Address") ?? undefined : undefined}
 />
          <InputField label="Website URL" value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" />
          <Typography variant="medium16" style={{ fontWeight: "600", marginTop: 8 }}>
            Point of contact
          </Typography>
          <InputField
            label="POC first name"
            value={pocFirstName}
            onChangeText={setPocFirstName}
            error={showErrors && Boolean(getRequiredError(pocFirstName, "POC first name"))}
            helperText={showErrors ? getRequiredError(pocFirstName, "POC first name") ?? undefined : undefined}
 />
          <InputField
            label="POC email"
            value={pocEmail}
            onChangeText={setPocEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            error={showErrors && Boolean(getEmailValidationError(pocEmail, { required: true, label: "POC email" }))}
            helperText={
              showErrors
                ? getEmailValidationError(pocEmail, { required: true, label: "POC email" }) ?? undefined
                : undefined
            }
 />
          <SelectField
            label="POC role"
            value={pocRoleId}
            onChange={setPocRoleId}
            options={roleOptions.length ? roleOptions : [{ value: "", label: "Loading roles…" }]}
            error={showErrors && !pocRoleId.trim()}
            helperText={showErrors && !pocRoleId.trim() ? "Select a POC role." : undefined}
 />
        </>
      )}
    </ScrollView>
  );

  if (embedded) {
    return (
      <View style={{ gap: 12 }}>
        {resumeId && draftQuery.isLoading ? (
          <Typography variant="small" muted>
            Loading draft…
          </Typography>
        ) : null}
        {content}
        <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            onPress={() => void saveDraftOnly()}
            disabled={saving}
            style={{ flexGrow: 1 }}
          >
            Save draft
          </Button>
          {step === 2 ? (
            <Button variant="outlined" onPress={() => setStep(1)} style={{ flexGrow: 1 }}>
              Back
            </Button>
          ) : null}
          <Button
            loading={saving}
            disabled={saving}
            style={{ flexGrow: 1 }}
            onPress={() => {
              if (step === 1) void saveStep1();
              else void submitWizard();
            }}
          >
            {step === 1 ? "Continue to child" : "Create organization"}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <FormModal
      open={open}
      title={resumeId ? "Resume company setup" : "Company setup"}
      description="Create reseller, parent company, child company, and POC invite. Save draft anytime to continue later."
      onClose={() => onClose("dismissed")}
      onSave={() => {
        if (step === 1) void saveStep1();
        else void submitWizard();
      }}
      primaryButtonLabel={step === 1 ? "Continue" : "Submit setup"}
      primaryButtonDisabled={saving || Boolean(resumeId && draftQuery.isLoading)}
    >
      {resumeId && draftQuery.isLoading ? (
        <Typography variant="small" muted style={{ marginBottom: 8 }}>
          Loading draft…
        </Typography>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        {step === 2 ? (
          <Button variant="outlined" onPress={() => setStep(1)} style={{ flexGrow: 1 }}>
            Back to step 1
          </Button>
        ) : null}
        <Button
          variant="outlined"
          onPress={() => void saveDraftOnly()}
          disabled={saving}
          style={{ flexGrow: 1 }}
        >
          Save draft
        </Button>
      </View>
      {content}
    </FormModal>
  );
}
