/** View permissions required when dependent page/action grants are selected. */

export const VIEW_PERMISSION_DEPENDENCY_RULES: ReadonlyArray<{
  required: string;
  triggers: readonly string[];
}> = [
  {
    required: "company:view",
    triggers: [
      "page:clients",
      "company:create",
      "company:update",
      "company:delete",
      "company:manage",
    ],
  },
  {
    required: "user:view",
    triggers: [
      "page:users",
      "user:create",
      "user:update",
      "user:delete",
      "user:assign",
      "user:login-as",
    ],
  },
  {
    required: "website-assignment:view",
    triggers: [
      "page:website-assignments",
      "website-assignment:create",
      "website-assignment:update",
      "website-assignment:delete",
      "website:assign",
    ],
  },
  {
    required: "report:view",
    triggers: ["page:reports", "page:reports-configuration", "page:billing"],
  },
  {
    required: "chat:report:view",
    triggers: [
      "page:chat-reports",
      "page:chat-website-analytics",
      "page:chat-qa-team-reports",
    ],
  },
  {
    required: "chat:settings:view",
    triggers: ["chat:settings:manage", "page:chat-close-policy"],
  },
  {
    required: "smtp-email:view",
    triggers: [
      "page:smtp-email-reseller",
      "page:smtp-email-platform",
      "page:smtp-email-assignment",
      "smtp-email:create",
      "smtp-email:update",
      "smtp-email:delete",
      "smtp-email:test",
    ],
  },
  {
    required: "email-template:view",
    triggers: [
      "page:email-template-design",
      "page:email-template-platform",
      "page:email-template-forms",
      "email-template:create",
      "email-template:update",
      "email-template:delete",
      "email-template:publish",
    ],
  },
];

export function resolveMissingViewDependencies(selectedCodes: Iterable<string>): string[] {
  const selected = new Set(selectedCodes);
  const missing = new Set<string>();
  for (const rule of VIEW_PERMISSION_DEPENDENCY_RULES) {
    const triggered = rule.triggers.some((code) => selected.has(code));
    if (!triggered) continue;
    if (!selected.has(rule.required)) missing.add(rule.required);
  }
  return [...missing].sort((a, b) => a.localeCompare(b));
}

export function ensureRequiredViewPermissions(permissionNames: readonly string[]): {
  permissionNames: string[];
  added: string[];
} {
  const next = new Set(permissionNames);
  const added: string[] = [];
  for (const required of resolveMissingViewDependencies(next)) {
    if (!next.has(required)) {
      next.add(required);
      added.push(required);
    }
  }
  return {
    permissionNames: [...next].sort((a, b) => a.localeCompare(b)),
    added,
  };
}
