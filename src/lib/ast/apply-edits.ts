import type { DefaultTreeAdapterMap } from "parse5";
import type { SaveRequestEdit, SaveResponse, SaveConflict } from "@/types";
import { buildLocationMap } from "./build-location-map";
import { resolveStructuralPath } from "./resolve-path";
import { applySplices, type Splice } from "./splice";
import { elementChildren, getAttr } from "./parse5-adapter";
import { setStyleProperty } from "./style-attr";
import { isGoogleFont, getGoogleFontLinkTag, cleanFontFamilyName } from "@/lib/fonts/google-fonts";

type Element = DefaultTreeAdapterMap["element"];

/**
 * 100% In-Browser AST Splicing Engine.
 * Operates purely on the HTML string and edits in memory inside the user's browser.
 * Consolidates multiple edits to the same element to prevent duplicate attribute splices.
 */
export function applyEditsClientSide(html: string, edits: SaveRequestEdit[]): SaveResponse {
  if (typeof html !== "string" || html.length === 0) {
    return { ok: false, conflicts: [{ structuralPath: "root", reason: "not-found" }] };
  }

  const { document } = buildLocationMap(html);
  const htmlEl = elementChildren(document).find((el) => el.tagName === "html") as Element | undefined;
  if (!htmlEl) {
    return { ok: false, conflicts: [{ structuralPath: "root", reason: "not-found" }] };
  }

  const splices: Splice[] = [];
  const conflicts: SaveConflict[] = [];

  // 1. Consolidate style edits by structuralPath
  const styleEditsByPath = new Map<string, Record<string, string>>();
  // 2. Consolidate class edits by structuralPath
  const classEditsByPath = new Map<string, string[]>();
  // 3. Consolidate text edits by structuralPath
  const textEditsByPath = new Map<string, string>();
  // 4. Consolidate attribute edits by structuralPath -> attributeName
  const attrEditsByPath = new Map<string, Map<string, string>>();
  // 5. Sequence structural edits (delete, duplicate, insert)
  const structuralEdits: SaveRequestEdit[] = [];

  for (const edit of edits) {
    if (edit.kind === "style") {
      const current = styleEditsByPath.get(edit.structuralPath) || {};
      current[edit.styleProperty] = edit.newStyleValue;
      styleEditsByPath.set(edit.structuralPath, current);
    } else if (edit.kind === "class") {
      classEditsByPath.set(edit.structuralPath, edit.newClassList);
    } else if (edit.kind === "text") {
      textEditsByPath.set(edit.structuralPath, edit.newText);
    } else if (edit.kind === "attribute") {
      const current = attrEditsByPath.get(edit.structuralPath) || new Map<string, string>();
      current.set(edit.attributeName, edit.newValue);
      attrEditsByPath.set(edit.structuralPath, current);
    } else {
      structuralEdits.push(edit);
    }
  }

  // Apply Class Splices (1 consolidated class attribute per element)
  for (const [structuralPath, newClassList] of classEditsByPath) {
    const node = resolveStructuralPath(htmlEl, structuralPath);
    if (!node) {
      conflicts.push({ structuralPath, reason: "not-found" });
      continue;
    }
    const classAttr = node.sourceCodeLocation?.attrs?.["class"];
    const newClassString = newClassList.join(" ");

    if (classAttr) {
      splices.push({
        startOffset: classAttr.startOffset,
        endOffset: classAttr.endOffset,
        replacement: `class="${newClassString}"`,
      });
    } else if (node.sourceCodeLocation?.startTag) {
      const tagStart = node.sourceCodeLocation.startTag.startOffset;
      const insertAt = tagStart + node.tagName.length + 1;
      splices.push({
        startOffset: insertAt,
        endOffset: insertAt,
        replacement: ` class="${newClassString}"`,
      });
    }
  }

  // Apply Style Splices (1 consolidated style attribute per element)
  for (const [structuralPath, styleProps] of styleEditsByPath) {
    const node = resolveStructuralPath(htmlEl, structuralPath);
    if (!node) {
      conflicts.push({ structuralPath, reason: "not-found" });
      continue;
    }
    const styleAttr = node.sourceCodeLocation?.attrs?.["style"];
    let combinedStyle = getAttr(node, "style") ?? "";
    for (const [prop, val] of Object.entries(styleProps)) {
      combinedStyle = setStyleProperty(combinedStyle, prop, val);
    }

    if (styleAttr) {
      splices.push({
        startOffset: styleAttr.startOffset,
        endOffset: styleAttr.endOffset,
        replacement: `style="${combinedStyle}"`,
      });
    } else if (node.sourceCodeLocation?.startTag) {
      const tagStart = node.sourceCodeLocation.startTag.startOffset;
      const insertAt = tagStart + node.tagName.length + 1;
      splices.push({
        startOffset: insertAt,
        endOffset: insertAt,
        replacement: ` style="${combinedStyle}"`,
      });
    }
  }

  // Apply Text Splices
  for (const [structuralPath, newText] of textEditsByPath) {
    const node = resolveStructuralPath(htmlEl, structuralPath);
    if (!node) {
      conflicts.push({ structuralPath, reason: "not-found" });
      continue;
    }
    const startTag = node.sourceCodeLocation?.startTag;
    const endTag = node.sourceCodeLocation?.endTag;
    if (startTag && endTag) {
      splices.push({
        startOffset: startTag.endOffset,
        endOffset: endTag.startOffset,
        replacement: newText,
      });
    }
  }

  // Apply Attribute Splices
  for (const [structuralPath, attrMap] of attrEditsByPath) {
    const node = resolveStructuralPath(htmlEl, structuralPath);
    if (!node) {
      conflicts.push({ structuralPath, reason: "not-found" });
      continue;
    }
    for (const [attributeName, newValue] of attrMap) {
      const attrLocation = node.sourceCodeLocation?.attrs?.[attributeName.toLowerCase()];
      if (newValue === "") {
        if (attrLocation) {
          splices.push({
            startOffset: attrLocation.startOffset,
            endOffset: attrLocation.endOffset,
            replacement: "",
          });
        }
      } else {
        if (attrLocation) {
          splices.push({
            startOffset: attrLocation.startOffset,
            endOffset: attrLocation.endOffset,
            replacement: `${attributeName}="${newValue}"`,
          });
        } else if (node.sourceCodeLocation?.startTag) {
          const tagStart = node.sourceCodeLocation.startTag.startOffset;
          const insertAt = tagStart + node.tagName.length + 1;
          splices.push({
            startOffset: insertAt,
            endOffset: insertAt,
            replacement: ` ${attributeName}="${newValue}"`,
          });
        }
      }
    }
  }

  // Apply Structural Splices (delete, duplicate, insert)
  for (const edit of structuralEdits) {
    const node = resolveStructuralPath(htmlEl, edit.structuralPath);
    if (!node) {
      conflicts.push({ structuralPath: edit.structuralPath, reason: "not-found" });
      continue;
    }
    if (edit.kind === "delete") {
      if (node.sourceCodeLocation) {
        splices.push({
          startOffset: node.sourceCodeLocation.startOffset,
          endOffset: node.sourceCodeLocation.endOffset,
          replacement: "",
        });
      }
    } else if (edit.kind === "duplicate") {
      if (node.sourceCodeLocation) {
        const elementSlice = html.slice(node.sourceCodeLocation.startOffset, node.sourceCodeLocation.endOffset);
        splices.push({
          startOffset: node.sourceCodeLocation.endOffset,
          endOffset: node.sourceCodeLocation.endOffset,
          replacement: "\n" + elementSlice,
        });
      }
    } else if (edit.kind === "insert") {
      if (node.sourceCodeLocation) {
        if (edit.position === "inside" && node.sourceCodeLocation.startTag) {
          splices.push({
            startOffset: node.sourceCodeLocation.startTag.endOffset,
            endOffset: node.sourceCodeLocation.startTag.endOffset,
            replacement: "\n" + edit.snippet,
          });
        } else if (edit.position === "before") {
          splices.push({
            startOffset: node.sourceCodeLocation.startOffset,
            endOffset: node.sourceCodeLocation.startOffset,
            replacement: edit.snippet + "\n",
          });
        } else {
          splices.push({
            startOffset: node.sourceCodeLocation.endOffset,
            endOffset: node.sourceCodeLocation.endOffset,
            replacement: "\n" + edit.snippet,
          });
        }
      }
    } else if (edit.kind === "move") {
      const targetNode = resolveStructuralPath(htmlEl, edit.targetPath);
      if (!targetNode || !targetNode.sourceCodeLocation || !node.sourceCodeLocation) {
        conflicts.push({ structuralPath: edit.targetPath, reason: "not-found" });
        continue;
      }
      const elementSlice = html.slice(node.sourceCodeLocation.startOffset, node.sourceCodeLocation.endOffset);
      // 1. Delete source from its position
      splices.push({
        startOffset: node.sourceCodeLocation.startOffset,
        endOffset: node.sourceCodeLocation.endOffset,
        replacement: "",
      });
      // 2. Insert into target position
      if (edit.position === "inside" && targetNode.sourceCodeLocation.startTag) {
        splices.push({
          startOffset: targetNode.sourceCodeLocation.startTag.endOffset,
          endOffset: targetNode.sourceCodeLocation.startTag.endOffset,
          replacement: "\n" + elementSlice,
        });
      } else if (edit.position === "before") {
        splices.push({
          startOffset: targetNode.sourceCodeLocation.startOffset,
          endOffset: targetNode.sourceCodeLocation.startOffset,
          replacement: elementSlice + "\n",
        });
      } else {
        splices.push({
          startOffset: targetNode.sourceCodeLocation.endOffset,
          endOffset: targetNode.sourceCodeLocation.endOffset,
          replacement: "\n" + elementSlice,
        });
      }
    }
  }

  // Auto-embed Google Font stylesheets in <head> if any font-family edits use Google Fonts
  const googleFontsToInclude = new Set<string>();
  for (const edit of edits) {
    if (edit.kind === "style" && (edit.styleProperty === "font-family" || edit.styleProperty === "font")) {
      const clean = cleanFontFamilyName(edit.newStyleValue);
      if (isGoogleFont(clean)) {
        googleFontsToInclude.add(clean);
      }
    } else if (edit.kind === "class") {
      for (const c of edit.newClassList) {
        if (c.startsWith("font-['") && c.endsWith("']")) {
          const raw = c.slice(7, -2);
          const clean = cleanFontFamilyName(raw);
          if (isGoogleFont(clean)) {
            googleFontsToInclude.add(clean);
          }
        }
      }
    }
  }

  if (googleFontsToInclude.size > 0) {
    const headEl = elementChildren(htmlEl).find((el) => el.tagName === "head") as Element | undefined;
    if (headEl && headEl.sourceCodeLocation?.endTag) {
      const missingLinks: string[] = [];
      for (const fontName of googleFontsToInclude) {
        const linkTag = getGoogleFontLinkTag(fontName);
        const urlPattern = fontName.replace(/ /g, "+");
        if (!html.includes(urlPattern)) {
          missingLinks.push(linkTag);
        }
      }
      if (missingLinks.length > 0) {
        const insertAt = headEl.sourceCodeLocation.endTag.startOffset;
        splices.push({
          startOffset: insertAt,
          endOffset: insertAt,
          replacement: "  " + missingLinks.join("\n  ") + "\n",
        });
      }
    }
  }

  if (conflicts.length > 0) {
    return { ok: false, conflicts };
  }

  const updated = applySplices(html, splices);
  return { ok: true, html: updated };
}
