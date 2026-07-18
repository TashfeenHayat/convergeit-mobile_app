import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

/** RN multipart-friendly file descriptor (also works with web Blob/File via uri). */
export type UploadableFile = {
  uri: string;
  name: string;
  mimeType: string;
};

export type PickImageOptions = {
  allowsEditing?: boolean;
  quality?: number;
  /** Max width for editing crop; optional */
  aspect?: [number, number];
};

/**
 * Append a local image/document to FormData for React Native axios uploads.
 * On web, falls back to fetching the uri into a Blob when possible.
 */
export function appendUploadableFile(
  form: FormData,
  fieldName: string,
  file: UploadableFile,
): void {
  if (Platform.OS === "web") {
    // Expo web / browsers expect a Blob or File
    form.append(fieldName, {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);
    return;
  }
  form.append(fieldName, {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);
}

function guessName(uri: string, mimeType: string): string {
  const fromUri = uri.split("/").pop()?.split("?")[0];
  if (fromUri && fromUri.includes(".")) return fromUri;
  const ext = mimeType.includes("png")
    ? "png"
    : mimeType.includes("webp")
      ? "webp"
      : mimeType.includes("gif")
        ? "gif"
        : "jpg";
  return `upload.${ext}`;
}

/** Launch image library and return an uploadable asset, or null if cancelled. */
export async function pickImageFromLibrary(
  options: PickImageOptions = {},
): Promise<UploadableFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to upload images.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: options.allowsEditing ?? true,
    quality: options.quality ?? 0.85,
    aspect: options.aspect,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? "image/jpeg";
  return {
    uri: asset.uri,
    name: asset.fileName ?? guessName(asset.uri, mimeType),
    mimeType,
  };
}

/** Launch camera and return an uploadable asset, or null if cancelled. */
export async function pickImageFromCamera(
  options: PickImageOptions = {},
): Promise<UploadableFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Camera permission is required to take a photo.");
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: options.allowsEditing ?? true,
    quality: options.quality ?? 0.85,
    aspect: options.aspect,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? "image/jpeg";
  return {
    uri: asset.uri,
    name: asset.fileName ?? guessName(asset.uri, mimeType),
    mimeType,
  };
}
