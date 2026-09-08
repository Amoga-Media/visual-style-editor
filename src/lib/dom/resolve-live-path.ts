import { parseStructuralPath } from "../ast/structural-path";

export function resolveElementByStructuralPath(root: Document, path: string): Element | null {
  const parsed = parseStructuralPath(path);

  if (parsed.kind === "id") {
    return root.getElementById(parsed.id);
  }

  let current: Element | null = root.documentElement;
  for (let i = 0; i < parsed.steps.length; i++) {
    const step = parsed.steps[i];
    if (!current) return null;

    if (i === 0) {
      if (current.tagName.toLowerCase() !== step.tag) return null;
      continue;
    }

    const sameTagChildren: Element[] = Array.from(current.children).filter(
      (child) => child.tagName.toLowerCase() === step.tag
    );
    current = sameTagChildren[step.nthOfType - 1] ?? null;
  }

  return current;
}
