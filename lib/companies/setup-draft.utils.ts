import type { JsonRecord } from "@/api";

const DEFAULT_POC_INVITE_PASSWORD = "Admin@123";
const POC_EMAIL_MAX_LEN = 255;

/** Max POC users per child company (matches backend `MAX_POC_PER_CHILD_COMPANY`). */
export const MAX_POC_PER_CHILD = 5;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/** Parses `POST /companies/setup/draft` (201) response for the draft row id. */
export function extractCompanySetupDraftId(data: unknown): string | null {
  const root = asRecord(data);
  if (!root) return null;
  const direct = String(root.id ?? "").trim();
  if (direct) return direct;
  const nested = asRecord(root.data);
  if (nested) {
    const id = String(nested.id ?? nested.draftId ?? "").trim();
    if (id) return id;
  }
  return null;
}

/** Latest-draft GET: `data: null` or envelope with run id inside `data`. */
export function extractCompanySetupDraftIdFromLatest(data: unknown): string | null {
  const root = asRecord(data);
  if (root && "data" in root && root.data === null) return null;
  const inner = root && "data" in root && root.data !== undefined ? root.data : data;
  return extractCompanySetupDraftId(inner);
}

export type PocDraftSlice = {
  pocFirstName: string;
  pocMiddleName: string;
  pocLastName: string;
  pocEmail: string;
  /** Optional; when empty, {@link DEFAULT_POC_INVITE_PASSWORD} is sent. */
  pocPassword: string;
  roleId: string;
  pocDepartmentMode: "existing" | "new";
  pocDepartmentId: string;
  pocDepartmentName: string;
  pocDepartmentNewDescription: string;
  pocDesignationMode: "existing" | "new";
  pocDesignationId: string;
  pocDesignationTitle: string;
  pocDesignationNewDetails: string;
  pocWideResellerScope: boolean;
};

export type DraftChildPayload = {
  name: string;
  email: string;
  phone: string;
  address: string;
  /** One row per site; empty strings allowed while editing; normalized to `https://` on PATCH. */
  websiteUrls: string[];
  /** Up to {@link MAX_POC_PER_CHILD} POC invites per child. */
  pocRows: PocDraftSlice[];
};

export function emptyPocSlice(): PocDraftSlice {
  return {
    pocFirstName: "",
    pocMiddleName: "",
    pocLastName: "",
    pocEmail: "",
    pocPassword: "",
    roleId: "",
    pocDepartmentMode: "existing",
    pocDepartmentId: "",
    pocDepartmentName: "",
    pocDepartmentNewDescription: "",
    pocDesignationMode: "existing",
    pocDesignationId: "",
    pocDesignationTitle: "",
    pocDesignationNewDetails: "",
    pocWideResellerScope: false,
  };
}

function parsePocFromInviteRecord(poc: Record<string, unknown>): PocDraftSlice {
  const deptName = String(poc.departmentName ?? "").trim();
  const desTitle = String(poc.designationTitle ?? "").trim();
  return {
    pocFirstName: String(poc.firstName ?? "").trim(),
    pocMiddleName: String(poc.middleName ?? "").trim(),
    pocLastName: String(poc.lastName ?? "").trim(),
    pocEmail: String(poc.pocEmail ?? poc.email ?? "").trim(),
    pocPassword: "",
    roleId: String(poc.roleId ?? "").trim(),
    pocDepartmentMode: "new",
    pocDepartmentId: "",
    pocDepartmentName: deptName,
    pocDepartmentNewDescription: String(poc.departmentDetails ?? "").trim(),
    pocDesignationMode: "new",
    pocDesignationId: "",
    pocDesignationTitle: desTitle,
    pocDesignationNewDetails: String(poc.designationDetails ?? "").trim(),
    pocWideResellerScope: Boolean(poc.wideResellerScope),
  };
}

function parsePocRowsFromChildRow(c: Record<string, unknown>): PocDraftSlice[] {
  const multi = c.pocInvites;
  if (Array.isArray(multi) && multi.length > 0) {
    return multi
      .map((item) => {
        const poc = asRecord(item);
        return poc ? parsePocFromInviteRecord(poc) : null;
      })
      .filter((x): x is PocDraftSlice => x !== null)
      .slice(0, MAX_POC_PER_CHILD);
  }
  const single = asRecord(c.pocInvite);
  if (single) {
    return [parsePocFromInviteRecord(single)];
  }
  return [emptyPocSlice()];
}

