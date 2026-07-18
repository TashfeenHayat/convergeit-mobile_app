import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type Ionicons from '@expo/vector-icons/Ionicons';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  DataTable,
  FormModal,
  InputField,
  ListTableCard,
  SearchBar,
  TablePagination,
  Typography,
  type DataTableColumn,
} from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { isRecord, pickStr } from '@/lib/utils/core';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { useAppTheme } from '@/theme';

const PAGE_SIZE = 20;

type IconName = ComponentProps<typeof Ionicons>['name'];

export type ApiResourceField = {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  secure?: boolean;
};

export type ApiResourceScreenProps = {
  title: string;
  description?: string;
  icon?: IconName;
  queryKey: readonly unknown[];
  queryFn: (params: { page: number; limit: number; search?: string }) => Promise<unknown>;
  /** Column ids from row objects. Default: id + name/title/email */
  columnIds?: string[];
  createFields?: ApiResourceField[];
  createFn?: (body: Record<string, string>) => Promise<unknown>;
  createLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  headerExtra?: ReactNode;
};

type Row = Record<string, string> & { id: string };

function toRows(data: unknown): Row[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r, index) => {
      const id = pickStr(r, ['id', 'widgetKey', 'key', 'uuid']) || `row-${index}`;
      const out: Row = { id };
      for (const [k, v] of Object.entries(r)) {
        if (v == null || typeof v === 'object') continue;
        out[k] = String(v);
      }
      if (!out.name && !out.title) {
        out.name =
          pickStr(r, ['name', 'title', 'label', 'email', 'displayName', 'subject']) || '—';
      }
      return out;
    });
}

/**
 * Generic list (+ optional create) screen for productizing remaining dashboard modules quickly
 * against already-synced API clients.
 */
export function ApiResourceScreen({
  title,
  description,
  icon = 'grid-outline',
  queryKey,
  queryFn,
  columnIds,
  createFields,
  createFn,
  createLabel = 'Add',
  emptyTitle = 'No records',
  emptyDescription = 'Nothing to show yet.',
  headerExtra,
}: ApiResourceScreenProps) {
  const theme = useAppTheme();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const query = useQuery({
    queryKey: [...queryKey, page, search] as const,
    queryFn: () =>
      queryFn({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!createFn) throw new Error('Create not configured');
      return createFn(form);
    },
    onSuccess: async () => {
      setModalOpen(false);
      setForm({});
      await qc.invalidateQueries({ queryKey: [...queryKey] });
    },
  });

  const rows = useMemo(() => toRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns: DataTableColumn<Row>[] = useMemo(() => {
    const ids =
      columnIds ??
      (rows[0]
        ? Object.keys(rows[0])
            .filter((k) => k !== 'id')
            .slice(0, 4)
        : ['name']);
    const unique = [...new Set(ids.length ? ids : ['name'])];
    return unique.map((id) => ({
      id,
      label: id.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
      minWidth: 120,
      cellVariant: id === 'name' || id === 'title' ? 'default' : 'muted',
    })) as DataTableColumn<Row>[];
  }, [columnIds, rows]);

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: theme.spacing.screen }]}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isLoading}
            onRefresh={() => void query.refetch()}
            tintColor={theme.app.dashboard.accentBlue}
          />
        }
      >
        <View style={{ gap: theme.spacing.md }}>
          <DashboardPageIntro subtitle={description}>
            {createFn && createFields?.length ? (
              <Button
                onPress={() => {
                  setForm({});
                  setModalOpen(true);
                }}
              >
                {createLabel}
              </Button>
            ) : null}
          </DashboardPageIntro>

          {headerExtra}

          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder={`Search ${title.toLowerCase()}…`}
          />

          {query.isError ? (
            <AppCard>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(query.error, `Could not load ${title}.`)}
              </Typography>
            </AppCard>
          ) : (
            <ListTableCard
              title={title}
              subtitle={`${total} total`}
              icon={icon}
              footer={
                <>
                  <Typography variant="small" muted>
                    Page {page} · {total} records
                  </Typography>
                  <TablePagination page={page} pageCount={pageCount} onPageChange={setPage} />
                </>
              }
            >
              {query.isLoading && !query.data ? (
                <View style={styles.centered}>
                  <ActivityIndicator color={theme.app.dashboard.accentBlue} />
                </View>
              ) : (
                <DataTable
                  columns={columns}
                  rows={rows}
                  getRowId={(r) => r.id}
                  minWidth={Math.max(360, columns.length * 120)}
                  emptyState={{ title: emptyTitle, description: emptyDescription, icon }}
                />
              )}
            </ListTableCard>
          )}
        </View>
      </ScrollView>

      {createFn && createFields?.length ? (
        <FormModal
          open={modalOpen}
          title={`${createLabel} ${title}`}
          onClose={() => setModalOpen(false)}
          onSave={() => {
            for (const field of createFields) {
              if (field.required && !form[field.key]?.trim()) {
                Alert.alert('Validation', `${field.label} is required.`);
                return;
              }
            }
            void createMutation.mutateAsync().catch((err) => {
              Alert.alert('Save failed', extractApiErrorMessage(err));
            });
          }}
          primaryButtonLabel="Create"
          primaryButtonDisabled={createMutation.isPending}
        >
          <View style={{ gap: 12 }}>
            {createFields.map((field) => (
              <InputField
                key={field.key}
                label={field.label}
                value={form[field.key] ?? ''}
                onChangeText={(v) => setForm((prev) => ({ ...prev, [field.key]: v }))}
                placeholder={field.placeholder}
                secureTextEntry={field.secure}
              />
            ))}
          </View>
        </FormModal>
      ) : null}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 32 },
  centered: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
});
