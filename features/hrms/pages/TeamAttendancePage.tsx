import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, InputField, StatusChip, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { HRMS } from "@/lib/permissions/permission-constants";
import {
  useDepartmentHeadsAttendanceQuery,
  usePoolHeadsAttendanceQuery,
} from "@/lib/hooks/query/hrms";
import { isRecord, pickStr } from "@/lib/utils/core";
import { pickApiItems } from "@/lib/utils/admin-list";
import { useAppTheme } from "@/theme";

type AttendanceRow = {
  id: string;
  name: string;
  status: string;
  checkIn: string;
  checkOut: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseRows(data: unknown): AttendanceRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r, index) => {
      const user = isRecord(r.user) ? r.user : null;
      const id =
        pickStr(r, ["id", "userId"]) ||
        pickStr(user, ["id"]) ||
        `row-${index}`;
      const first = pickStr(user, ["firstName"]) || pickStr(r, ["firstName", "memberName", "name"]);
      const last = pickStr(user, ["lastName"]) || pickStr(r, ["lastName"]);
      const name = [first, last].filter(Boolean).join(" ") || pickStr(r, ["email"]) || "—";
      return {
        id,
        name,
        status: pickStr(r, ["status", "attendanceStatus"]) || "—",
        checkIn: pickStr(r, ["checkIn", "checkInAt", "check_in"]) || "—",
        checkOut: pickStr(r, ["checkOut", "checkOutAt", "check_out"]) || "—",
      };
    });
}

/** Team attendance for pool heads / department heads. */
export function TeamAttendancePage() {
  const theme = useAppTheme();
  const { hasOperational, user } = useAuth();
  const canView = hasOperational(HRMS.ATTENDANCE_VIEW);
  const [date, setDate] = useState(todayIso());
  const isPoolHead = user?.isPoolHead === true;

  const poolQuery = usePoolHeadsAttendanceQuery(
    { date: date.trim() || todayIso(), all: true, page: 1, limit: 50 },
    { enabled: canView && isPoolHead, scope: "team-attendance" },
  );
  const deptQuery = useDepartmentHeadsAttendanceQuery(
    { date: date.trim() || todayIso(), all: true, page: 1, limit: 50 },
    { enabled: canView && !isPoolHead, scope: "team-attendance" },
  );

  const query = isPoolHead ? poolQuery : deptQuery;
  const rows = useMemo(() => parseRows(query.data), [query.data]);

  if (!canView) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You need team attendance permission to view this page.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">Team attendance</Typography>
        <Typography variant="medium" muted>
          {isPoolHead
            ? "Attendance for pool members in pools you manage."
            : "Attendance for heads in your department / company scope."}
        </Typography>
        <InputField
          label="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          placeholder={todayIso()}
          autoCapitalize="none"
        />
        <Button size="compact" variant="outlined" onPress={() => setDate(todayIso())}>
          Today
        </Button>
      </View>

      {query.isLoading && !query.data ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : query.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(query.error, "Could not load team attendance.")}
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isLoading}
              onRefresh={() => void query.refetch()}
              tintColor={theme.app.dashboard.accentBlue}
            />
          }
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                No attendance records for this date.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard style={{ gap: 6 }}>
              <View style={styles.rowBetween}>
                <Typography variant="medium16" style={{ flex: 1, fontWeight: "600" }}>
                  {item.name}
                </Typography>
                <StatusChip label={item.status} tone="neutral" />
              </View>
              <Typography variant="small" muted>
                In: {item.checkIn} · Out: {item.checkOut}
              </Typography>
            </AppCard>
          )}
        />
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", gap: 8 },
});
