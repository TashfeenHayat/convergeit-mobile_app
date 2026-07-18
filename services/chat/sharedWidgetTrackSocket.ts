import { createChatSocketClient, type ChatSocketClient } from "./chatSocket";

let sharedWidgetTrackSocket: ChatSocketClient | null = null;
let connectedWidgetToken: string | null = null;

/** Lightweight widget socket for analytics acks (page_view, widget_open). */
export async function ensureWidgetTrackSocket(
  widgetSessionToken: string,
): Promise<ChatSocketClient | null> {
  const token = widgetSessionToken.trim();
  if (!token) return null;

  if (!sharedWidgetTrackSocket) {
    sharedWidgetTrackSocket = createChatSocketClient();
  }

  const forceNew = connectedWidgetToken !== token;
  connectedWidgetToken = token;
  sharedWidgetTrackSocket.connect({ authToken: token, forceNew });

  try {
    const ready = await sharedWidgetTrackSocket.waitUntilSocketReady(10_000);
    return ready && sharedWidgetTrackSocket.isConnected() ? sharedWidgetTrackSocket : null;
  } catch {
    return null;
  }
}
