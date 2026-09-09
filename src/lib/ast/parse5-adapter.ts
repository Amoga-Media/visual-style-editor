import type { NodeAdapter } from "./structural-path";
import type { DefaultTreeAdapterMap } from "parse5";

type Element = DefaultTreeAdapterMap["element"];
type ChildNode = DefaultTreeAdapterMap["childNode"];
type ParentNode = DefaultTreeAdapterMap["parentNode"];

function isElement(node: ChildNode | ParentNode): node is Element {
  return "tagName" in node;
}

export function getAttr(el: Element, name: string): string | undefined {
  return el.attrs.find((a) => a.name === name)?.value;
}

export function elementChildren(node: ParentNode): Element[] {
  return node.childNodes.filter(isElement);
}

export const parse5Adapter: NodeAdapter<Element> = {
  getTag: (el) => el.tagName,
  getId: (el) => getAttr(el, "id") || undefined,
  getParent: (el) => {
    const parent = el.parentNode;
    return parent && isElement(parent as ChildNode) ? (parent as Element) : null;
  },
  getPrecedingSameTagCount: (el) => {
    const parent = el.parentNode as ParentNode | null;
    if (!parent) return 0;
    const siblings = elementChildren(parent);
    const selfIndex = siblings.indexOf(el);
    return siblings.slice(0, selfIndex).filter((s) => s.tagName === el.tagName).length;
  },
};

export function walkElements(root: Element, visit: (el: Element) => void) {
  visit(root);
  for (const child of elementChildren(root)) walkElements(child, visit);
}

export function findElementById(root: Element, id: string): Element | null {
  let found: Element | null = null;
  walkElements(root, (el) => {
    if (!found && getAttr(el, "id") === id) found = el;
  });
  return found;
}
