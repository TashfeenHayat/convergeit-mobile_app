import { Typography } from "@/components/ui";
import type { ChatMessage } from "@/services/chat/chat.types";
import { resolveDashboardHref } from "../utils/resolve-dashboard-href";
import { ChatMessageAttachmentCard } from "./ChatMessageAttachmentCard";

function readHref(message: ChatMessage): string | null {
  const meta = message.metadata;
  if (!meta) return null;
  const attachment = meta.attachmentMetadata;
  if (attachment && typeof attachment === "object") {
    const path = (attachment as Record<string, unknown>).path;
    if (typeof path === "string" && path.trim()) return resolveDashboardHref(path.trim());
  }
  const href = meta.href;
  if (typeof href === "string" && href.trim()) return resolveDashboardHref(href.trim());
  if (attachment && typeof attachment === "object") {
    const nested = (attachment as Record<string, unknown>).href;
    if (typeof nested === "string" && nested.trim()) return resolveDashboardHref(nested.trim());
  }
  return null;
}

function readMessageType(message: ChatMessage): string | null {
  const mt = message.metadata?.messageType;
  return typeof mt === "string" ? mt : null;
}

function readLinkLabel(message: ChatMessage): string | null {
  const meta = message.metadata;
  if (!meta) return null;
  const label = meta.label;
  if (typeof label === "string" && label.trim()) return label.trim();
  const attachment = meta.attachmentMetadata;
  if (attachment && typeof attachment === "object") {
    const nested = (attachment as Record<string, unknown>).label;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }
  return null;
}

function readFormKind(message: ChatMessage): string | undefined {
  const attachment = message.metadata?.attachmentMetadata;
  if (attachment && typeof attachment === "object") {
    const kind = (attachment as Record<string, unknown>).formKind;
    if (typeof kind === "string") return kind;
  }
  return undefined;
}

function attachmentTitle(message: ChatMessage, messageType: string | null): string {
  const label = readLinkLabel(message);
  if (label) return label;
  if (messageType === "distribution_link") return "Open distribution form";
  if (messageType === "distribution_setup_required") return "Set up distribution";
  if (messageType === "close_form_link") return "Open distribution form";
  return "Open form";
}

function introLines(message: ChatMessage, href: string, linkLabel: string | null): string[] {
  return message.content
    .split("\n")
    .filter((line) => line.trim() && line.trim() !== href && line.trim() !== linkLabel && !line.trim().startsWith("http"));
}

/** Renders chat message body with form attachment cards for distribution / wrap-up links. */
export function ChatMessageContent({ message, textColor }: { message: ChatMessage; textColor?: string }) {
  const messageType = readMessageType(message);
  const href = readHref(message);
  const linkLabel = readLinkLabel(message);

  if (messageType === "distribution_setup_required") {
    const intro = introLines(message, href ?? "", linkLabel);
    return (
      <>
        {intro.map((line, i) => (
          <Typography key={`${line}-${i}`} variant="medium" color={textColor} style={{ marginBottom: line ? 4 : 0 }}>
            {line}
          </Typography>
        ))}
        {href ? (
          <ChatMessageAttachmentCard href={href} title={linkLabel ?? "Set up distribution"} subtitle="Publish email distribution for this website." formKind="setup" />
        ) : null}
      </>
    );
  }

  const legacyCloseHref =
    messageType === "close_form_link" && message.conversationId
      ? resolveDashboardHref(`/dashboard/chat-operations/distribution?conversationId=${encodeURIComponent(message.conversationId)}`)
      : null;
  const effectiveHref = href ?? legacyCloseHref;

  const isFormAttachment =
    effectiveHref &&
    (messageType === "distribution_link" || messageType === "close_form_link" || message.content.includes(effectiveHref));

  if (isFormAttachment && effectiveHref) {
    const intro = introLines(message, effectiveHref, linkLabel);
    const formKind =
      readFormKind(message) ??
      (messageType === "distribution_link" || messageType === "close_form_link" ? "distribution" : undefined);

    return (
      <>
        {intro.map((line, i) => (
          <Typography key={`${line}-${i}`} variant="medium" color={textColor} style={{ marginBottom: line ? 4 : 0 }}>
            {line}
          </Typography>
        ))}
        <ChatMessageAttachmentCard
          href={effectiveHref}
          title={attachmentTitle(message, messageType)}
          subtitle={formKind === "distribution" ? "Send the transcript to the selected department." : undefined}
          formKind={formKind}
        />
      </>
    );
  }

  return (
    <Typography variant="medium" color={textColor} style={{ lineHeight: 21 }}>
      {message.content}
    </Typography>
  );
}
