export interface NodeAdapter<TNode> {
  getTag(node: TNode): string;
  getId(node: TNode): string | undefined;
  getParent(node: TNode): TNode | null;
  /** 0-based count of same-tag siblings that come BEFORE this node */
  getPrecedingSameTagCount(node: TNode): number;
}

/**
 * If the node has an id, the path is just "#id" (assumed document-unique —
 * a reasonable assumption for hand-written HTML per PRD §9). Otherwise it's
 * a tag + nth-of-type chain from <html> down, e.g.
 * "html>body>section:nth-of-type(2)>div:nth-of-type(1)>h1".
 */
export function computeStructuralPath<TNode>(node: TNode, adapter: NodeAdapter<TNode>): string {
  const id = adapter.getId(node);
  if (id) return `#${id}`;

  const steps: string[] = [];
  let current: TNode | null = node;
  while (current) {
    const tag = adapter.getTag(current);
    if (tag === "html") {
      steps.unshift("html");
      break;
    }
    const index = adapter.getPrecedingSameTagCount(current) + 1;
    steps.unshift(`${tag}:nth-of-type(${index})`);
    current = adapter.getParent(current);
  }
  return steps.join(">");
}

export interface ParsedPathStep {
  tag: string;
  nthOfType: number;
}

export type ParsedPath = { kind: "id"; id: string } | { kind: "chain"; steps: ParsedPathStep[] };

export function parseStructuralPath(path: string): ParsedPath {
  if (path.startsWith("#")) return { kind: "id", id: path.slice(1) };
  const steps = path.split(">").map((step, i) => {
    if (i === 0 && step.toLowerCase() === "html") return { tag: "html", nthOfType: 1 };
    if (step.toLowerCase() === "body") return { tag: "body", nthOfType: 1 };
    const match = step.match(/^([a-zA-Z0-9-_:]+):nth-of-type\((\d+)\)$/);
    if (!match) {
      if (/^[a-zA-Z0-9-_:]+$/.test(step)) {
        return { tag: step.toLowerCase(), nthOfType: 1 };
      }
      throw new Error(`Malformed structural path step: "${step}"`);
    }
    return { tag: match[1].toLowerCase(), nthOfType: Number(match[2]) };
  });
  return { kind: "chain", steps };
}
