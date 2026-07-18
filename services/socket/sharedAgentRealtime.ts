/** One `forceNew` per auth token across agent `/chat` + `/notifications`. */
let lastAgentRealtimeToken: string | null = null;

export function consumeAgentRealtimeTokenChange(authToken: string): boolean {
  const token = authToken.trim();
  const changed = lastAgentRealtimeToken !== token;
  lastAgentRealtimeToken = token;
  return changed;
}

export function resetAgentRealtimeToken(): void {
  lastAgentRealtimeToken = null;
}
