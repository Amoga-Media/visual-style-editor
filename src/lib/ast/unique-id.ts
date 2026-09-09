/**
 * Deterministic, collision-safe, and subtree-aware ID remapping utility.
 * Used during element duplication both in the live DOM and during AST splicing.
 */

/**
 * Collects all IDs present in an HTML string.
 */
export function extractExistingIds(html: string): Set<string> {
  const ids = new Set<string>();
  const idRegex = /\bid=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = idRegex.exec(html)) !== null) {
    if (match[1]) ids.add(match[1].trim());
  }
  return ids;
}

/**
 * Generates an unused, collision-safe unique ID based on a preferred ID and a set of existing IDs.
 * Pattern: card -> card-copy -> card-copy-2 -> card-copy-3 ...
 */
export function generateUniqueId(baseId: string, existingIds: Set<string>): string {
  // Normalize base by removing existing -copy(-N)? suffix if present
  const cleanBase = baseId.replace(/-copy(-\d+)?$/, "");
  
  let candidate = `${cleanBase}-copy`;
  if (!existingIds.has(candidate)) {
    existingIds.add(candidate);
    return candidate;
  }

  let counter = 2;
  while (existingIds.has(`${cleanBase}-copy-${counter}`)) {
    counter++;
  }
  const result = `${cleanBase}-copy-${counter}`;
  existingIds.add(result);
  return result;
}

/**
 * Rewrites all `id="..."` attributes and internal cross-references (`for="..."`, `href="#..."`, `aria-*`)
 * within an HTML slice to avoid ID collisions upon duplication.
 */
export function rewriteSubtreeIds(
  htmlSlice: string,
  existingDocIds: Set<string>
): { rewrittenSlice: string; idMap: Map<string, string> } {
  const idMap = new Map<string, string>();

  // 1. Identify all IDs in the slice and allocate unique collision-free replacements
  const sliceIds = new Set<string>();
  const idRegex = /\bid=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = idRegex.exec(htmlSlice)) !== null) {
    if (match[1]) sliceIds.add(match[1].trim());
  }

  for (const oldId of sliceIds) {
    const newId = generateUniqueId(oldId, existingDocIds);
    idMap.set(oldId, newId);
  }

  if (idMap.size === 0) {
    return { rewrittenSlice: htmlSlice, idMap };
  }

  // 2. Rewrite id attributes
  let rewritten = htmlSlice.replace(/\bid=(["'])([^"']+)\1/gi, (full, quote, idVal) => {
    const trimmed = idVal.trim();
    const mapped = idMap.get(trimmed);
    return mapped ? `id=${quote}${mapped}${quote}` : full;
  });

  // 3. Rewrite internal intra-subtree references
  for (const [oldId, newId] of idMap.entries()) {
    // for="oldId"
    const forRegex = new RegExp(`\\bfor=(["'])${escapeRegex(oldId)}\\1`, "gi");
    rewritten = rewritten.replace(forRegex, `for=$1${newId}$1`);

    // href="#oldId" or xlink:href="#oldId"
    const hrefRegex = new RegExp(`\\b(href|xlink:href)=(["'])#${escapeRegex(oldId)}\\2`, "gi");
    rewritten = rewritten.replace(hrefRegex, `$1=$2#${newId}$2`);

    // aria-labelledby, aria-describedby, aria-controls, aria-owns
    const ariaRegex = new RegExp(`\\b(aria-(?:labelledby|describedby|controls|owns))=(["'])([^"']*\\b)${escapeRegex(oldId)}(\\b[^"']*)\\2`, "gi");
    rewritten = rewritten.replace(ariaRegex, (m, attr, q, pre, post) => `${attr}=${q}${pre}${newId}${post}${q}`);
  }

  return { rewrittenSlice: rewritten, idMap };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
