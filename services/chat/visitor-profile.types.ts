import type { AgentVisitorPresentation } from "./chat.types";

export type VisitorProfileField = "name" | "email" | "phone";

export interface PatchVisitorProfileBody {
  field: VisitorProfileField;
  value: string;
  sourceMessageId?: string;
  sourceText?: string;
  confirmOverwrite?: boolean;
}

export interface PatchVisitorProfileResult {
  visitorId: string;
  conversationId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  visitorProfileComplete: boolean;
  visitorPresentation: AgentVisitorPresentation;
}

export class VisitorProfileConflictError extends Error {
  readonly code = "VISITOR_FIELD_ALREADY_SET";

  constructor(
    message: string,
    readonly field: VisitorProfileField,
    readonly currentValue: string,
  ) {
    super(message);
    this.name = "VisitorProfileConflictError";
  }
}
