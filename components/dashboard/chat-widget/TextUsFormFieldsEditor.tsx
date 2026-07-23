import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, InputField, SelectField, Typography } from '@/components/ui';
import { WidgetWizardToggleRow } from '@/features/chat-widget/components/WidgetWizardToggleRow';
import {
  createEmptyCustomTextUsField,
  isDefaultTextUsFieldKey,
  slugifyTextUsFieldKey,
  TEXT_US_FIELD_TYPES,
} from '@/lib/chat-widget/text-us-form-defaults';
import { FIELD_MAX } from '@/lib/chat-widget/widget-field-validation';
import type { TextUsFormFieldDraft } from '@/lib/chat-widget/widgetDraft';
import { useAppTheme } from '@/theme';

const DEFAULT_FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  message: 'Message',
  phone: 'Phone',
};

export type TextUsFormFieldsEditorProps = {
  fields: TextUsFormFieldDraft[];
  onChange: (next: TextUsFormFieldDraft[]) => void;
};

export function TextUsFormFieldsEditor({
  fields,
  onChange,
}: TextUsFormFieldsEditorProps) {
  const theme = useAppTheme();
  const customCount = fields.filter((f) => !isDefaultTextUsFieldKey(f.key)).length;

  const updateField = (key: string, patch: Partial<TextUsFormFieldDraft>) => {
    onChange(fields.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  };

  const removeCustomField = (key: string) => {
    onChange(
      fields.filter((f) => f.key !== key || isDefaultTextUsFieldKey(f.key)),
    );
  };

  const addCustomField = () => {
    onChange([...fields, createEmptyCustomTextUsField(customCount)]);
  };

  return (
    <View style={styles.root}>
      {fields.map((field) => {
        const isDefault = isDefaultTextUsFieldKey(field.key);
        return (
          <View
            key={field.key}
            style={[
              styles.card,
              {
                borderColor: theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
              },
            ]}
          >
            <View style={styles.cardHead}>
              <Typography
                variant="small"
                muted
                style={{ fontWeight: '700', letterSpacing: 0.4 }}
              >
                {(
                  isDefault
                    ? DEFAULT_FIELD_LABELS[field.key] ?? field.key
                    : 'Custom field'
                ).toUpperCase()}
              </Typography>
              {!isDefault ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove custom field"
                  hitSlop={8}
                  onPress={() => removeCustomField(field.key)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={theme.app.text.muted}
                  />
                </Pressable>
              ) : null}
            </View>

            {isDefault ? (
              <Typography variant="small" muted>
                Key: {field.key} · type: {field.fieldType}
              </Typography>
            ) : (
              <View style={styles.row2}>
                <View style={styles.flex1}>
                  <InputField
                    label="Field key (JSON)"
                    value={field.key}
                    onChangeText={(v) => {
                      const nextKey = slugifyTextUsFieldKey(v);
                      if (!nextKey || isDefaultTextUsFieldKey(nextKey)) return;
                      if (fields.some((f) => f.key === nextKey && f.key !== field.key)) {
                        return;
                      }
                      onChange(
                        fields.map((f) =>
                          f.key === field.key ? { ...f, key: nextKey } : f,
                        ),
                      );
                    }}
                  />
                </View>
                <View style={styles.flex1}>
                  <SelectField
                    label="Type"
                    value={field.fieldType}
                    onChange={(v) => updateField(field.key, { fieldType: v })}
                    options={TEXT_US_FIELD_TYPES.map((t) => ({
                      label: t.label,
                      value: t.value,
                    }))}
                  />
                </View>
              </View>
            )}

            <View style={styles.row2}>
              <View style={styles.flex1}>
                <InputField
                  label="Label"
                  value={field.label}
                  onChangeText={(v) => updateField(field.key, { label: v })}
                />
              </View>
              <View style={styles.flex1}>
                <InputField
                  label="Placeholder"
                  value={field.placeholder ?? ''}
                  onChangeText={(v) =>
                    updateField(field.key, {
                      placeholder: v.slice(0, FIELD_MAX.placeholder),
                    })
                  }
                />
              </View>
            </View>

            <WidgetWizardToggleRow
              label="Required"
              value={Boolean(field.required)}
              onChange={(checked) =>
                updateField(field.key, { required: checked })
              }
            />
          </View>
        );
      })}

      <Button
        variant="secondary"
        size="compact"
        onPress={addCustomField}
        style={styles.addBtn}
      >
        + Add custom field
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: { flex: 1, minWidth: 0 },
  addBtn: { alignSelf: 'flex-start' },
});
