import { describe, test, expect } from "vitest";
import { setStyleProperty } from "@/lib/ast/style-attr";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";
import { parseStructuralPath } from "@/lib/ast/structural-path";

describe("AST Edge Cases & Source Integrity Audit", () => {
  test("setStyleProperty removes declaration when value is empty string", () => {
    const original = "color: red; margin: 10px; display: flex;";
    const updated = setStyleProperty(original, "color", "");
    expect(updated).toBe("margin: 10px; display: flex;");
  });

  test("applyEditsClientSide deduplicates class names", () => {
    const html = `<!DOCTYPE html><html><head></head><body><div id="box" class="btn">Box</div></body></html>`;
    const res = applyEditsClientSide(html, [
      {
        kind: "class",
        structuralPath: "#box",
        newClassList: ["btn", "primary", "btn", "primary"],
      },
    ]);
    expect(res.ok).toBe(true);
    expect(res.html).toContain('class="btn primary"');
  });

  test("applyEditsClientSide reports conflict when moving node into its own descendant", () => {
    const html = `<!DOCTYPE html><html><head></head><body><div id="outer"><div id="inner">Child</div></div></body></html>`;
    const res = applyEditsClientSide(html, [
      {
        kind: "move",
        structuralPath: "#outer",
        targetPath: "#inner",
        position: "inside",
      },
    ]);
    expect(res.ok).toBe(false);
    expect(res.conflicts).toEqual([{ structuralPath: "#inner", reason: "invalid-move-ancestor" }]);
  });

  test("applyEditsClientSide reports conflict when setting text on void element missing end tag", () => {
    const html = `<!DOCTYPE html><html><head></head><body><img id="hero" src="hero.jpg" /></body></html>`;
    const res = applyEditsClientSide(html, [
      {
        kind: "text",
        structuralPath: "#hero",
        newText: "Some text",
      },
    ]);
    expect(res.ok).toBe(false);
    expect(res.conflicts).toEqual([{ structuralPath: "#hero", reason: "void-element" }]);
  });

  test("parseStructuralPath handles tags with underscores, colons, and uppercase", () => {
    const path = "html>body:nth-of-type(1)>SVG:nth-of-type(1)>clip_path:nth-of-type(2)";
    const parsed = parseStructuralPath(path);
    expect(parsed.kind).toBe("chain");
    if (parsed.kind === "chain") {
      expect(parsed.steps.length).toBe(4);
      expect(parsed.steps[2].tag).toBe("svg");
      expect(parsed.steps[3].tag).toBe("clip_path");
    }
  });
});
