/**
 * Auto-Save Module
 * Provides debounced localStorage auto-save for open HTML files.
 * Key format: vse_autosave_<fileId>
 * Size limit: 400KB (silently skips if html.length > 400_000)
 */

const PREFIX = "vse_autosave_";
const DEBOUNCE_MS = 2000;
const MAX_SIZE = 400_000;

/** Per-fileId debounce timers */
const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Synchronously writes html to localStorage. Skips files > 400KB. */
export function autoSaveSync(fileId: string, html: string): void {
  if (html.length > MAX_SIZE) return; // Too large — skip silently
  try {
    localStorage.setItem(`${PREFIX}${fileId}`, html);
  } catch {
    // localStorage quota exceeded or unavailable — fail silently
  }
}

/**
 * Debounced auto-save. Waits 2s of inactivity before writing.
 * If called again within 2s, the previous timer is cleared and a new one is set.
 * Each fileId gets its own independent timer to prevent race conditions on file switch.
 */
export function autoSave(fileId: string, html: string): void {
  const existing = timers.get(fileId);
  if (existing) clearTimeout(existing);
  const t = setTimeout(() => {
    autoSaveSync(fileId, html);
    timers.delete(fileId);
  }, DEBOUNCE_MS);
  timers.set(fileId, t);
}

/** Returns the auto-saved HTML for a fileId, or null if none exists. */
export function restoreAutoSave(fileId: string): string | null {
  try {
    return localStorage.getItem(`${PREFIX}${fileId}`);
  } catch {
    return null;
  }
}

/** Removes the auto-save entry for a fileId (call after successful disk save). */
export function clearAutoSave(fileId: string): void {
  // Cancel any pending debounced write first
  const existing = timers.get(fileId);
  if (existing) {
    clearTimeout(existing);
    timers.delete(fileId);
  }
  try {
    localStorage.removeItem(`${PREFIX}${fileId}`);
  } catch {
    // Fail silently
  }
}

/** Returns all fileIds that currently have an auto-save entry. */
export function listAutoSaveKeys(): string[] {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .map((k) => k.slice(PREFIX.length));
  } catch {
    return [];
  }
}
