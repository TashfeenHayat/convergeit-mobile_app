import { useCallback, useRef, useState, type ComponentProps } from 'react';
import { Alert, Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  DashboardCard,
  InputField,
  StatusChip,
  Typography,
} from '@/components/ui';
import { BillingRateFieldsForm } from '@/features/billing/components/BillingRateFieldsForm';
import { CompanySetupWizardModal } from '@/features/companies/components/CompanySetupWizardModal';
import {
  ResellerModulesPanel,
  type ResellerModulesPanelHandle,
} from '@/features/companies/components/ResellerModulesPanel';
import { contractWizardStyles as styles } from '@/features/contract/contract-wizard.styles';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import {
  defaultBillingRateFields,
  type BillingRateFieldsValues,
} from '@/lib/billing/billing-rate-fields';
import type { CompanySetupSubmitResult } from '@/lib/companies/parse-company-setup-submit';
import { usePutAgencyBillingContractMutation } from '@/lib/hooks/query/billing/billing';
import { canCompaniesModuleAction } from '@/lib/permissions';
import { useAppTheme } from '@/theme';

const STEPS = [
  { n: 1, label: 'Reseller / Parent', hint: 'Agency', icon: 'briefcase-outline' as const },
  { n: 2, label: 'Child companies', hint: 'Clients', icon: 'globe-outline' as const },
  { n: 3, label: 'Services', hint: 'Products', icon: 'grid-outline' as const },
  { n: 4, label: 'Billing', hint: 'Rates', icon: 'cash-outline' as const },
  { n: 5, label: 'Trial / Live', hint: 'Launch', icon: 'rocket-outline' as const },
] as const;

type StepState = 'done' | 'active' | 'upcoming';

const DEFAULT_BILLING: BillingRateFieldsValues = {
  ...defaultBillingRateFields(),
  costPerChat: '0.4',
  freeChats: '50',
  platformFee: '60',
  aiToolsFee: '90',
  modulesFee: '0',
};

