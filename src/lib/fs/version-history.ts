export interface VersionEntry {
  id: number;
  label: string;
  html: string;
}

/** Label for the snapshot taken immediately before a save overwrites the
 * in-memory content — e.g. "Before save at 2:41:07 PM". */
export function buildPreSaveLabel(date: Date = new Date()): string {
  return `Before save at ${date.toLocaleTimeString()}`;
}

/** Filename used when downloading a past version, so it's distinguishable
 * from (and never overwrites) the current file's own filename — e.g.
 * "original-as-opened--page.html" or "before-save-2-41-07-pm--page.html". */
export function versionFilename(label: string, originalName: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug}--${originalName}`;
}
