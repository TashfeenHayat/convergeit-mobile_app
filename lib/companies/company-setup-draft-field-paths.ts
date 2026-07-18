/** Matches backend paths like `childrenDraft.children.0.pocInvite.pocEmail`. */
export function childrenDraftFieldPath(childIndex: number, relativePath: string): string {
  return `childrenDraft.children.${childIndex}.${relativePath}`;
}

/**
 * Strip accidental `pocInvite.` / `pocInvites.N.` prefix so callers can pass either
 * `firstName` or `pocInvite.firstName` without double-prefixing Nest paths.
 */
export function barePocInviteField(relativePath: string): string {
  return relativePath
    .replace(/^pocInvite\./, "")
    .replace(/^pocInvites\.\d+\./, "");
}

/** API path for a POC field on a child draft row (`pocInvite` or `pocInvites[n]`). */
export function childrenDraftPocFieldPath(
  childIndex: number,
  pocIndex: number,
  relativePath: string,
  multiPoc: boolean,
): string {
  const bare = barePocInviteField(relativePath);
  if (!multiPoc && pocIndex === 0) {
    return childrenDraftFieldPath(childIndex, `pocInvite.${bare}`);
  }
  return childrenDraftFieldPath(childIndex, `pocInvites.${pocIndex}.${bare}`);
}

/** PATCH `/companies/:id` nested POC invite path (`pocs.0.pocInvite.firstName`). */
export function childCompanyPatchPocFieldPath(pocIndex: number, relativePath: string): string {
  return `pocs.${pocIndex}.pocInvite.${barePocInviteField(relativePath)}`;
}

/** Normalize `form.` prefix and `children[0]` → `children.0` for comparisons. */
export function normalizeApiFieldPath(path: string): string {
  return path.replace(/\[(\d+)\]/g, ".$1").replace(/^form\./, "");
}

/**
 * Resolves message for a field path even when API uses `form.` or bracket indices.
 */
export function getCompanySetupFieldError(
  errors: Record<string, string>,
  exactPath: string,
): string {
  const want = normalizeApiFieldPath(exactPath);
  if (errors[exactPath]?.trim()) return errors[exactPath].trim();
  for (const [k, v] of Object.entries(errors)) {
    const msg = v?.trim();
    if (!msg) continue;
    if (normalizeApiFieldPath(k) === want) return msg;
  }
  return "";
}

/**
 * Scrolls to the first field with an error (DOM order inside `scrollRoot`).
 * Use `data-setup-scroll-anchor` on wrappers; value may be comma-separated paths
 * (e.g. `resellerId,resellerParentDraft.resellerId`).
 */
export function scrollToFirstCompanySetupFieldError(
  scrollRoot: HTMLElement | null | undefined,
  errors: Record<string, string>,
): void {
  if (!scrollRoot) return;
  const hasAny = Object.values(errors).some((v) => typeof v === "string" && v.trim());
  if (!hasAny) return;

  const anchors = scrollRoot.querySelectorAll<HTMLElement>("[data-setup-scroll-anchor]");
  for (const el of anchors) {
    const raw = el.getAttribute("data-setup-scroll-anchor");
    if (!raw) continue;
    const paths = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const path of paths) {
      if (getCompanySetupFieldError(errors, path)) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
  }
}
