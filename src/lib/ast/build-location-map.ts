import { parse } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";
import { computeStructuralPath } from "./structural-path";
import type { LocationEntry } from "@/types";
import { parse5Adapter, getAttr, walkElements, elementChildren } from "./parse5-adapter";

type Element = DefaultTreeAdapterMap["element"];
type Document = DefaultTreeAdapterMap["document"];

export function buildLocationMap(html: string): { document: Document; locations: LocationEntry[] } {
  const document = parse(html, { sourceCodeLocationInfo: true }) as Document;
  const htmlEl = elementChildren(document).find((el) => el.tagName === "html");
  if (!htmlEl) throw new Error("No <html> element found in document");

  const locations: LocationEntry[] = [];
  walkElements(htmlEl, (el) => {
    const structuralPath = computeStructuralPath(el, parse5Adapter);
    const classAttr = el.sourceCodeLocation?.attrs?.["class"];
    const styleAttr = el.sourceCodeLocation?.attrs?.["style"];
    const classString = getAttr(el, "class") ?? "";
    locations.push({
      structuralPath,
      tag: el.tagName,
      classAttrRange: classAttr
        ? { startOffset: classAttr.startOffset, endOffset: classAttr.endOffset }
        : undefined,
      styleAttrRange: styleAttr
        ? { startOffset: styleAttr.startOffset, endOffset: styleAttr.endOffset }
        : undefined,
      currentClassList: classString.split(/\s+/).filter(Boolean),
    });
  });

  return { document, locations };
}
