# ConvergeIT Mobile

Official mobile app for **ConvergeIT** — built with Expo (React Native) for Android and iOS.

| | |
|---|---|
| **Platform** | Android · iOS (Expo Go / native builds) |
| **Stack** | Expo SDK 54 · React Native 0.81 · Expo Router · TypeScript |
| **Package** | `com.convergeit.mobile` |

---

## Features

- Authentication and secure session storage
- Dashboard and core product workflows
- Real-time chat (Socket.IO)
- Deep links and embed / pay / rate flows
- Dark-first UI aligned with ConvergeIT branding

---

## Prerequisites

- Node.js 20+ (recommended)
- npm
- [Expo Go](https://expo.dev/go) on your phone (SDK 54), **or** Android Studio / Xcode for simulators

---

## Quick start

```bash
npm install
cp .env.example .env
# Edit .env with your API URLs

npm start
```

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo (Expo Go) |
| `npm run android` | Open on Android |
| `npm run ios` | Open on iOS (macOS) |
| `npm run start:tunnel` | Tunnel mode (different networks / firewalls) |
| `npm run doctor` | Expo environment health check |

---

## Environment

Only variables prefixed with `EXPO_PUBLIC_` are available in the app.

See `.env.example`:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.convergeit.app
EXPO_PUBLIC_CHAT_SOCKET_BASE_URL=https://api.convergeit.app
EXPO_PUBLIC_CHAT_SOCKET_NAMESPACE=/chat
EXPO_PUBLIC_WIDGET_EMBED_ORIGIN=http://localhost:3003
EXPO_PUBLIC_APP_URL=https://app.convergeit.app
```

`.env` is gitignored — never commit secrets.

Optional sync from the web frontend:

```bash
npm run sync:env
```

---

## Project structure

```
├── app/            # Expo Router screens & layouts
├── components/     # Shared UI components
├── features/       # Feature modules
├── services/       # API & socket clients
├── lib/            # Shared utilities
├── theme/          # Design tokens
├── assets/         # Images & icons
└── scripts/        # Sync & tooling scripts
```

---

## Scripts

```bash
npm run typecheck      # TypeScript
npm run lint           # ESLint
npm run ci             # typecheck + lint
npm run export:android
npm run export:ios
npm run storybook      # On-device Storybook
```

---

## App identifiers

- **Android:** `com.convergeit.mobile`
- **iOS:** `com.convergeit.mobile`
- **URL scheme:** `convergeit`

---

## License

Private — ConvergeIT. All rights reserved.
