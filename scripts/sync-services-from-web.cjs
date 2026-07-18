/**
 * Sync converge_saas_frontend/services → mobile/services (skip *.test.ts),
 * then patch Expo env wiring for chat/notifications sockets.
 *
 * Usage: node scripts/sync-services-from-web.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "..", "converge_saas_frontend", "services");
const DST = path.join(ROOT, "services");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyTree() {
  if (!fs.existsSync(SRC)) {
    throw new Error(`Web services not found: ${SRC}`);
  }
  fs.rmSync(DST, { recursive: true, force: true });
  ensureDir(DST);
  const files = walk(SRC);
  for (const file of files) {
    const rel = path.relative(SRC, file);
    const dest = path.join(DST, rel);
    ensureDir(path.dirname(dest));
    fs.copyFileSync(file, dest);
  }
  return files.length;
}

function patchFile(rel, transform) {
  const file = path.join(DST, rel);
  if (!fs.existsSync(file)) return false;
  const before = fs.readFileSync(file, "utf8");
  const after = transform(before);
  if (after !== before) fs.writeFileSync(file, after, "utf8");
  return after !== before;
}

function applyRnPatches() {
  patchFile("chat/chatSocket.ts", (src) => {
    let out = src;
    if (!out.includes('from "@/constants/env"')) {
      out = out.replace(
        'import type { Socket } from "socket.io-client";\n',
        'import type { Socket } from "socket.io-client";\nimport { env } from "@/constants/env";\n',
      );
    }
    out = out.replace(
      /const chatSocketEndpoint = resolveSocketEndpoint\(\{[\s\S]*?defaultNamespace: "\/chat",\n\}\);/,
      `const chatSocketEndpoint = resolveSocketEndpoint({
  envBaseUrl: env.chatSocketBaseUrl,
  envFallbackBaseUrl: env.apiBaseUrl,
  envNamespace: env.chatSocketNamespace,
  defaultNamespace: "/chat",
});`,
    );
    return out;
  });

  patchFile("notifications/notificationsSocket.ts", (src) => {
    let out = src;
    if (!out.includes('from "@/constants/env"')) {
      out = out.replace(
        'import { consumeAgentRealtimeTokenChange, resetAgentRealtimeToken } from "@/services/socket/sharedAgentRealtime";\n',
        'import { env } from "@/constants/env";\nimport { consumeAgentRealtimeTokenChange, resetAgentRealtimeToken } from "@/services/socket/sharedAgentRealtime";\n',
      );
    }
    out = out.replace(
      /const notificationsSocketEndpoint = resolveSocketEndpoint\(\{[\s\S]*?defaultNamespace: "\/notifications",\n\}\);/,
      `const notificationsSocketEndpoint = resolveSocketEndpoint({
  envBaseUrl: env.notificationsSocketBaseUrl || undefined,
  envFallbackBaseUrl: env.apiBaseUrl,
  envNamespace: env.notificationsSocketNamespace,
  defaultNamespace: "/notifications",
});`,
    );
    return out;
  });

  patchFile("socket/socketCommon.ts", (src) =>
    src
      .replace(/NEXT_PUBLIC_\*_SOCKET_BASE_URL/g, "EXPO_PUBLIC_*_SOCKET_BASE_URL")
      .replace(/NEXT_PUBLIC_API_BASE_URL/g, "EXPO_PUBLIC_API_BASE_URL")
      .replace(
        "Socket base URL is missing. Set NEXT_PUBLIC_CHAT_SOCKET_BASE_URL in .env.local.",
        "Socket base URL is missing. Set EXPO_PUBLIC_CHAT_SOCKET_BASE_URL (or EXPO_PUBLIC_API_BASE_URL).",
      ),
  );

  patchFile("chat/sharedAgentChatSocket.ts", (src) =>
    src.replace(
      "per browser tab for agent",
      "per app process for agent",
    ),
  );
}

const count = copyTree();
applyRnPatches();
console.log(`Synced ${count} service files → mobile/services (Expo env patched).`);
