import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { safeLocalGet, safeLocalSet } from "@/lib/storage/safe-web-storage";

export const APPEARANCE_PRESET_STORAGE_KEY = "interchanges-appearance-preset";
export const APPEARANCE_CUSTOM_HEX_KEY = "interchanges-appearance-custom-hex";
export const APPEARANCE_CUSTOM_END_HEX_KEY = "interchanges-appearance-custom-end-hex";

export type StoredAppearance = {
  presetId: string | null;
  customHex: string | null;
  customEndHex: string | null;
};

async function readKey(key: string): Promise<string | null> {
  if (Platform.OS === "web") return safeLocalGet(key);
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeKey(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    safeLocalSet(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    /* ignore */
  }
}

export async function loadStoredAppearance(): Promise<StoredAppearance> {
  const [presetId, customHex, customEndHex] = await Promise.all([
    readKey(APPEARANCE_PRESET_STORAGE_KEY),
    readKey(APPEARANCE_CUSTOM_HEX_KEY),
    readKey(APPEARANCE_CUSTOM_END_HEX_KEY),
  ]);
  return { presetId, customHex, customEndHex };
}

export async function persistAppearancePresetId(id: string): Promise<void> {
  await writeKey(APPEARANCE_PRESET_STORAGE_KEY, id);
}

export async function persistCustomAccentHex(hex: string): Promise<void> {
  await writeKey(APPEARANCE_CUSTOM_HEX_KEY, hex);
}

export async function persistCustomAccentEndHex(hex: string): Promise<void> {
  await writeKey(APPEARANCE_CUSTOM_END_HEX_KEY, hex);
}
