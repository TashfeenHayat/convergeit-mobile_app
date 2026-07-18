import { useState } from "react";
import { View } from "react-native";
import { Button, FormModal, InputField, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useReplaceWebsiteCannedMutation, useWebsiteCannedQuery } from "../hooks/useCannedResponses";

interface CannedMessagesModalProps {
  open: boolean;
  websiteId: string;
  websiteLabel?: string;
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (e: unknown) => void;
}

export function CannedMessagesModal({
  open,
  websiteId,
  websiteLabel,
  canEdit,
  onClose,
  onSaved,
  onError,
}: CannedMessagesModalProps) {
  const query = useWebsiteCannedQuery(websiteId, open && Boolean(websiteId));
  const saveMutation = useReplaceWebsiteCannedMutation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const first = query.data?.items?.[0];

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Canned messages"
      description={websiteLabel || websiteId || "Website"}
      primaryButtonLabel={saveMutation.isPending ? "Saving…" : "Save"}
      primaryButtonDisabled={!canEdit || !websiteId.trim() || saveMutation.isPending}
      onSave={() => {
        saveMutation.mutate(
          {
            websiteId,
            body: { items: [{ title: title.trim() || "Quick reply", body: body.trim(), sortOrder: 0 }] },
          },
          { onSuccess: onSaved, onError },
        );
      }}
    >
      {!websiteId ? (
        <Typography variant="small" muted>
          Pick a website from the list first.
        </Typography>
      ) : query.isLoading ? (
        <Typography variant="small" muted>
          Loading…
        </Typography>
      ) : (
        <View style={{ gap: tokens.space.md }}>
          {first ? (
            <Button
              variant="secondary"
              size="compact"
              onPress={() => {
                setTitle(first.title);
                setBody(first.body);
              }}
            >
              Load existing message
            </Button>
          ) : null}
          <InputField label="Title" value={title} onChangeText={setTitle} editable={canEdit} />
          <InputField label="Message" value={body} onChangeText={setBody} multiline editable={canEdit} />
        </View>
      )}
    </FormModal>
  );
}
