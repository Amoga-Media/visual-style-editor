import { isHtmlFile } from "./is-html-file";

export interface DropCandidate<Handle> {
  file: File;
  handle: Handle | null;
}

export type DropSelection<Handle> =
  | { kind: "chosen"; candidate: DropCandidate<Handle>; warning?: string }
  | { kind: "no-html"; error: string };

/**
 * Picks which dropped file to open out of everything that was dragged in.
 *
 * Scans every candidate for the first HTML one, rather than only ever
 * looking at whichever file happened to come first in the drop — a drop of
 * e.g. [image.png, page.html] together must still open page.html, not
 * reject the whole drop because image.png came first in the browser's
 * list.
 */
export function selectDropCandidate<Handle>(candidates: DropCandidate<Handle>[]): DropSelection<Handle> | null {
  if (candidates.length === 0) return null;

  const htmlCandidate = candidates.find((c) => isHtmlFile(c.file));
  if (!htmlCandidate) {
    const names = candidates.map((c) => `"${c.file.name}"`).join(", ");
    return {
      kind: "no-html",
      error:
        candidates.length === 1
          ? `${names} doesn't look like an HTML file — drop a .html or .htm file.`
          : `None of the dropped files (${names}) look like an HTML file — drop a .html or .htm file.`,
    };
  }

  const warning =
    candidates.length > 1
      ? `${candidates.length} files were dropped — opened "${htmlCandidate.file.name}" and ignored the rest.`
      : undefined;

  return { kind: "chosen", candidate: htmlCandidate, warning };
}
