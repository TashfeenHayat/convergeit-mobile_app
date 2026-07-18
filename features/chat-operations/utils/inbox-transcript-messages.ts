import { sortMessagesChronologically } from "@/lib/hooks/chat/agent-chat.utils";
import type { ChatMessage } from "@/services/chat/chat.types";
import { resolveDashboardHref } from "./resolve-dashboard-href";

function readMessageType(message: ChatMessage): string | null {
  const mt = message.metadata?.messageType;
  return typeof mt === "string" ? mt : null;
}

/** Post-close agent-only lines — pinned to transcript bottom. */
export function isInboxFormLinkMessage(message: ChatMessage): boolean {
  const type = readMessageType(message);
  return type === "close_form_link" || type === "distribution_link" || type === "distribution_setup_required";
}

function remapCloseFormToDistribution(message: ChatMessage, distributionFormHref: string): ChatMessage {
  const href = resolveDashboardHref(distributionFormHref.trim());
  const intro = "Chat closed. Open the distribution form to send the transcript to a department.";
  return {
    ...message,
    content: intro,
    metadata: {
      ...(message.metadata ?? {}),
      messageType: "distribution_link",
      href,
      label: "Open distribution form",
      attachmentMetadata: {
        ...(typeof message.metadata?.attachmentMetadata === "object"
          ? (message.metadata.attachmentMetadata as Record<string, unknown>)
          : {}),
        href,
        formKind: "distribution",
      },
    },
  };
}

function pinFormLinksToEnd(messages: ChatMessage[]): ChatMessage[] {
  const body: ChatMessage[] = [];
  const formLinks: ChatMessage[] = [];
  for (const message of messages) {
    if (isInboxFormLinkMessage(message)) {
      formLinks.push(message);
    } else {
      body.push(message);
    }
  }
  return [...body, ...formLinks];
}

export type InboxTranscriptDisplayOptions = {
  /** Website uses email distribution — show distribution form, not legacy wrap-up. */
  requiresDistributionForm?: boolean;
  distributionFormHref?: string | null;
  /** Hide post-close form cards while the conversation is live again. */
  hidePostCloseForms?: boolean;
};

export function prepareInboxTranscriptMessages(
  messages: ChatMessage[],
  opts?: InboxTranscriptDisplayOptions,
): ChatMessage[] {
  let list = sortMessagesChronologically(messages);

  if (opts?.hidePostCloseForms) {
    list = list.filter((message) => {
      if (isInboxFormLinkMessage(message)) return false;
      const type = readMessageType(message);
      if (type === "policy_close" || type === "policy_nudge" || type === "policy_fallback") {
        return false;
      }
      return true;
    });
    return list;
  }

  const wantsDistribution = opts?.requiresDistributionForm === true;
  const distributionHref = opts?.distributionFormHref?.trim() ?? "";
  const hasDistribution = list.some((m) => readMessageType(m) === "distribution_link");

  if (wantsDistribution || hasDistribution) {
    list = list.flatMap((message) => {
      const type = readMessageType(message);
      if (type === "close_form_link") {
        if (hasDistribution) return [];
        if (wantsDistribution && distributionHref) {
          return [remapCloseFormToDistribution(message, distributionHref)];
        }
        return [];
      }
      return [message];
    });
  } else {
    list = list.flatMap((message) => {
      const type = readMessageType(message);
      if (type === "close_form_link") {
        const href = distributionFormHrefFromMessages(messages);
        if (href) {
          return [remapCloseFormToDistribution(message, href)];
        }
        return [];
      }
      return [message];
    });
  }

  return pinFormLinksToEnd(list);
}

/** @deprecated Use prepareInboxTranscriptMessages */
export function sortMessagesForInboxTranscript(messages: ChatMessage[]): ChatMessage[] {
  return prepareInboxTranscriptMessages(messages);
}

export function transcriptHasCloseFormLink(messages: ChatMessage[]): boolean {
  return messages.some((m) => readMessageType(m) === "close_form_link");
}

export function transcriptHasDistributionFormLink(messages: ChatMessage[]): boolean {
  return messages.some((m) => readMessageType(m) === "distribution_link");
}

function readFormHref(message: ChatMessage): string | null {
  const meta = message.metadata;
  if (!meta || typeof meta !== "object") return null;
  const att = meta.attachmentMetadata;
  if (att && typeof att === "object") {
    const path = (att as { path?: unknown }).path;
    if (typeof path === "string" && path.trim()) {
      return resolveDashboardHref(path.trim());
    }
  }
  const direct = meta.href;
  if (typeof direct === "string" && direct.trim()) {
    return resolveDashboardHref(direct.trim());
  }
  if (att && typeof att === "object" && typeof (att as { href?: unknown }).href === "string") {
    const href = (att as { href: string }).href.trim();
    return href ? resolveDashboardHref(href) : null;
  }
  return null;
}

export function distributionFormHrefFromMessages(messages: ChatMessage[]): string | null {
  for (const message of messages) {
    if (readMessageType(message) === "distribution_link") {
      const href = readFormHref(message);
      if (href) return href;
    }
  }
  return null;
}

export function inboxTranscriptDisplayForClosed(messages: ChatMessage[]): InboxTranscriptDisplayOptions | undefined {
  const hasDistribution = transcriptHasDistributionFormLink(messages);
  if (!hasDistribution) return undefined;
  return {
    requiresDistributionForm: true,
    distributionFormHref: distributionFormHrefFromMessages(messages),
  };
}
