import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  ListTableCard,
  SearchBar,
  SegmentedControl,
  TablePagination,
  Typography,
} from '@/components/ui';
import { EmptyPocListState } from '@/features/users/poc-list/components/EmptyPocListState';
import { PocChildCompanyAccordion } from '@/features/users/poc-list/components/PocChildCompanyAccordion';
import { PocListFlatList } from '@/features/users/poc-list/components/PocListFlatList';
import type {
  PocListRow,
  PocParentGroup,
  PocResellerGroup,
} from '@/features/users/poc-list/types';
import {
  buildPocDirectoryTree,
  childExpandKey,
  collectExpandIdsForSearch,
  formatChildPreview,
} from '@/features/users/poc-list/utils/group-poc-directory';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

const POC_LIST_PAGE_SIZE = 20;

type ViewMode = 'grouped' | 'table';

function CountBadge({ label, accent }: { label: string; accent?: boolean }) {
  const theme = useAppTheme();
  const accentColor = theme.app.dashboard.accentBlue;
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: accent ? `${accentColor}22` : theme.app.dashboard.overlayLight,
          borderColor: accent ? `${accentColor}55` : theme.app.dashboard.cardBorder,
        },
      ]}
    >
      <Typography
        variant="small"
        style={{ fontWeight: '600', color: accent ? accentColor : theme.app.text.secondary }}
      >
        {label}
      </Typography>
    </View>
  );
}

