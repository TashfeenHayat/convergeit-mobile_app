/**
 * Public env for ConvergeIT mobile — mirrors web NEXT_PUBLIC_* from
 * converge_saas_frontend (.env / .env.example), with EXPO_PUBLIC_ prefix.
 */
function read(name: string, fallback = ''): string {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export const env = {
  apiBaseUrl: read('EXPO_PUBLIC_API_BASE_URL', 'https://api.convergeit.app'),
  chatSocketBaseUrl: read(
    'EXPO_PUBLIC_CHAT_SOCKET_BASE_URL',
    read('EXPO_PUBLIC_API_BASE_URL', 'https://api.convergeit.app')
  ),
  chatSocketNamespace: read('EXPO_PUBLIC_CHAT_SOCKET_NAMESPACE', '/chat'),
  widgetEmbedOrigin: read('EXPO_PUBLIC_WIDGET_EMBED_ORIGIN', ''),
  appUrl: read('EXPO_PUBLIC_APP_URL', ''),
  notificationsSocketBaseUrl: read('EXPO_PUBLIC_NOTIFICATIONS_SOCKET_BASE_URL', ''),
  notificationsSocketNamespace: read(
    'EXPO_PUBLIC_NOTIFICATIONS_SOCKET_NAMESPACE',
    '/notifications'
  ),
} as const;

export type AppEnv = typeof env;
