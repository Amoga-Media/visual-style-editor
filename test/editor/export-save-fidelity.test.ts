import { describe, it, expect, beforeEach } from "vitest";
import { serializeCleanDocument } from "@/components/editor/EditorStudio";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

describe("Export & Save Fidelity", () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument("Test Page");
  });

  it("serializes clean document without editor helper styles and temporary attributes", () => {
    const helperStyle = doc.createElement("style");
    helperStyle.id = "vse-editor-helper-styles";
    helperStyle.textContent = "body * { pointer-events: auto; }";
    doc.head.appendChild(helperStyle);

    const div = doc.createElement("div");
    div.setAttribute("data-vse-selected", "true");
    div.setAttribute("data-vse-hovered", "true");
    div.setAttribute("data-vse-drop-target", "true");
    div.setAttribute("data-vse-drag-over", "true");
    div.setAttribute("data-vse-move-token", "token-123");
    div.setAttribute("contenteditable", "true");
    div.className = "w-full p-4 bg-white";
    div.textContent = "Clean Content";
    doc.body.appendChild(div);

    const serialized = serializeCleanDocument(doc);

    expect(serialized).not.toContain("vse-editor-helper-styles");
    expect(serialized).not.toContain("data-vse-selected");
    expect(serialized).not.toContain("data-vse-hovered");
    expect(serialized).not.toContain("data-vse-drop-target");
    expect(serialized).not.toContain("data-vse-drag-over");
    expect(serialized).not.toContain("data-vse-move-token");
    expect(serialized).not.toContain("contenteditable");
    expect(serialized).toContain("Clean Content");
    expect(serialized).toContain("w-full p-4 bg-white");
  });

  it("applies class, style, and attribute edits in AST splicing", () => {
    const html = '<!DOCTYPE html><html><head></head><body><div id="card" class="p-2">Hello</div></body></html>';
    const edits = [
      { kind: "class" as const, structuralPath: "#card", newClassList: ["p-6", "bg-blue-500", "rounded-xl"] },
      { kind: "style" as const, structuralPath: "#card", styleProperty: "opacity", newStyleValue: "0.9" },
    ];

    const result = applyEditsClientSide(html, edits);
    expect(result.ok).toBe(true);
    expect(result.html).toContain('class="p-6 bg-blue-500 rounded-xl"');
    expect(result.html).toContain('style="opacity: 0.9;"');
  });
});
