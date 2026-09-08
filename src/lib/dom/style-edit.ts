/**
 * Task 6.1 (FR-9): a tiny helper for the non-Tailwind inline-style fallback.
 *
 * In Tailwind mode, a commit's "old" value is read straight from
 * `el.className` at commit time — accurate because the live-drag path
 * (Task 3.3) only ever writes to `el.style`, never `el.className`, so
 * `el.className` is untouched no matter how many drag ticks happened first.
 *
 * In the non-Tailwind fallback, `el.style` IS both the live-drag preview
 * surface AND the final persisted value (app-flow.md's Secondary Flow:
 * "commits write to the style attribute, not class attribute") — so by
 * the time a *commit* fires, `el.style` has already been overwritten by
 * every tick of the drag that led up to it, and there's no untouched
 * attribute left to read "before this gesture" from.
 *
 * The fix used here doesn't chase "before this specific gesture" at all:
 * each property-panel group already computes the element's true rendered
 * value exactly once per selection, in the same effect that seeds the
 * group's own input state (readCurrentValue — computed-style.ts). That
 * value is captured as a per-selection baseline and reused as `oldStyleValue`
 * on every commit for that property during the lifetime of the current
 * selection. This is deliberately NOT "the value immediately before this
 * one commit" — it's "the value as of selection time" — but that's fine:
 * change-set-store's dedup carry-forward (Task 4.1) only ever keeps the
 * FIRST recorded entry's old value for a given (path, property) pair and
 * discards every later commit's old value regardless, so every commit in a
 * selection's lifetime reporting the same (correct) selection-time baseline
 * as "old" produces exactly the right session-original value in Review —
 * without needing to track "was this the first tick of a fresh gesture."
 */
export function readInlineOrComputedStyleValue(el: Element, cssProperty: string): string {
  const inline = (el as HTMLElement).style.getPropertyValue(cssProperty);
  if (inline) return inline;
  return getComputedStyle(el).getPropertyValue(cssProperty);
}
