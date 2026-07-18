/**
 * Sync EXPO_PUBLIC_* .env from converge_saas_frontend NEXT_PUBLIC_* .env.
 *
 * Usage:
 *   node scripts/sync-env-from-web.mjs
 *   node scripts/sync-env-from-web.mjs --web "D:\\convergeitSaas\\converge_saas_frontend"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const webFlag = args.indexOf("--web");
const defaultCandidates = [
  path.resolve(root, "..", "converge_saas_frontend"),
  path.resolve("D:", "convergeitSaas", "converge_saas_frontend"),
];

const webRoot =
  webFlag >= 0 && args[webFlag + 1]
    ? path.resolve(args[webFlag + 1])
    : defaultCandidates.find((p) => fs.existsSync(p));

if (!webRoot) {
  console.error("Web frontend folder not found. Pass --web <path>.");
  process.exit(1);
}

const map = {
  NEXT_PUBLIC_API_BASE_URL: "EXPO_PUBLIC_API_BASE_URL",
  NEXT_PUBLIC_CHAT_SOCKET_BASE_URL: "EXPO_PUBLIC_CHAT_SOCKET_BASE_URL",
  NEXT_PUBLIC_SOCKET_URL: "EXPO_PUBLIC_CHAT_SOCKET_BASE_URL",
  NEXT_PUBLIC_CHAT_SOCKET_NAMESPACE: "EXPO_PUBLIC_CHAT_SOCKET_NAMESPACE",
  NEXT_PUBLIC_WIDGET_EMBED_ORIGIN: "EXPO_PUBLIC_WIDGET_EMBED_ORIGIN",
  NEXT_PUBLIC_APP_URL: "EXPO_PUBLIC_APP_URL",
  NEXT_PUBLIC_NOTIFICATIONS_SOCKET_BASE_URL:
    "EXPO_PUBLIC_NOTIFICATIONS_SOCKET_BASE_URL",
  NEXT_PUBLIC_NOTIFICATIONS_SOCKET_NAMESPACE:
    "EXPO_PUBLIC_NOTIFICATIONS_SOCKET_NAMESPACE",
};

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    out[key] = value;
  }
  return out;
}

const merged = {
  ...parseEnv(path.join(webRoot, ".env.example")),
  ...parseEnv(path.join(webRoot, ".env")),
  ...parseEnv(path.join(webRoot, ".env.local")),
};

const lines = [
  "# Auto-synced from web frontend. Do not commit.",
  `# Source: ${webRoot}`,
  `# Generated: ${new Date().toISOString()}`,
  "",
];

for (const [nextKey, expoKey] of Object.entries(map)) {
  if (merged[nextKey] != null && merged[nextKey] !== "") {
    lines.push(`${expoKey}=${merged[nextKey]}`);
  }
}

const dest = path.join(root, ".env");
fs.writeFileSync(dest, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${dest} from ${webRoot}`);
