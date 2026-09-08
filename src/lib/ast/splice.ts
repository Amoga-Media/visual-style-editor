/**
 * A single byte-range replacement against the ORIGINAL source string's
 * offsets. All splices in one call are computed against the same unmodified
 * source — that's what makes sorting-and-applying-descending safe: once
 * offsets are computed up front, they never need to be recalculated to
 * account for a prior splice shifting the string, because later (in source
 * order) splices are always applied first.
 *
 * Two shapes share this interface:
 * - Replace: startOffset < endOffset — replaces an existing byte range
 *   (e.g. an existing class="..." attribute's value) with `replacement`.
 * - Insert: startOffset === endOffset — inserts `replacement` at a single
 *   point with nothing removed (e.g. a brand-new class="..." attribute on
 *   an element that doesn't have one yet; see build-location-map's
 *   classAttrRange being undefined for exactly this case). `replacement`
 *   must include everything that needs to appear there, including a
 *   leading space if it's being inserted right after a tag name.
 */
export interface Splice {
  startOffset: number;
  endOffset: number;
  replacement: string;
}

/**
 * Applies every splice to `originalHtml` and returns the resulting string.
 *
 * Adopted from the TRD §6 as-is. Sorting descending by startOffset before
 * applying is the whole trick: each splice is applied against a string
 * whose PRECEDING bytes (everything before this splice's own startOffset)
 * are still at their original offsets, because every splice touched so far
 * was further right in the string. That's what makes the result identical
 * regardless of what order the splices array arrives in — order-independence
 * isn't a side effect, it's the reason for the descending sort.
 */
export function applySplices(originalHtml: string, splices: Splice[]): string {
  const sorted = [...splices].sort((a, b) => b.startOffset - a.startOffset);
  let out = originalHtml;
  for (const s of sorted) {
    out = out.slice(0, s.startOffset) + s.replacement + out.slice(s.endOffset);
  }
  return out;
}
