import type { EditRecord } from "@/types";

export interface EditDescription {
  title: string;
  category: "class" | "style" | "text" | "attribute" | "structure";
  propertyLabel: string;
  before?: string;
  after?: string;
  summary: string;
}

export function friendlyPathLabel(path: string): string {
  if (!path) return "element";
  if (path.startsWith("#")) return path;
  const segments = path.split(">");
  return segments[segments.length - 1] ?? path;
}

/**
 * Shared, unified edit description formatter.
 * Used by ReviewModal, Toast notifications, Version History, and debug summaries.
 */
export function describeEdit(edit: EditRecord): EditDescription {
  const target = friendlyPathLabel(edit.structuralPath);

  switch (edit.kind) {
    case "class": {
      const oldStr = edit.oldClassList?.join(" ") || "none";
      const newStr = edit.newClassList?.join(" ") || "none";
      return {
        title: `Class list on ${target}`,
        category: "class",
        propertyLabel: String(edit.property || "classes"),
        before: oldStr,
        after: newStr,
        summary: `Changed ${edit.property || "classes"} on ${target}`,
      };
    }
    case "style": {
      const prop = edit.styleProperty || String(edit.property || "style");
      const oldVal = edit.oldStyleValue || "none";
      const newVal = edit.newStyleValue || "none";
      return {
        title: `Inline style ${prop} on ${target}`,
        category: "style",
        propertyLabel: prop,
        before: `${prop}: ${oldVal}`,
        after: `${prop}: ${newVal}`,
        summary: `Set ${prop} to ${newVal} on ${target}`,
      };
    }
    case "text": {
      return {
        title: `Text content on ${target}`,
        category: "text",
        propertyLabel: "text-content",
        before: `"${edit.oldText}"`,
        after: `"${edit.newText}"`,
        summary: `Edited text on ${target}`,
      };
    }
    case "attribute": {
      const attr = edit.attributeName || edit.property;
      return {
        title: `Attribute ${attr} on ${target}`,
        category: "attribute",
        propertyLabel: attr,
        before: edit.oldValue ? `${attr}="${edit.oldValue}"` : "none",
        after: edit.newValue ? `${attr}="${edit.newValue}"` : "removed",
        summary: `Set ${attr}="${edit.newValue}" on ${target}`,
      };
    }
    case "delete": {
      return {
        title: `Deleted element ${target}`,
        category: "structure",
        propertyLabel: "delete",
        before: "present",
        after: "deleted",
        summary: `Deleted <${target}>`,
      };
    }
    case "duplicate": {
      return {
        title: `Duplicated element ${target}`,
        category: "structure",
        propertyLabel: "duplicate",
        before: "single",
        after: "duplicated",
        summary: `Duplicated <${target}>`,
      };
    }
    case "insert": {
      return {
        title: `Inserted snippet ${edit.position} ${target}`,
        category: "structure",
        propertyLabel: `insert (${edit.position})`,
        before: "none",
        after: "snippet inserted",
        summary: `Inserted component into <${target}>`,
      };
    }
    case "move": {
      const toTarget = friendlyPathLabel(edit.targetPath);
      return {
        title: `Moved ${target} ${edit.position} ${toTarget}`,
        category: "structure",
        propertyLabel: "move",
        before: target,
        after: `${edit.position} ${toTarget}`,
        summary: `Moved <${target}> ${edit.position} <${toTarget}>`,
      };
    }
  }
}
