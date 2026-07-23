import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';

import type { ParentCompanyChildDetail } from '@/api/types/companies.types';
import { Button, InputField, SegmentedControl, Typography } from '@/components/ui';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

export type ChildWebsiteEditRow = {
  id?: string;
  name: string;
  url: string;
};

export function websitesFromChild(child: ParentCompanyChildDetail): ChildWebsiteEditRow[] {
  const multi = child.websites ?? [];
  if (multi.length > 0) {
    return multi
      .map((w) => ({
        id: (w.id ?? w.websiteId)?.trim() || undefined,
        name: (w.name ?? '').trim(),
        url: (w.url ?? '').trim(),
      }))
      .filter((w) => w.url.length > 0);
  }
  const single = child.website;
  if (single?.url?.trim()) {
    return [
      {
        id: (single.id ?? single.websiteId)?.trim() || undefined,
        name: (single.name ?? '').trim(),
        url: single.url.trim(),
      },
    ];
  }
  return [];
}

export function ChildCompanyWebsitesEditor({
  parentCompanyId,
  childCompanyId,
  websites,
  onWebsitesChange,
  disabled = false,
}: {
  parentCompanyId: string;
  childCompanyId: string;
  websites: ChildWebsiteEditRow[];
  onWebsitesChange: (next: ChildWebsiteEditRow[]) => void;
  disabled?: boolean;
}) {
  const theme = useAppTheme();
  const router = useRouter();
  const [tab, setTab] = useState<'list' | 'agents'>('list');
  const [displayName, setDisplayName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const parentId = parentCompanyId.trim();
  const childId = childCompanyId.trim();

  const openAssignAgents = () => {
    if (!parentId || !childId) return;
    router.push(
      `/website-assigning/sites/${encodeURIComponent(parentId)}/${encodeURIComponent(childId)}` as Href,
    );
  };

  const openAssignmentDetail = (websiteId: string) => {
    const id = websiteId.trim();
    if (!id) return;
    router.push(`/website-assigning/website/${encodeURIComponent(id)}` as Href);
  };

  const addRow = () => {
    const url = websiteUrl.trim();
    if (!url || disabled) return;
    const already = websites.some((w) => w.url.toLowerCase() === url.toLowerCase());
    if (already) return;
    onWebsitesChange([...websites, { name: displayName.trim(), url }]);
    setDisplayName('');
    setWebsiteUrl('');
  };

  const updateAt = (index: number, patch: Partial<ChildWebsiteEditRow>) => {
    if (disabled) return;
    onWebsitesChange(
      websites.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const removeAt = (index: number) => {
    if (disabled) return;
    onWebsitesChange(websites.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <Ionicons name="globe-outline" size={16} color={theme.app.dashboard.accentBlue} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Websites
          </Typography>
          <Typography variant="small" muted>
            Websites linked to this child for chat widgets and assignments.
          </Typography>
        </View>
      </View>

      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.app.dashboard.overlayLight,
            borderColor: theme.app.dashboard.cardBorder,
          },
        ]}
      >
        <Typography variant="small" muted>
          WEBSITES — Saved together with child company via one PATCH call (websites: [] full
          replace).
        </Typography>

        <SegmentedControl
          value={tab}
          onChange={(v) => {
            const next = v as 'list' | 'agents';
            if (next === 'agents') {
              openAssignAgents();
              return;
            }
            setTab('list');
          }}
          options={[
            { value: 'list', label: 'Assignment list' },
            { value: 'agents', label: 'Assign agents' },
          ]}
        />

        {websites.length === 0 ? (
          <Typography variant="small" muted>
            No websites linked yet.
          </Typography>
        ) : (
          websites.map((site, index) => (
            <View
              key={site.id ?? `site-${index}`}
              style={[
                styles.siteRow,
                {
                  backgroundColor: theme.app.dashboard.overlayLight,
                  borderColor: theme.app.dashboard.cardBorder,
                },
              ]}
            >
              <View style={styles.siteFieldRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <InputField
                    label="Name"
                    value={site.name}
                    onChangeText={(v) => updateAt(index, { name: v })}
                    placeholder="Display name"
                    editable={!disabled}
                  />
                </View>
                {site.id ? (
                  <Button
                    size="compact"
                    variant="outlined"
                    onPress={() => openAssignmentDetail(site.id!)}
                    style={styles.siteSideBtn}
                  >
                    Assignment detail
                  </Button>
                ) : null}
              </View>
              <View style={styles.siteFieldRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <InputField
                    label="URL"
                    value={site.url}
                    onChangeText={(v) => updateAt(index, { url: v })}
                    placeholder="https://example.com"
                    autoCapitalize="none"
                    keyboardType="url"
                    editable={!disabled}
                  />
                </View>
                {!disabled ? (
                  <Button
                    size="compact"
                    variant="outlined"
                    onPress={() => removeAt(index)}
                    style={styles.siteSideBtn}
                  >
                    Remove
                  </Button>
                ) : null}
              </View>
            </View>
          ))
        )}

        {!disabled ? (
          <View style={styles.addForm}>
            <Typography variant="medium" style={{ fontWeight: '700' }}>
              Add website
            </Typography>
            <InputField
              label="Display name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. Lahore branch"
            />
            <InputField
              label="Website URL"
              value={websiteUrl}
              onChangeText={setWebsiteUrl}
              placeholder="https://example.com"
              autoCapitalize="none"
              keyboardType="url"
            />
            <Button size="compact" onPress={addRow} disabled={!websiteUrl.trim()}>
              Add row
            </Button>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(88, 101, 242, 0.16)',
    borderWidth: 1,
    borderColor: glassUi.border.subtle,
    marginTop: 2,
  },
  panel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  siteRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  siteFieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  siteSideBtn: {
    marginBottom: 4,
    flexShrink: 0,
  },
  addForm: { gap: 10 },
});
