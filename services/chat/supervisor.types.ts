export interface ChatUserRef {
  id: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface ChatWhisper {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  createdAt: string;
  fromUser?: ChatUserRef;
  toUser?: ChatUserRef;
}

export interface ChatTakeoverRequest {
  id: string;
  conversationId: string;
  requestedById: string;
  targetAgentId: string;
  status: string;
  note?: string | null;
  createdAt: string;
  requestedBy?: ChatUserRef;
  targetAgent?: ChatUserRef;
  respondedBy?: ChatUserRef | null;
}

export interface CreateWhisperBody {
  message: string;
}

export interface RequestTakeoverBody {
  targetAgentId?: string;
  note?: string;
}

export interface ChatWhisperSocketPayload {
  conversationId: string;
  whisper: ChatWhisper;
  agentMustClickSend: boolean;
}

export type RequestTakeoverResult =
  | {
      mode: "direct";
      supervisorControlUserId: string;
      agentId: string;
      agentReadOnly: boolean;
    }
  | {
      executed: boolean;
      request: ChatTakeoverRequest;
      transfer?: {
        conversationId: string;
        fromAgentId: string;
        toAgentId: string;
      };
    };