export function isPocSliceEmpty(slice: PocDraftSlice): boolean {
  return (
    !slice.pocFirstName.trim() &&
    !slice.pocLastName.trim() &&
    !slice.pocEmail.trim()
  );
}

/** True when one POC slice is ready for `pocInvite` (department optional). */
export function isPocSliceComplete(slice: PocDraftSlice): boolean {
  const pocEmail = slice.pocEmail.trim();
  if (
    !slice.pocFirstName.trim() ||
    !slice.pocLastName.trim() ||
    !pocEmail ||
    pocEmail.length > POC_EMAIL_MAX_LEN ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pocEmail) ||
    !slice.roleId.trim()
  ) {
    return false;
  }
  if (slice.pocDesignationMode === "new") {
    if (!slice.pocDesignationTitle.trim()) return false;
  } else if (!slice.pocDesignationId.trim() || !slice.pocDesignationTitle.trim()) {
    return false;
  }
  return true;
}

/** Child row POC set: 1–{@link MAX_POC_PER_CHILD} complete invites; empty slices ignored. */
export function isChildRowPocComplete(child: DraftChildPayload): boolean {
  const filled = child.pocRows.filter((s) => !isPocSliceEmpty(s));
  if (filled.length < 1 || filled.length > MAX_POC_PER_CHILD) return false;
  return filled.every(isPocSliceComplete);
}

/** Builds `pocInvite` JSON for one slice. */
export function buildPocInviteForSlice(slice: PocDraftSlice): JsonRecord | null {
  if (!isPocSliceComplete(slice)) return null;
  const pocEmail = slice.pocEmail.trim().slice(0, POC_EMAIL_MAX_LEN);
  const invite: JsonRecord = {
    firstName: slice.pocFirstName.trim(),
    lastName: slice.pocLastName.trim(),
    pocEmail,
    password: slice.pocPassword.trim() || DEFAULT_POC_INVITE_PASSWORD,
    roleId: slice.roleId.trim(),
    designationTitle: slice.pocDesignationTitle.trim(),
  };
  const dept = slice.pocDepartmentName.trim();
  if (dept) invite.departmentName = dept;
  const mid = slice.pocMiddleName.trim();
  if (mid) invite.middleName = mid;
  if (slice.pocWideResellerScope) {
    invite.wideResellerScope = true;
  }
  return invite;
}

/** @deprecated Use {@link buildPocInviteForSlice} with a single slice. */
export function buildPocInviteForRow(child: DraftChildPayload): JsonRecord | null {
  const first = child.pocRows.find((s) => isPocSliceComplete(s));
  return first ? buildPocInviteForSlice(first) : null;
}

