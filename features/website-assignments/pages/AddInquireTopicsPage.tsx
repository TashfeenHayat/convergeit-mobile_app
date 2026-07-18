import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import { AppCard, Button, Typography } from '@/components/ui';
import {
  PickWebsiteFields,
  isPickWebsiteComplete,
} from '@/features/website-assignments/components/PickWebsiteFields';
import type { PickWebsitePreset } from '@/features/website-assignments/components/PickWebsiteModal';
import { useAppTheme } from '@/theme';

/** Pick a website then open its inquire topics editor. */
export function AddInquireTopicsPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const [picked, setPicked] = useState<PickWebsitePreset>({
    websiteId: '',
    parentCompanyId: '',
    childCompanyId: '',
    resellerId: '',
  });

  return (
    <MobileScreen>
      <View style={{ gap: theme.spacing.md }}>
        <View>
          <Typography variant="boldLarge">Add inquire topics</Typography>
          <Typography variant="medium" muted style={{ marginTop: 4 }}>
            Choose a website to configure visitor inquiry topics.
          </Typography>
        </View>
        <PickWebsiteFields value={picked} onChange={setPicked} />
        {!isPickWebsiteComplete(picked) ? (
          <AppCard>
            <Typography variant="medium" muted>
              Select reseller, parent company, and website to continue.
            </Typography>
          </AppCard>
        ) : (
          <Button
            onPress={() =>
              router.push(`/website-assigning/website/${picked.websiteId}/inquire-topics` as never)
            }
          >
            Continue
          </Button>
        )}
      </View>
    </MobileScreen>
  );
}
