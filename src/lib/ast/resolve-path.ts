import type { DefaultTreeAdapterMap } from "parse5";
import { parseStructuralPath } from "./structural-path";
import { elementChildren, findElementById } from "./parse5-adapter";

type Element = DefaultTreeAdapterMap["element"];

export function resolveStructuralPath(root: Element, path: string): Element | null {
  const parsed = parseStructuralPath(path);

  if (parsed.kind === "id") {
    return findElementById(root, parsed.id);
  }

  let current: Element = root;
  // steps[0] is always "html", which `root` already is — skip it.
  for (const step of parsed.steps.slice(1)) {
    const siblings = elementChildren(current).filter((el) => el.tagName === step.tag);
    const match = siblings[step.nthOfType - 1];
    if (!match) return null;
    current = match;
  }
  return current;
}
