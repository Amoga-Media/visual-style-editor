/**
 * Drag-and-drop rework: minimal helpers for the parts of the File System
 * Access API this app uses (getAsFileSystemHandle / showOpenFilePicker /
 * createWritable / permission checks). These are only implemented in
 * Chromium-family browsers as of writing — every exported function
 * feature-detects before touching any of it, so a browser without support
 * (Firefox, Safari) simply never calls into this file's browser APIs and
 * the app falls back to a plain `<input type="file">` for opening and a
 * Blob download for saving (see DropZone.tsx and download.ts).
 *
 * Local minimal types are declared here rather than relying on TypeScript's
 * bundled DOM lib to have (or not have) these — this project's client has
 * no committed tsconfig.json/typecheck step (a known pre-existing gap, see
 * the shipped BUGS-AND-CHANGES.md), so nothing here is actually
 * type-checked today, but keeping the shapes explicit makes the intent
 * readable regardless.
 */

type PermissionState = "granted" | "denied" | "prompt";
type PermissionDescriptor = { mode: "read" | "readwrite" };

export interface MinimalFileSystemFileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<{
    write(data: string): Promise<void>;
    close(): Promise<void>;
  }>;
  // Both optional: some partial/older implementations expose createWritable
  // without these. Every call site treats their absence as "assume access
  // is already granted" rather than failing — see ensureWritePermission.
  queryPermission?(descriptor: PermissionDescriptor): Promise<PermissionState>;
  requestPermission?(descriptor: PermissionDescriptor): Promise<PermissionState>;
}

type DataTransferItemWithHandle = DataTransferItem & {
  getAsFileSystemHandle?: () => Promise<MinimalFileSystemFileHandle & { kind?: string }>;
};

type WindowWithFilePicker = Window & {
  showOpenFilePicker?: (options: unknown) => Promise<MinimalFileSystemFileHandle[]>;
};

/**
 * True if this browser can plausibly hand back a FileSystemFileHandle at
 * all (via drag-drop or the file picker) — used purely to decide what to
 * tell the person up front (see DropZone's capability note), not as a
 * guarantee: a handle can still fail to write later (permission revoked,
 * file moved, etc), which persistUpdatedHtml in App.tsx handles regardless.
 */
export function supportsFileSystemAccess(): boolean {
  const hasPicker = typeof (window as WindowWithFilePicker).showOpenFilePicker === "function";
  const hasDragHandle =
    typeof DataTransferItem !== "undefined" &&
    typeof (DataTransferItem.prototype as DataTransferItemWithHandle).getAsFileSystemHandle === "function";
  return hasPicker || hasDragHandle;
}

/**
 * Called on a dropped DataTransferItem. Returns null (never throws) for
 * any browser/situation where a handle isn't available — a dropped
 * directory, a browser without the API, or a permission problem — so
 * callers can always fall back to the plain File the drop also carries.
 */
export async function tryGetFileSystemHandle(
  item: DataTransferItem
): Promise<MinimalFileSystemFileHandle | null> {
  const withHandle = item as DataTransferItemWithHandle;
  if (typeof withHandle.getAsFileSystemHandle !== "function") return null;
  try {
    const handle = await withHandle.getAsFileSystemHandle();
    if (!handle || handle.kind === "directory") return null;
    return handle;
  } catch {
    return null;
  }
}

/**
 * The "Choose a file…" button's preferred path: `showOpenFilePicker` hands
 * back a real FileSystemFileHandle (so Save can write straight back to the
 * chosen file), unlike a plain `<input type="file">` which only ever gives
 * a detached File. Returns null when unsupported OR when the person closes
 * the picker without choosing anything — both are "nothing to do here",
 * not failures, so DropZone's caller just falls back to the hidden input.
 */
export async function tryShowOpenFilePicker(): Promise<{ file: File; handle: MinimalFileSystemFileHandle } | null> {
  const picker = (window as WindowWithFilePicker).showOpenFilePicker;
  if (typeof picker !== "function") return null;
  try {
    const [handle] = await picker({
      types: [{ description: "HTML files", accept: { "text/html": [".html", ".htm"] } }],
      excludeAcceptAllOption: false,
      multiple: false,
    });
    if (!handle) return null;
    const file = await handle.getFile();
    return { file, handle };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return null;
    throw err;
  }
}

/**
 * Confirms (requesting if necessary) that `handle` has readwrite
 * permission, so a subsequent `writeToHandle` call doesn't fail — and, just
 * as importantly, so the CALLER can tell in advance whether a save is going
 * to write in place or needs to fall back to a download, instead of only
 * finding out from a thrown error after the fact. Returns false rather than
 * throwing for every "can't confirm" case (unsupported handle, browser
 * declined the request, the request itself errored) — callers treat false
 * as "fall back to download," not as an application error.
 */
export async function ensureWritePermission(handle: MinimalFileSystemFileHandle): Promise<boolean> {
  if (!handle.queryPermission && !handle.requestPermission) {
    // This handle doesn't expose permission introspection at all — assume
    // access is already granted (true for handles obtained via a fresh
    // drag-drop or showOpenFilePicker call in every Chromium version this
    // was tested against). writeToHandle's own try/catch is still the
    // final safety net if that assumption turns out to be wrong.
    return true;
  }
  const descriptor: PermissionDescriptor = { mode: "readwrite" };
  try {
    const current = handle.queryPermission ? await handle.queryPermission(descriptor) : "prompt";
    if (current === "granted") return true;
    if (!handle.requestPermission) return false;
    const requested = await handle.requestPermission(descriptor);
    return requested === "granted";
  } catch {
    return false;
  }
}

/** Writes `content` back to the file a handle points at, overwriting it. */
export async function writeToHandle(handle: MinimalFileSystemFileHandle, content: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}