/** Trim, force `https://`, prepend if host-only (e.g. `example.com` → `https://example.com`). */
export function normalizeHttpsWebsiteUrl(raw: string): string {
  let v = raw.trim();
  if (!v) return "";
  v = v.replace(/^http:\/\//i, "https://");
  if (!/^https:\/\//i.test(v)) {
    v = `https://${v.replace(/^\/+/, "")}`;
  }
  return v;
}

/** Deduped list of non-empty https URLs for API payloads. */
export function collectHttpsWebsiteUrls(urls: string[]): string[] {
  const out: string[] = [];
  for (const raw of urls) {
    const u = normalizeHttpsWebsiteUrl(raw);
    if (u && !out.includes(u)) out.push(u);
  }
  return out;
}

export function emptyDraftChildRow(): DraftChildPayload {
  return {
    name: "",
    email: "",
    phone: "",
    address: "",
    websiteUrls: [""],
    pocRows: [emptyPocSlice()],
  };
}

export type CompanySetupWizardHydration = {
  setupKind: "new_reseller" | "existing_reseller";
  resellerId: string;
  parentCompanyName: string;
  draftChildRows: DraftChildPayload[];
  modalStep: 1 | 2;
};

/** GET payloads sometimes nest step state under `form` or `draft`. */
function resolveCompanySetupDraftBase(envelope: Record<string, unknown>): Record<string, unknown> | null {
  const base =
    "data" in envelope && envelope.data !== undefined && envelope.data !== null
      ? asRecord(envelope.data)
      : envelope;
  return base;
}

function pickNestedDraftSlice(base: Record<string, unknown>): Record<string, unknown> | null {
  return asRecord(base.form) ?? asRecord(base.draft);
}

function extractChildrenArray(childrenDraft: Record<string, unknown> | null): unknown[] {
  if (!childrenDraft) return [];
  if (Array.isArray(childrenDraft.children)) return childrenDraft.children;
  if (Array.isArray(childrenDraft.items)) return childrenDraft.items;
  return [];
}

/** GET may return `childrenDraft` as an array, or `{ children: [...] }`, or nested under `form` / `draft`. */
function takeChildrenArrayFromDraftValue(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return extractChildrenArray(asRecord(value));
}

/** Maps GET `/companies/setup/draft/{id}` (or latest `data`) into wizard state. */
export function parseCompanySetupDraftRunForWizard(data: unknown): CompanySetupWizardHydration | null {
  const envelope = asRecord(data);
  if (!envelope) return null;
  const base = resolveCompanySetupDraftBase(envelope);
  if (!base) return null;

  const nested = pickNestedDraftSlice(base);
  const parentDraft =
    asRecord(base.resellerParentDraft) ??
    (nested ? asRecord(nested.resellerParentDraft) : null);
  const modeRaw = String(parentDraft?.mode ?? "").toLowerCase();
  const rootResellerId = String(base.resellerId ?? "").trim();
  const parentCompanyIdOnRun = String(base.parentCompanyId ?? "").trim();
  const setupKind: "new_reseller" | "existing_reseller" =
    modeRaw === "create" && !parentCompanyIdOnRun
      ? "new_reseller"
      : modeRaw === "existing" || rootResellerId.length > 0 || parentCompanyIdOnRun.length > 0
        ? "existing_reseller"
        : "new_reseller";

  const resellerId = String(parentDraft?.resellerId ?? base.resellerId ?? "").trim();
  const parent = asRecord(parentDraft?.parent);
  const parentCompanyName = String(parent?.name ?? "").trim();

  const nestedChildrenVal = nested ? (nested as Record<string, unknown>).childrenDraft : undefined;
  let rawChildren = takeChildrenArrayFromDraftValue(base.childrenDraft);
  if (rawChildren.length === 0) {
    rawChildren = takeChildrenArrayFromDraftValue(nestedChildrenVal);
  }
  if (rawChildren.length === 0 && Array.isArray(base.children)) {
    rawChildren = base.children as unknown[];
  }
  const draftChildRows: DraftChildPayload[] =
    rawChildren.length === 0
      ? [emptyDraftChildRow()]
      : (rawChildren as unknown[]).map((row) => {
          const c = asRecord(row);
          if (!c) return emptyDraftChildRow();
          const websiteUrls: string[] = [];
          const multi = c.websites;
          if (Array.isArray(multi)) {
            for (const item of multi) {
              const o = asRecord(item);
              if (o?.url != null) websiteUrls.push(String(o.url));
            }
          }
          const w = asRecord(c.website);
          if (w?.url != null) {
            const u = String(w.url);
            if (!websiteUrls.includes(u)) websiteUrls.unshift(u);
          }
          return {
            name: String(c.name ?? "").trim(),
            email: String(c.email ?? "").trim(),
            phone: String(c.phone ?? "").trim(),
            address: String(c.address ?? "").trim(),
            websiteUrls: websiteUrls.length > 0 ? websiteUrls : [""],
            pocRows: parsePocRowsFromChildRow(c),
          };
        });

  const stepRaw = String(base.step ?? (nested ? nested.step : "") ?? "")
    .trim()
    .toLowerCase();
  const hasChildrenDraftInApi = rawChildren.length > 0;
  const hasSavedChildBasics = draftChildRows.some(
    (r) =>
      r.name.trim().length > 0 &&
      r.email.trim().length > 0 &&
      r.phone.trim().length > 0 &&
      r.address.trim().length > 0,
  );
  const hasCompleteChild = draftChildRows.some(
    (r) =>
      r.name.trim().length > 0 &&
      r.email.trim().length > 0 &&
      r.phone.trim().length > 0 &&
      r.address.trim().length > 0 &&
      isChildRowPocComplete(r),
  );

  /** Use API `step` only — do not parse `nextAction` (e.g. "continue to children" falsely matched "child"). */
  let modalStep: 1 | 2 = 1;
  if (stepRaw === "children") {
    modalStep = 2;
  } else if (stepRaw === "reseller_parent" || stepRaw === "" || stepRaw === "completed") {
    modalStep = 1;
  } else if (hasChildrenDraftInApi && (hasCompleteChild || hasSavedChildBasics)) {
    modalStep = 2;
  }

  return {
    setupKind,
    resellerId,
    parentCompanyName,
    draftChildRows,
    modalStep,
  };
}

/** Apply parsed draft GET payload into wizard React state. */
export function readWizardHydrationFromDraft(
  data: unknown,
  modalStepOverride?: 1 | 2,
): (CompanySetupWizardHydration & { modalStep: 1 | 2 }) | null {
  const parsed = parseCompanySetupDraftRunForWizard(data);
  if (!parsed) return null;
  return {
    ...parsed,
    modalStep: modalStepOverride ?? parsed.modalStep,
  };
}

export type ResellerParentDraftPatchInput =
  | {
      kind: "existing_reseller";
      resellerId: string;
      parentCompanyId?: string;
      parent: { name: string };
    }
  | {
      kind: "new_reseller";
      parent: { name: string };
    };

function buildResellerParentDraftPayload(
  opts: ResellerParentDraftPatchInput,
): JsonRecord {
  const parent = {
    name: opts.parent.name.trim(),
  };

  if (opts.kind === "new_reseller") {
    return {
      mode: "create",
      parent,
    };
  }

  const draft: JsonRecord = {
    mode: "existing",
    resellerId: opts.resellerId.trim(),
    parent,
  };
  const pid = opts.parentCompanyId?.trim();
  if (pid) draft.parentCompanyId = pid;
  return draft;
}

/** Autosave step 1 and move to children — does not create reseller/parent rows until submit. */
export function buildResellerParentDraftSaveBody(
  opts: ResellerParentDraftPatchInput,
): JsonRecord {
  return {
    step: "children",
    resellerParentDraft: buildResellerParentDraftPayload(opts),
  };
}

/** PATCH step `reseller_parent` with finalize — used only when explicitly committing step 1 early. */
export function buildResellerParentDraftPatchBody(
  opts: ResellerParentDraftPatchInput,
): JsonRecord {
  return {
    step: "reseller_parent",
    finalize: "reseller_parent",
    resellerParentDraft: buildResellerParentDraftPayload(opts),
  };
}

function mapChildrenDraftRows(children: DraftChildPayload[]): JsonRecord[] {
  return children
    .filter((c) => c.name.trim().length > 0)
    .map((c) => {
      const row: JsonRecord = {
        name: c.name.trim(),
        email: c.email.trim(),
        phone: c.phone.trim(),
        address: c.address.trim(),
      };
      const urls = collectHttpsWebsiteUrls(c.websiteUrls ?? []);
      if (urls.length > 0) {
        row.websites = urls.map((url) => ({ url }));
      }
      const invites = c.pocRows
        .map((slice) => buildPocInviteForSlice(slice))
        .filter((inv): inv is JsonRecord => inv !== null);
      if (invites.length === 1) {
        row.pocInvite = invites[0];
      } else if (invites.length > 1) {
        row.pocInvites = invites;
      }
      return row;
    });
}

/** Debounced step-2 autosave — draft JSON only; no DB companies until submit. */
export function buildChildrenDraftAutosaveBody(children: DraftChildPayload[]): JsonRecord {
  return {
    childrenDraft: {
      children: mapChildrenDraftRows(children),
    },
  };
}

/** Explicit save before final submit (same payload shape; kept for call-site clarity). */
export function buildChildrenDraftPatchBody(children: DraftChildPayload[]): JsonRecord {
  return buildChildrenDraftAutosaveBody(children);
}

/** Browser key for resuming company setup after leaving the wizard (same device). */
export const COMPANIES_SETUP_DRAFT_ID_STORAGE_KEY = "converge:companies-setup-draft-id";

export function getStoredCompanySetupDraftId(): string | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(COMPANIES_SETUP_DRAFT_ID_STORAGE_KEY)?.trim();
  return v && v.length > 0 ? v : null;
}

export function setStoredCompanySetupDraftId(id: string | null | undefined): void {
  if (typeof window === "undefined") return;
  const trimmed = id?.trim();
  if (trimmed) localStorage.setItem(COMPANIES_SETUP_DRAFT_ID_STORAGE_KEY, trimmed);
  else localStorage.removeItem(COMPANIES_SETUP_DRAFT_ID_STORAGE_KEY);
}
