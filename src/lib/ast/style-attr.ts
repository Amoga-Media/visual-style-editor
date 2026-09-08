/**
 * Parses/serializes an HTML `style="..."` attribute VALUE (not the
 * attribute including its `style="..."` wrapper — same convention as
 * `getAttr` in parse5-adapter.ts) as an ordered list of declarations.
 *
 * This deliberately does not attempt to be a full CSS parser: values with
 * embedded semicolons (e.g. a `url(data:...;base64,...)` background-image)
 * are out of scope for v1's editable properties (EditableProperty never
 * includes anything with a semicolon-bearing value), so splitting on plain
 * `;` is safe for exactly the property set this tool writes into. Order is
 * preserved and only the target property is touched — round-tripping an
 * inline style through parse -> setProperty -> serialize must leave every
 * OTHER declaration byte-identical, the same "only the targeted range
 * changes" guarantee Phase 5's class-attribute splice already gives (PRD
 * Acceptance Criteria #2), just applied to the style attribute instead.
 */
export interface StyleDeclaration {
  property: string;
  value: string;
}

export function parseStyleAttr(styleValue: string): StyleDeclaration[] {
  return styleValue
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const colonIndex = chunk.indexOf(":");
      if (colonIndex === -1) return { property: chunk.trim(), value: "" };
      return {
        property: chunk.slice(0, colonIndex).trim(),
        value: chunk.slice(colonIndex + 1).trim(),
      };
    });
}

export function serializeStyleAttr(declarations: StyleDeclaration[]): string {
  return declarations.map((d) => `${d.property}: ${d.value};`).join(" ");
}

/**
 * Returns the new style-attribute VALUE string with `property` set to
 * `value`, preserving every other declaration and its original order.
 * `property` is matched case-insensitively (CSS property names are, and a
 * hand-edited file could plausibly use any casing) but re-serialized using
 * whatever casing the CALLER passed for `property` when it's a new
 * declaration, or the ORIGINAL declaration's casing when updating one that
 * already exists — so an edit never silently re-cases a property name the
 * person didn't touch.
 */
export function setStyleProperty(styleValue: string, property: string, value: string): string {
  const declarations = parseStyleAttr(styleValue);
  const lowerTarget = property.toLowerCase();
  const existingIndex = declarations.findIndex((d) => d.property.toLowerCase() === lowerTarget);

  if (existingIndex === -1) {
    return serializeStyleAttr([...declarations, { property, value }]);
  }

  const next = [...declarations];
  next[existingIndex] = { property: next[existingIndex].property, value };
  return serializeStyleAttr(next);
}
