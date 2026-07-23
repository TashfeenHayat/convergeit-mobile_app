import { FlatList, StyleSheet, View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

type BucketRow = {
  label: string;
  conversationCount: number;
  avgQaScore?: number | null;
};

type Props = {
  title: string;
  rows: BucketRow[];
  emptyLabel?: string;
};

export function ReportBucketTable({ title, rows, emptyLabel = "No data" }: Props) {
  return (
    <View style={styles.wrap}>
      <Typography variant="medium" style={{ fontWeight: "700", marginBottom: tokens.space.sm }}>
        {title}
      </Typography>
      {rows.length === 0 ? (
        <Typography variant="small" muted>
          {emptyLabel}
        </Typography>
      ) : (
        <FlatList
          data={rows}
          scrollEnabled={false}
          keyExtractor={(row, i) => `${row.label}-${i}`}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Typography variant="medium" style={{ flex: 1 }} numberOfLines={1}>
                {item.label}
              </Typography>
              <Typography variant="small" muted>
                {item.conversationCount} chats
                {item.avgQaScore != null ? ` · QA ${item.avgQaScore}` : ""}
              </Typography>
            </View>
          )}
  showsVerticalScrollIndicator={false}/>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    paddingVertical: tokens.space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
  },
});
