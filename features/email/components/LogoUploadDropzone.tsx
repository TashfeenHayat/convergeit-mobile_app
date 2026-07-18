import { Alert, Image, StyleSheet, View } from "react-native";

import { Button, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { pickImageFromLibrary, type UploadableFile } from "@/lib/files";
import { tokens } from "@/theme/tokens";

export type LogoUploadDropzoneProps = {
  logoUrl?: string | null;
  uploading?: boolean;
  disabled?: boolean;
  onUpload: (file: UploadableFile) => Promise<void> | void;
  onRemove?: () => Promise<void> | void;
  label?: string;
};

/** RN image picker for email / branding logos. */
export function LogoUploadDropzone({
  logoUrl,
  uploading = false,
  disabled = false,
  onUpload,
  onRemove,
  label = "Logo",
}: LogoUploadDropzoneProps) {
  const handlePick = async () => {
    if (disabled || uploading) return;
    try {
      const file = await pickImageFromLibrary({ allowsEditing: true, aspect: [1, 1] });
      if (!file) return;
      await onUpload(file);
    } catch (err) {
      Alert.alert("Upload failed", extractApiErrorMessage(err));
    }
  };

  return (
    <View style={styles.wrap}>
      <Typography variant="small" muted>
        {label}
      </Typography>
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.preview} resizeMode="contain" />
      ) : (
        <View style={styles.placeholder}>
          <Typography variant="small" muted>
            No logo uploaded
          </Typography>
        </View>
      )}
      <View style={styles.actions}>
        <Button size="compact" disabled={disabled || uploading} loading={uploading} onPress={() => void handlePick()}>
          {logoUrl ? "Replace" : "Upload"}
        </Button>
        {logoUrl && onRemove ? (
          <Button
            size="compact"
            variant="ghost"
            disabled={disabled || uploading}
            onPress={() => {
              void (async () => {
                try {
                  await onRemove();
                } catch (err) {
                  Alert.alert("Remove failed", extractApiErrorMessage(err));
                }
              })();
            }}
          >
            Remove
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  preview: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  placeholder: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  actions: { flexDirection: "row", gap: 8 },
});
