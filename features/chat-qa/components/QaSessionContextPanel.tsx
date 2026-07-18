import { View } from "react-native";
import { Typography } from "@/components/ui";
import type { QaReviewBundle } from "@/services/chat/qa.types";
import { formatTs, qaUserDisplay } from "../utils/qa-user-display";
import { chatQaStyles } from "../styles/chat-qa.styles";

interface QaSessionContextPanelProps {
  bundle: QaReviewBundle | null;
}

export function QaSessionContextPanel({ bundle }: QaSessionContextPanelProps) {
  const summary = bundle?.sessionSummary ?? null;
  const metrics = bundle?.responseMetrics ?? null;

  if (!bundle) return null;

  return (
    <View style={chatQaStyles.contextPanel}>
      <Typography variant="medium" style={{ fontWeight: "700" }}>
        Session context
      </Typography>
      {summary?.startedAt ? (
        <Typography variant="small" muted>
          Started {formatTs(summary.startedAt)}
          {summary.endedAt ? ` · Ended ${formatTs(summary.endedAt)}` : ""}
        </Typography>
      ) : null}
      {summary?.primaryAgent ? (
        <Typography variant="small" muted>
          Primary agent: {qaUserDisplay(summary.primaryAgent)}
        </Typography>
      ) : null}
      {metrics ? (
        <Typography variant="small" muted>
          Slow replies: {metrics.slowReplyCount} · Agent replies: {metrics.agentReplyCount}
        </Typography>
      ) : null}
    </View>
  );
}
