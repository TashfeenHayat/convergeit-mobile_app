import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import { Button, Typography } from '@/components/ui';
import {
  PickWebsiteFields,
  isPickWebsiteComplete,
} from '@/features/website-assignments/components/PickWebsiteFields';
import type { PickWebsitePreset } from '@/features/website-assignments/components/PickWebsiteModal';
import { useCompaniesSetupResellersQuery } from '@/lib/hooks/query/companies';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

/** Pick org + website, then open inquire topics — web `/inquire-topics/add`. */
export function AddInquireTopicsPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const accent = theme.app.dashboard.accentBlue;
  const [picked, setPicked] = useState<PickWebsitePreset>({
    websiteId: '',
    parentCompanyId: '',
    childCompanyId: '',
    resellerId: '',
  });

  /** Web parity on Add topics open: GET /companies/setup/resellers */
  useCompaniesSetupResellersQuery({ enabled: true });

  const pickComplete = isPickWebsiteComplete(picked);
  const websiteId = picked.websiteId.trim();

  const goBack = () => {
    router.push('/website-assigning/inquire-topics' as Href);
  };

  const continueToTopics = () => {
    if (!pickComplete) return;
    router.push(
      `/website-assigning/website/${encodeURIComponent(websiteId)}/inquire-topics` as Href,
    );
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
       showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Typography variant="boldLarge">Add inquire topics</Typography>
            <Typography variant="medium" muted>
              Choose the organization and website, then configure visitor inquire topics.
            </Typography>
          </View>
          <Button size="compact" variant="outlined" onPress={goBack}>
            ← All inquire topics
          </Button>
        </View>

        <View
          style={[
            styles.stepBanner,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
            },
          ]}
        >
          <View
            style={[
              styles.stepBannerIcon,
              {
                backgroundColor: `${accent}22`,
                borderColor: glassUi.border.subtle,
              },
            ]}
          >
            <Ionicons name="folder-outline" size={18} color={accent} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Typography variant="medium16" style={{ fontWeight: '700' }}>
              Step 1 — Select website
            </Typography>
            <Typography variant="small" muted>
              Pick reseller, parent company, child company, and the website for inquire topics.
            </Typography>
          </View>
        </View>

        <View
          style={[
            styles.orgCard,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
            },
          ]}
        >
          <View style={styles.sectionTitleRow}>
            <View
              style={[
                styles.sectionBadge,
                { backgroundColor: `${accent}22`, borderColor: `${accent}55` },
              ]}
            >
              <Typography variant="small" style={{ fontWeight: '800', color: accent }}>
                1
              </Typography>
            </View>
            <Typography variant="medium16" style={{ fontWeight: '700' }}>
              Parent company
            </Typography>
          </View>
          <Typography variant="small" muted>
            Pick the client root company for this distribution setup.
          </Typography>

          <PickWebsiteFields
            value={picked}
            onChange={setPicked}
            showProgressChips={false}
            flatLayout
 />

          <View style={styles.footerActions}>
            <Pressable onPress={goBack} hitSlop={8}>
              <Typography variant="medium" muted style={{ fontWeight: '600' }}>
                Cancel
              </Typography>
            </Pressable>
            <Button
              onPress={continueToTopics}
              disabled={!pickComplete}
              style={styles.continueBtn}
            >
              Continue to topics
            </Button>
          </View>
        </View>
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 8 },
  scroll: { paddingTop: 4, paddingBottom: 40 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },
  stepBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  stepBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  orgCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  continueBtn: {
    minWidth: 180,
  },
});
