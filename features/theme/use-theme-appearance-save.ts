import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { readPlatformThemeBackgroundColor } from "@/api/types/platform-theme.types";
import { useAppearance } from "@/lib/theme/appearance-context";
import { usePlatformThemeMeQuery, useUpdatePlatformThemeMutation } from "@/lib/hooks/query";
import {
  canonicalizeStoredBackgroundColor,
  persistBackgroundColorHex,
} from "@/lib/theme/theme-appearance.utils";

export function useThemeAppearanceSave(
  presetId: string,
  customAccentHex: string,
  customAccentEndHex: string,
) {
  const { applyAccountTheme } = useAppearance();
  const platformThemeQuery = usePlatformThemeMeQuery();
  const { mutate: savePlatformTheme, isPending: isSavingTheme } = useUpdatePlatformThemeMutation();

  const [syncedHex, setSyncedHex] = useState<string | null | undefined>(undefined);
  const hydratedFromServerRef = useRef(false);

  useEffect(() => {
    if (!platformThemeQuery.isFetched || hydratedFromServerRef.current) return;
    hydratedFromServerRef.current = true;

    if (platformThemeQuery.isError || !platformThemeQuery.data?.success) {
      setSyncedHex(null);
      return;
    }

    const bg = canonicalizeStoredBackgroundColor(
      readPlatformThemeBackgroundColor(platformThemeQuery.data),
    );
    setSyncedHex(bg);
    if (bg) applyAccountTheme(bg);
  }, [
    platformThemeQuery.isFetched,
    platformThemeQuery.isError,
    platformThemeQuery.data,
    applyAccountTheme,
  ]);

  const persistHex = useMemo(
    () => persistBackgroundColorHex(presetId, customAccentHex, customAccentEndHex),
    [presetId, customAccentHex, customAccentEndHex],
  );

  const normalizedPersistHex = useMemo(
    () => canonicalizeStoredBackgroundColor(persistHex) ?? persistHex,
    [persistHex],
  );

  const needsSave = useMemo(() => {
    if (syncedHex === undefined) return false;
    return (syncedHex ?? "").toLowerCase() !== normalizedPersistHex.toLowerCase();
  }, [syncedHex, normalizedPersistHex]);

  const handleSaveTheme = useCallback(() => {
    savePlatformTheme(
      { backgroundColor: normalizedPersistHex },
      {
        onSuccess: (env) => {
          if (!env.success) return;
          const bg = canonicalizeStoredBackgroundColor(readPlatformThemeBackgroundColor(env));
          setSyncedHex(bg);
          if (bg) applyAccountTheme(bg);
        },
      },
    );
  }, [normalizedPersistHex, savePlatformTheme, applyAccountTheme]);

  return {
    platformThemeQuery,
    syncedHex,
    needsSave,
    isSavingTheme,
    handleSaveTheme,
  };
}
