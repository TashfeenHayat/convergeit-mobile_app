import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button, FormModal, StatusChip, Typography } from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  formatSetupDraftWhen,
  parseCompanySetupDraftsList,
} from '@/lib/companies/setup-drafts-list.utils';
import { useCompanySetupDraftsListQuery } from '@/lib/hooks/query/companies';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

export type CompanySetupDraftsModalProps = {
  open: boolean;
  onClose: () => void;
  onResume: (draftId: string) => void;
  onStartNew: () => void;
};

export function CompanySetupDraftsModal({
  open,
  onClose,
  onResume,
  onStartNew,
}: CompanySetupDraftsModalProps) {
  const theme = useAppTheme();
  const draftsQuery = useCompanySetupDraftsListQuery({ enabled: open });
  const rows = useMemo(
    () => parseCompanySetupDraftsList(draftsQuery.data),
    [draftsQuery.data],
  );

  return (
    <FormModal
      open={open}
      title="Company setup drafts"
      description="In-progress setups. Resume to continue, or start a new company flow."
      onClose={onClose}
      onSave={onClose}
      primaryButtonLabel="Close"
      showCancelButton={false}
    >
      <View style={{ gap: 12 }}>
        <View style={styles.topRow}>
          <Typography variant="small" muted style={{ flex: 1 }}>
            {rows.length > 0
              ? `${rows.length} draft${rows.length === 1 ? '' : 's'} saved`
              : 'No drafts yet'}
          </Typography>
          <Button size="compact" variant="outlined" onPress={onStartNew}>
            New setup
          </Button>
        </View>

        {draftsQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.app.dashboard.accentBlue} />
            <Typography variant="small" muted>
              Loading drafts…
            </Typography>
          </View>
        ) : draftsQuery.isError ? (
          <View style={styles.center}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(draftsQuery.error, 'Could not load drafts.')}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void draftsQuery.refetch()}>
              Retry
            </Button>
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.center}>
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor: `${theme.app.dashboard.accentBlue}22`,
                  borderColor: glassUi.border.subtle,
                },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={24}
                color={theme.app.dashboard.accentBlue}
 />
            </View>
            <Typography variant="medium" style={{ fontWeight: '700' }}>
              No drafts yet
            </Typography>
            <Typography variant="small" muted style={{ textAlign: 'center' }}>
              Use Add company to start. Progress is saved when you continue between steps.
            </Typography>
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={{ gap: 8 }}>
              {rows.map((row) => (
                <Pressable
                  key={row.id}
                  onPress={() => {
                    onResume(row.id);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: theme.app.dashboard.overlayLight,
                      borderColor: theme.app.dashboard.cardBorder,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.rowIcon,
                      {
                        backgroundColor: `${theme.app.dashboard.accentBlue}22`,
                        borderColor: glassUi.border.subtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name="document-outline"
                      size={18}
                      color={theme.app.dashboard.accentBlue}
 />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Typography variant="medium" style={{ fontWeight: '700' }} numberOfLines={1}>
                      {row.label}
                    </Typography>
                    <Typography variant="small" muted numberOfLines={1}>
                      {row.stepLabel}
                      {row.childCount > 0
                        ? ` · ${row.childCount} child${row.childCount === 1 ? '' : 'ren'}`
                        : ''}
                    </Typography>
                    <Typography variant="small" muted numberOfLines={1}>
                      Saved {formatSetupDraftWhen(row.updatedAt)}
                    </Typography>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <StatusChip label={row.status.replace(/_/g, ' ')} tone="info" />
                    <Typography
                      variant="small"
                      color={theme.app.dashboard.accentBlue}
                      style={{ fontWeight: '700' }}
                    >
                      Resume
                    </Typography>
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  center: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
