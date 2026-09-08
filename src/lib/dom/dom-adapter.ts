import type { NodeAdapter } from "../ast/structural-path";

export const domAdapter: NodeAdapter<Element> = {
  getTag: (el) => el.tagName.toLowerCase(),
  getId: (el) => el.id || undefined,
  getParent: (el) => el.parentElement,
  getPrecedingSameTagCount: (el) => {
    let count = 0;
    let sibling = el.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === el.tagName) count++;
      sibling = sibling.previousElementSibling;
    }
    return count;
  },
};