export function ContractWizardPageClient() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user, hasPage, hasOperational } = useAuth();
  const isInternalUser = user?.userType === 'Internal';
  const canManage = isInternalUser;
  const canCreateOrg = canCompaniesModuleAction(hasPage, hasOperational, 'create');

  const [contractStep, setContractStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [orgResult, setOrgResult] = useState<CompanySetupSubmitResult | null>(null);
  const [billing, setBilling] = useState<BillingRateFieldsValues>(DEFAULT_BILLING);
  const [agencyEmails, setAgencyEmails] = useState('');
  const [completing, setCompleting] = useState(false);

  const modulesPanelRef = useRef<ResellerModulesPanelHandle>(null);
  const putContractMutation = usePutAgencyBillingContractMutation();

  const activeResellerId = orgResult?.resellerId ?? '';
  const progressPct = (contractStep / STEPS.length) * 100;
  const currentStepMeta = STEPS[contractStep - 1];

  const handleOrgComplete = useCallback((result: CompanySetupSubmitResult) => {
    setOrgResult(result);
    setContractStep(3);
    Alert.alert('Success', 'Organization created. Choose services for this agency.');
  }, []);

  const handleWizardStepChange = useCallback((step: 1 | 2) => {
    setContractStep(step);
  }, []);

  const handleBillingChange = useCallback((patch: Partial<BillingRateFieldsValues>) => {
    setBilling((prev) => ({ ...prev, ...patch }));
  }, []);

  const validateBillingRates = useCallback((): boolean => {
    const value = Number(billing.modulesFee);
    if (!billing.modulesFee.trim() || !Number.isFinite(value) || value < 0) {
      Alert.alert('Validation', 'Set the software package fee per site.');
      return false;
    }
    return true;
  }, [billing.modulesFee]);

  const saveBillingContract = useCallback(async () => {
    if (!activeResellerId) return false;
    await putContractMutation.mutateAsync({
      resellerId: activeResellerId,
      currency: billing.currency.trim().toUpperCase(),
      billingCycle: billing.billingCycle,
      costPerChat: Number(billing.costPerChat) || 0,
      freeChatsPerMonth: Number(billing.freeChats) || 0,
      monthlyChatsPerSite: billing.monthlyChats.trim() ? Number(billing.monthlyChats) || 0 : undefined,
      platformFeeMonthly: Number(billing.platformFee) || 0,
      aiToolsMonthly: Number(billing.aiToolsFee) || 0,
      modulesFeeMonthly: Number(billing.modulesFee) || 0,
      invoiceToEmails: agencyEmails.trim() || undefined,
      clientBillingMode: billing.clientBillingMode,
      clientTrialDays:
        billing.clientBillingMode === 'trial' ? Number(billing.clientTrialDays) || 14 : undefined,
    });
    return true;
  }, [activeResellerId, agencyEmails, billing, putContractMutation]);

  const handleCompleteContract = async () => {
    if (!activeResellerId) return;
    setCompleting(true);
    try {
      if (!validateBillingRates()) return;
      await saveBillingContract();
      Alert.alert(
        'Contract complete',
        billing.clientBillingMode === 'trial'
          ? `Websites on ${billing.clientTrialDays || 14}-day trial.`
          : 'All websites set to Live billing.',
      );
      router.push(
        `/billing/website-contracts?resellerId=${encodeURIComponent(activeResellerId)}` as never,
      );
    } catch (err) {
      Alert.alert('Could not complete contract', extractApiErrorMessage(err));
    } finally {
      setCompleting(false);
    }
  };

  const handleServicesContinue = async () => {
    const ok = await modulesPanelRef.current?.save();
    if (ok === false) return;
    setContractStep(4);
  };

  if (!canManage || !canCreateOrg) {
    return (
      <MobileScreen>
        <AppCard style={{ gap: 10 }}>
          <StatusChip label="Restricted" tone="warning" />
          <Typography variant="medium16" style={{ fontWeight: '700' }}>
            Access limited
          </Typography>
          <Typography variant="medium" muted>
            New contract is for platform internal users only.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.md }}>
        <DashboardPageIntro subtitle="Create reseller, companies, services, billing, and launch status in one flow.">
          <View style={styles.metaRow}>
            <StatusChip label="Contract wizard" tone="info" />
            <Typography variant="small" muted>
              Step {contractStep} of {STEPS.length}
            </Typography>
          </View>
        </DashboardPageIntro>

        <DashboardCard contentStyle={{ gap: theme.spacing.sm }}>
          <View style={styles.metaRow}>
            <Typography variant="small" style={{ fontWeight: '700' }}>
              {currentStepMeta.hint}
            </Typography>
            <Typography variant="small" color={theme.app.dashboard.accentBlue} style={{ fontWeight: '700' }}>
              {Math.round(progressPct)}% complete
            </Typography>
          </View>

          <View
            style={[
              styles.progressTrack,
              { backgroundColor: theme.app.dashboard.cardBorder },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPct}%`,
                  backgroundColor: theme.app.dashboard.accentBlue,
                },
              ]}
            />
          </View>

          <View style={styles.stepperGrid}>
            {STEPS.map((step) => {
              const state: StepState =
                contractStep > step.n ? 'done' : contractStep === step.n ? 'active' : 'upcoming';
              return <StepCard key={step.n} step={step} state={state} />;
            })}
          </View>
        </DashboardCard>

        <DashboardCard contentStyle={{ gap: theme.spacing.md }}>
          {contractStep <= 2 ? (
            <>
              <StepSectionHeader
                icon={contractStep === 1 ? 'briefcase-outline' : 'globe-outline'}
                title={contractStep === 1 ? 'Reseller & parent' : 'Child company & POC'}
                subtitle={
                  contractStep === 1
                    ? 'Create or pick a reseller, then name the parent company'
                    : 'Add the first client site and invite a point of contact'
                }
              />
              <CompanySetupWizardModal
                embedded
                hideInternalStepper
                open
                onClose={() => router.push('/companies' as never)}
                onContractOrgComplete={handleOrgComplete}
                onWizardStepChange={handleWizardStepChange}
              />
            </>
          ) : null}

          {contractStep === 3 && orgResult ? (
            <>
              <StepSectionHeader
                icon="grid-outline"
                title="Services & modules"
                subtitle={`Agency: ${orgResult.parentCompanyName} — choose sellable products`}
              />
              <ResellerModulesPanel
                ref={modulesPanelRef}
                resellerId={orgResult.resellerId}
                resellerName={orgResult.parentCompanyName}
                embedded
                promptOfferingType
                hideSaveButton
              />
              <FooterNav
                onBack={() => setContractStep(2)}
                onNext={() => void handleServicesContinue()}
                nextLabel="Continue to billing"
              />
            </>
          ) : null}

          {contractStep === 4 && orgResult ? (
            <>
              <StepSectionHeader
                icon="cash-outline"
                title="Client billing setup"
                subtitle={`Set rates for ${orgResult.parentCompanyName}. Trial vs live comes next.`}
              />
              <BillingRateFieldsForm
                values={billing}
                onChange={handleBillingChange}
                showInvoiceEmails
                invoiceEmails={agencyEmails}
                onInvoiceEmailsChange={setAgencyEmails}
              />
              <FooterNav
                onBack={() => setContractStep(3)}
                onNext={() => {
                  if (!validateBillingRates()) return;
                  setContractStep(5);
                }}
                nextLabel="Continue to trial / live"
              />
            </>
          ) : null}

          {contractStep === 5 && orgResult ? (
            <>
              <StepSectionHeader
                icon="rocket-outline"
                title="Trial / Live launch"
                subtitle="Choose how client websites start after this contract is saved"
              />

              <View style={styles.modeRow}>
                <ModeCard
                  selected={billing.clientBillingMode === 'trial'}
                  icon="timer-outline"
                  title="Trial"
                  subtitle="Start with a free trial period"
                  onPress={() => handleBillingChange({ clientBillingMode: 'trial' })}
                />
                <ModeCard
                  selected={billing.clientBillingMode === 'live'}
                  icon="flash-outline"
                  title="Live"
                  subtitle="Full billing from day one"
                  onPress={() => handleBillingChange({ clientBillingMode: 'live' })}
                />
              </View>

              {billing.clientBillingMode === 'trial' ? (
                <InputField
                  label="Trial days"
                  value={billing.clientTrialDays}
                  onChangeText={(v) => handleBillingChange({ clientTrialDays: v })}
                  placeholder="14"
                  keyboardType="number-pad"
                />
              ) : (
                <Typography variant="small" muted>
                  Live mode: all client websites are fully billable with no trial period.
                </Typography>
              )}

              {orgResult.websites.length > 0 ? (
                <View
                  style={[
                    styles.websitesBox,
                    {
                      backgroundColor: theme.app.dashboard.overlayLight,
                      borderColor: theme.app.dashboard.cardBorder,
                    },
                  ]}
                >
                  <Typography variant="medium" style={{ fontWeight: '700' }}>
                    Websites ({orgResult.websites.length})
                  </Typography>
                  {orgResult.websites.map((w) => (
                    <View
                      key={w.id}
                      style={[
                        styles.websiteRow,
                        {
                          backgroundColor: theme.app.dashboard.overlayLight,
                          borderColor: theme.app.dashboard.cardBorder,
                        },
                      ]}
                    >
                      <Ionicons
                        name="link-outline"
                        size={16}
                        color={theme.app.dashboard.accentBlue}
                      />
                      <Typography variant="small" style={{ flex: 1 }} numberOfLines={1}>
                        {w.url || w.name || w.id}
                      </Typography>
                      <StatusChip
                        label={
                          billing.clientBillingMode === 'live'
                            ? 'Live'
                            : `Trial ${billing.clientTrialDays || 14}d`
                        }
                        tone={billing.clientBillingMode === 'live' ? 'success' : 'info'}
                      />
                    </View>
                  ))}
                </View>
              ) : null}

              <FooterNav
                onBack={() => setContractStep(4)}
                onNext={() => void handleCompleteContract()}
                nextLabel="Complete contract"
                backDisabled={completing}
                nextLoading={completing}
                nextDisabled={completing}
              />
            </>
          ) : null}
        </DashboardCard>
      </View>
    </MobileScreen>
  );
}

function StepCard({
  step,
  state,
}: {
  step: (typeof STEPS)[number];
  state: StepState;
}) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const success = theme.app.dashboard.accentGreen;

  const borderColor =
    state === 'active'
      ? `${accent}99`
      : state === 'done'
        ? `${success}66`
        : theme.app.dashboard.cardBorder;
  const backgroundColor =
    state === 'active'
      ? `${accent}18`
      : state === 'done'
        ? 'rgba(34, 197, 94, 0.08)'
        : theme.app.dashboard.overlayLight;
  const badgeBg =
    state === 'active' ? accent : state === 'done' ? success : 'transparent';
  const badgeBorder =
    state === 'upcoming' ? theme.app.dashboard.cardBorder : badgeBg;
  const labelColor =
    state === 'upcoming' ? theme.app.text.muted : theme.app.text.primary;

  return (
    <View style={[styles.stepCard, { borderColor, backgroundColor }]}>
      <View style={styles.stepCardTop}>
        <View style={[styles.stepBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
          {state === 'done' ? (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          ) : (
            <Typography
              variant="small"
              color={state === 'active' ? '#FFFFFF' : theme.app.text.muted}
              style={{ fontWeight: '700' }}
            >
              {String(step.n).padStart(2, '0')}
            </Typography>
          )}
        </View>
        <Typography
          variant="small"
          color={state === 'active' ? accent : theme.app.text.muted}
          style={{ fontWeight: state === 'active' ? '700' : '500', letterSpacing: 0.4 }}
        >
          {step.hint.toUpperCase()}
        </Typography>
      </View>
      <Typography variant="medium" style={{ fontWeight: state === 'active' ? '700' : '600' }} color={labelColor}>
        {step.label}
      </Typography>
    </View>
  );
}

function StepSectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color={theme.app.dashboard.accentBlue} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Typography variant="medium16" style={{ fontWeight: '700' }}>
          {title}
        </Typography>
        <Typography variant="small" muted>
          {subtitle}
        </Typography>
      </View>
    </View>
  );
}

function ModeCard({
  selected,
  icon,
  title,
  subtitle,
  onPress,
}: {
  selected: boolean;
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.modeCard,
        {
          borderColor: selected ? `${accent}99` : theme.app.dashboard.cardBorder,
          backgroundColor: selected ? `${accent}18` : theme.app.dashboard.overlayLight,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.modeIcon}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Typography variant="medium" style={{ fontWeight: '700' }}>
        {title}
      </Typography>
      <Typography variant="small" muted>
        {subtitle}
      </Typography>
      {selected ? <StatusChip label="Selected" tone="info" /> : null}
    </Pressable>
  );
}

function FooterNav({
  onBack,
  onNext,
  nextLabel,
  backDisabled,
  nextDisabled,
  nextLoading,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  backDisabled?: boolean;
  nextDisabled?: boolean;
  nextLoading?: boolean;
}) {
  return (
    <View style={styles.navRow}>
      <Button
        variant="outlined"
        onPress={onBack}
        disabled={backDisabled}
        style={styles.navGrow}
      >
        Back
      </Button>
      <Button
        onPress={onNext}
        disabled={nextDisabled}
        loading={nextLoading}
        style={styles.navGrow}
      >
        {nextLabel}
      </Button>
    </View>
  );
}