function ParentAccordion({
  resellerId,
  parent,
  expanded,
  expandedChildren,
  onToggle,
  onToggleChild,
}: {
  resellerId: string;
  parent: PocParentGroup;
  expanded: boolean;
  expandedChildren: Set<string>;
  onToggle: (key: string, open: boolean) => void;
  onToggleChild: (key: string, open: boolean) => void;
}) {
  const theme = useAppTheme();
  const key = `${resellerId}::${parent.id}`;
  const childCount = parent.children.length;
  const preview = formatChildPreview(parent.children);

  return (
    <View
      style={[
        styles.nestedShell,
        {
          borderColor: theme.app.dashboard.cardBorder,
          backgroundColor: theme.app.dashboard.overlayLight,
        },
      ]}
    >
      <Pressable
        onPress={() => onToggle(key, !expanded)}
        style={({ pressed }) => [styles.accordionHeader, { opacity: pressed ? 0.9 : 1 }]}
      >
        <View
          style={[
            styles.parentIcon,
            {
              backgroundColor: 'rgba(56, 189, 248, 0.16)',
              borderColor: glassUi.border.subtle,
            },
          ]}
        >
          <Ionicons name="layers-outline" size={18} color="#7DD3FC" />
        </View>
        <View style={styles.headerBody}>
          <Typography variant="medium" style={{ fontWeight: '700' }} numberOfLines={1}>
            {parent.name}
          </Typography>
          <View style={styles.badgeRow}>
            <CountBadge
              label={`${childCount} child ${childCount === 1 ? 'company' : 'companies'}`}
            />
            <CountBadge
              accent
              label={`${parent.pocCount} POC${parent.pocCount === 1 ? '' : 's'}`}
            />
          </View>
          {!expanded && preview ? (
            <Typography variant="small" muted numberOfLines={2}>
              {preview}
            </Typography>
          ) : null}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.app.text.secondary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          {childCount > 1 ? (
            <Typography variant="small" muted>
              {childCount} child companies under this parent — expand only the one you need.
            </Typography>
          ) : null}
          <View style={{ gap: 8 }}>
            {parent.children.map((child) => {
              const childKey = childExpandKey(resellerId, parent.id, child.id);
              return (
                <PocChildCompanyAccordion
                  key={child.id}
                  child={child}
                  expanded={expandedChildren.has(childKey)}
                  onToggle={(open) => onToggleChild(childKey, open)}
                />
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ResellerAccordion({
  reseller,
  expandedReseller,
  expandedParents,
  expandedChildren,
  onToggleReseller,
  onToggleParent,
  onToggleChild,
}: {
  reseller: PocResellerGroup;
  expandedReseller: boolean;
  expandedParents: Set<string>;
  expandedChildren: Set<string>;
  onToggleReseller: (id: string, open: boolean) => void;
  onToggleParent: (key: string, open: boolean) => void;
  onToggleChild: (key: string, open: boolean) => void;
}) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;

  return (
    <View
      style={[
        styles.resellerShell,
        {
          borderColor: theme.app.dashboard.cardBorder,
          backgroundColor: theme.app.dashboard.overlayLight,
        },
      ]}
    >
      <Pressable
        onPress={() => onToggleReseller(reseller.id, !expandedReseller)}
        style={({ pressed }) => [styles.accordionHeader, { opacity: pressed ? 0.9 : 1 }]}
      >
        <View
          style={[
            styles.resellerIcon,
            {
              backgroundColor: `${accent}22`,
              borderColor: glassUi.border.subtle,
            },
          ]}
        >
          <Ionicons name="storefront-outline" size={22} color={accent} />
        </View>
        <View style={styles.headerBody}>
          <Typography variant="medium16" style={{ fontWeight: '800' }} numberOfLines={1}>
            {reseller.name}
          </Typography>
          <View style={styles.badgeRow}>
            <CountBadge
              label={`${reseller.parentCount} parent${reseller.parentCount === 1 ? '' : 's'}`}
            />
            <CountBadge
              label={`${reseller.childCount} child ${reseller.childCount === 1 ? 'company' : 'companies'}`}
            />
            <CountBadge
              accent
              label={`${reseller.pocCount} POC${reseller.pocCount === 1 ? '' : 's'}`}
            />
          </View>
        </View>
        <Ionicons
          name={expandedReseller ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.app.text.secondary}
        />
      </Pressable>

      {expandedReseller ? (
        <View style={styles.details}>
          {reseller.parentCount > 1 ? (
            <Typography variant="small" muted>
              {reseller.parentCount} parent companies · {reseller.childCount} child companies total
            </Typography>
          ) : null}
          <View style={{ gap: 10 }}>
            {reseller.parents.map((parent) => (
              <ParentAccordion
                key={parent.id}
                resellerId={reseller.id}
                parent={parent}
                expanded={expandedParents.has(`${reseller.id}::${parent.id}`)}
                expandedChildren={expandedChildren}
                onToggle={onToggleParent}
                onToggleChild={onToggleChild}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export type PocHierarchySectionProps = {
  search: string;
  onSearchChange: (value: string) => void;
  rows: PocListRow[];
  allRowsCount: number;
  isLoading: boolean;
  errorMessage: string | null;
};

export function PocHierarchySection({
  search,
  onSearchChange,
  rows,
  allRowsCount,
  isLoading,
  errorMessage,
}: PocHierarchySectionProps) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [page, setPage] = useState(1);
  const tree = useMemo(() => buildPocDirectoryTree(rows), [rows]);

  const [expandedResellers, setExpandedResellers] = useState<Set<string>>(() => new Set());
  const [expandedParents, setExpandedParents] = useState<Set<string>>(() => new Set());
  const [expandedChildren, setExpandedChildren] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const q = search.trim();
    if (q) {
      const { resellerIds, parentIds, childIds } = collectExpandIdsForSearch(tree, q);
      setExpandedResellers(new Set(resellerIds));
      setExpandedParents(new Set(parentIds));
      setExpandedChildren(new Set(childIds));
      return;
    }
    const first = tree.resellers[0];
    if (!first) {
      setExpandedResellers(new Set());
      setExpandedParents(new Set());
      setExpandedChildren(new Set());
      return;
    }
    setExpandedResellers(new Set([first.id]));
    const firstParent = first.parents[0];
    setExpandedParents(firstParent ? new Set([`${first.id}::${firstParent.id}`]) : new Set());
    setExpandedChildren(new Set());
  }, [tree, search]);

  useEffect(() => {
    setPage(1);
  }, [search, viewMode, rows.length]);

  const showEmpty = !isLoading && !errorMessage && allRowsCount === 0;
  const showFilteredEmpty = !isLoading && !errorMessage && allRowsCount > 0 && rows.length === 0;

  const tablePageCount = Math.max(1, Math.ceil(rows.length / POC_LIST_PAGE_SIZE));
  const tablePage = Math.min(page, tablePageCount);
  const tableRows = useMemo(() => {
    const start = (tablePage - 1) * POC_LIST_PAGE_SIZE;
    return rows.slice(start, start + POC_LIST_PAGE_SIZE);
  }, [rows, tablePage]);
  const tableFooterStart = rows.length === 0 ? 0 : (tablePage - 1) * POC_LIST_PAGE_SIZE + 1;
  const tableFooterEnd = Math.min(tablePage * POC_LIST_PAGE_SIZE, rows.length);

  const expandAll = () => {
    const resellers = new Set<string>();
    const parents = new Set<string>();
    const children = new Set<string>();
    for (const r of tree.resellers) {
      resellers.add(r.id);
      for (const p of r.parents) {
        parents.add(`${r.id}::${p.id}`);
        for (const c of p.children) {
          children.add(childExpandKey(r.id, p.id, c.id));
        }
      }
    }
    setExpandedResellers(resellers);
    setExpandedParents(parents);
    setExpandedChildren(children);
  };

  const collapseAll = () => {
    setExpandedResellers(new Set());
    setExpandedParents(new Set());
    setExpandedChildren(new Set());
  };

  const toggleInSet = (
    setter: Dispatch<SetStateAction<Set<string>>>,
    key: string,
    open: boolean,
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (open) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  return (
    <ListTableCard
      title="POC directory"
      subtitle="Open reseller → parent → child step by step."
      icon="person-circle-outline"
      toolbar={
        <View style={{ gap: 10, width: '100%' }}>
          <SearchBar
            value={search}
            onChange={onSearchChange}
            placeholder="Search reseller, parent, child, POC…"
          />
          <SegmentedControl
            value={viewMode}
            onChange={(v) => setViewMode(v as ViewMode)}
            options={[
              { label: 'Grouped', value: 'grouped' },
              { label: 'Flat list', value: 'table' },
            ]}
          />
          {viewMode === 'grouped' ? (
            <View style={styles.expandRow}>
              <Pressable
                onPress={expandAll}
                style={({ pressed }) => [
                  styles.expandBtn,
                  {
                    borderColor: theme.app.dashboard.cardBorder,
                    backgroundColor: theme.app.dashboard.overlayLight,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Ionicons name="expand-outline" size={14} color={accent} />
                <Typography variant="small" style={{ fontWeight: '600', color: accent }}>
                  Expand all
                </Typography>
              </Pressable>
              <Pressable
                onPress={collapseAll}
                style={({ pressed }) => [
                  styles.expandBtn,
                  {
                    borderColor: theme.app.dashboard.cardBorder,
                    backgroundColor: theme.app.dashboard.overlayLight,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Ionicons name="contract-outline" size={14} color={theme.app.text.secondary} />
                <Typography variant="small" style={{ fontWeight: '600' }} muted>
                  Collapse all
                </Typography>
              </Pressable>
            </View>
          ) : null}
        </View>
      }
      footer={
        viewMode === 'table' && rows.length > 0 ? (
          <>
            <Typography variant="small" muted>
              Showing {tableFooterStart} to {tableFooterEnd} of {rows.length}
            </Typography>
            {tablePageCount > 1 ? (
              <TablePagination page={tablePage} pageCount={tablePageCount} onPageChange={setPage} />
            ) : null}
          </>
        ) : viewMode === 'grouped' && tree.resellers.length > 0 ? (
          <Typography variant="small" muted>
            {tree.resellers.length} reseller{tree.resellers.length === 1 ? '' : 's'} · {rows.length}{' '}
            contact{rows.length === 1 ? '' : 's'}
          </Typography>
        ) : undefined
      }
    >
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={accent} />
          <Typography variant="small" muted>
            Loading POC directory…
          </Typography>
        </View>
      ) : errorMessage ? (
        <Typography variant="medium" color={theme.app.danger}>
          {errorMessage}
        </Typography>
      ) : showEmpty ? (
        <EmptyPocListState />
      ) : showFilteredEmpty ? (
        <EmptyPocListState
          title="No matches"
          description="Try a different search for reseller, parent, child company, or POC name/email."
        />
      ) : viewMode === 'table' ? (
        <PocListFlatList rows={tableRows} />
      ) : (
        <View style={{ gap: 10 }}>
          {tree.resellers.map((reseller) => (
            <ResellerAccordion
              key={reseller.id}
              reseller={reseller}
              expandedReseller={expandedResellers.has(reseller.id)}
              expandedParents={expandedParents}
              expandedChildren={expandedChildren}
              onToggleReseller={(id, open) => toggleInSet(setExpandedResellers, id, open)}
              onToggleParent={(key, open) => toggleInSet(setExpandedParents, key, open)}
              onToggleChild={(key, open) => toggleInSet(setExpandedChildren, key, open)}
            />
          ))}
        </View>
      )}
    </ListTableCard>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  expandRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  resellerShell: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  nestedShell: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resellerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  parentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  details: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  centered: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
