import { describe, it, expect } from "vitest";
import { computeStructuralPath, parseStructuralPath, type NodeAdapter } from "@/lib/ast/structural-path";

// Tiny fake tree: plain object nodes with tag, id, parent, children.
interface FakeNode {
  tag: string;
  id?: string;
  parent: FakeNode | null;
  children: FakeNode[];
}

function el(tag: string, opts: { id?: string; children?: FakeNode[] } = {}): FakeNode {
  const node: FakeNode = { tag, id: opts.id, parent: null, children: opts.children ?? [] };
  for (const child of node.children) child.parent = node;
  return node;
}

const fakeAdapter: NodeAdapter<FakeNode> = {
  getTag: (n) => n.tag,
  getId: (n) => n.id,
  getParent: (n) => n.parent,
  getPrecedingSameTagCount: (n) => {
    if (!n.parent) return 0;
    const idx = n.parent.children.indexOf(n);
    return n.parent.children.slice(0, idx).filter((sibling) => sibling.tag === n.tag).length;
  },
};

describe("computeStructuralPath", () => {
  it("yields #id regardless of depth when the element has an id", () => {
    const target = el("div", { id: "hero" });
    const middle = el("div", { children: [target] });
    const section = el("section", { children: [middle] });
    el("body", { children: [section] });

    expect(computeStructuralPath(target, fakeAdapter)).toBe("#hero");
  });

  it("yields the full tag+nth-of-type chain from <html> when no id is present anywhere in the ancestor chain", () => {
    const h1 = el("h1");
    const div = el("div", { children: [h1] });
    const section1 = el("section");
    const section2 = el("section", { children: [div] });
    const body = el("body", { children: [section1, section2] });
    el("html", { children: [body] });

    expect(computeStructuralPath(h1, fakeAdapter)).toBe(
      "html>body:nth-of-type(1)>section:nth-of-type(2)>div:nth-of-type(1)>h1:nth-of-type(1)"
    );
  });

  it("gives same-tag siblings distinct nth-of-type indices", () => {
    const first = el("li");
    const second = el("li");
    el("ul", { children: [first, second] });

    expect(computeStructuralPath(first, fakeAdapter)).toContain("li:nth-of-type(1)");
    expect(computeStructuralPath(second, fakeAdapter)).toContain("li:nth-of-type(2)");
  });

  it("round-trips through parseStructuralPath", () => {
    const h1 = el("h1");
    const div = el("div", { children: [h1] });
    const section1 = el("section");
    const section2 = el("section", { children: [div] });
    const body = el("body", { children: [section1, section2] });
    el("html", { children: [body] });

    const computed = computeStructuralPath(h1, fakeAdapter);
    const parsed = parseStructuralPath(computed);

    expect(parsed.kind).toBe("chain");
    if (parsed.kind === "chain") {
      expect(parsed.steps).toEqual([
        { tag: "html", nthOfType: 1 },
        { tag: "body", nthOfType: 1 },
        { tag: "section", nthOfType: 2 },
        { tag: "div", nthOfType: 1 },
        { tag: "h1", nthOfType: 1 },
      ]);
    }
  });

  it("round-trips an id path", () => {
    const target = el("div", { id: "hero" });
    el("body", { children: [target] });

    const computed = computeStructuralPath(target, fakeAdapter);
    const parsed = parseStructuralPath(computed);
    expect(parsed).toEqual({ kind: "id", id: "hero" });
  });
});
