import type { AgentAttendanceActivity } from '@/services/chat/agent-chat-session.api';
import { safeSessionGet, safeSessionRemove, safeSessionSet } from '@/lib/storage/safe-web-storage';

export type AgentChatSessionState = {
  status: 'paused' | 'active';
  /** When false, agent is not eligible for new assignments or chat alerts. */
  acceptingChats: boolean;
  busy?: boolean;
  attendanceActivity?: AgentAttendanceActivity | null;
};

const STORAGE_KEY = 'converge:agent-chat-session:v1';

const DEFAULT_STATE: AgentChatSessionState = {
  status: 'paused',
  acceptingChats: false,
  busy: false,
  attendanceActivity: null,
};

type Listener = (state: AgentChatSessionState) => void;

let state: AgentChatSessionState = readStoredState();
const listeners = new Set<Listener>();

function readStoredState(): AgentChatSessionState {
  try {
    const raw = safeSessionGet(STORAGE_KEY);
    if (raw === 'active') {
      return { status: 'active', acceptingChats: true, busy: false, attendanceActivity: null };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_STATE;
}

function writeStoredStatus(status: AgentChatSessionState['status']): void {
  try {
    safeSessionSet(STORAGE_KEY, status);
  } catch {
    /* ignore */
  }
}

function emit(next: AgentChatSessionState): void {
  state = next;
  for (const listener of listeners) listener(state);
}

export function getAgentChatSessionState(): AgentChatSessionState {
  return state;
}

export function isAgentChatSessionAccepting(): boolean {
  return state.acceptingChats && state.status === 'active';
}

export function subscribeAgentChatSession(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function setAgentChatSessionBusy(busy: boolean): void {
  if (state.busy === busy) return;
  emit({ ...state, busy });
}

export function publishAgentChatSessionPaused(
  attendanceActivity?: AgentAttendanceActivity | null,
): void {
  writeStoredStatus('paused');
  emit({
    status: 'paused',
    acceptingChats: false,
    busy: false,
    attendanceActivity: attendanceActivity ?? state.attendanceActivity ?? null,
  });
}

export function publishAgentChatSessionActive(
  attendanceActivity?: AgentAttendanceActivity | null,
): void {
  writeStoredStatus('active');
  emit({
    status: 'active',
    acceptingChats: true,
    busy: false,
    attendanceActivity: attendanceActivity ?? state.attendanceActivity ?? null,
  });
}

export function publishAgentChatSessionAttendance(
  attendanceActivity: AgentAttendanceActivity | null | undefined,
): void {
  emit({ ...state, attendanceActivity: attendanceActivity ?? null });
}

export function resetAgentChatSession(): void {
  try {
    safeSessionRemove(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  emit(DEFAULT_STATE);
}
