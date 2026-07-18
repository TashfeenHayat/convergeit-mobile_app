import { Linking, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { VisitorLocation } from "../utils/visitor-info";

interface VisitorLocationMapProps {
  location: VisitorLocation | null;
}

function buildExternalMapHref(location: VisitorLocation): string {
  const { latitude, longitude, label } = location;
  if (latitude != null && longitude != null) {
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=12/${latitude}/${longitude}`;
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(label)}`;
}

export function VisitorLocationMap({ location }: VisitorLocationMapProps) {
  if (!location?.label && location?.latitude == null) {
    return (
      <View style={styles.emptyBox}>
        <Typography variant="small" muted>
          Location unavailable for this session
        </Typography>
      </View>
    );
  }

  const externalHref = buildExternalMapHref(location);
  const coordsLabel =
    location.latitude != null && location.longitude != null
      ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
      : null;

  return (
    <View>
      <View style={styles.headerRow}>
        <Ionicons name="location" size={18} color={tokens.colors.accentBlue} />
        <Typography variant="medium" style={{ fontWeight: "600" }}>
          {location.label}
        </Typography>
      </View>

      {coordsLabel ? (
        <Typography variant="small" muted style={{ marginTop: 2 }}>
          {coordsLabel}
        </Typography>
      ) : null}

      <Pressable
        onPress={() => Linking.openURL(externalHref).catch(() => undefined)}
        style={styles.mapLink}
        accessibilityRole="link"
      >
        <Typography variant="small" color={tokens.colors.accentBlue} style={{ fontWeight: "600" }}>
          Open in maps
        </Typography>
        <Ionicons name="open-outline" size={14} color={tokens.colors.accentBlue} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyBox: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: tokens.colors.cardBorder,
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mapLink: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
  },
});
