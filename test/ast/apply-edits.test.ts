import { describe, it, expect } from "vitest";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

describe("applyEditsClientSide", () => {
  const html = `<html><head></head><body><div id="box" class="p-4">Hello</div></body></html>`;

  it("applies class mutations directly in-memory", () => {
    const res = applyEditsClientSide(html, [
      { kind: "class", structuralPath: "#box", newClassList: ["p-8", "bg-blue-500"] },
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.html).toContain('class="p-8 bg-blue-500"');
    }
  });

  it("applies style mutations directly in-memory", () => {
    const res = applyEditsClientSide(html, [
      { kind: "style", structuralPath: "#box", styleProperty: "color", newStyleValue: "red" },
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.html).toContain('style="color: red;"');
    }
  });

  it("applies text mutations directly in-memory", () => {
    const res = applyEditsClientSide(html, [
      { kind: "text", structuralPath: "#box", newText: "Welcome World" },
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.html).toContain("Welcome World");
    }
  });

  it("applies attribute mutations directly in-memory", () => {
    const res = applyEditsClientSide(html, [
      { kind: "attribute", structuralPath: "#box", attributeName: "data-role", newValue: "container" },
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.html).toContain('data-role="container"');
    }
  });

  it("applies delete mutation directly in-memory", () => {
    const res = applyEditsClientSide(html, [
      { kind: "delete", structuralPath: "#box" },
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.html).not.toContain('id="box"');
      expect(res.html).toContain("<body></body>");
    }
  });

  it("applies duplicate mutation directly in-memory", () => {
    const res = applyEditsClientSide(html, [
      { kind: "duplicate", structuralPath: "#box" },
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const occurrences = (res.html.match(/id="box"/g) || []).length;
      expect(occurrences).toBe(2);
    }
  });

  it("applies insert mutation directly in-memory", () => {
    const res = applyEditsClientSide(html, [
      { kind: "insert", structuralPath: "#box", position: "inside", snippet: "<span>Badge</span>" },
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.html).toContain("<span>Badge</span>");
    }
  });

  it("applies multiple style edits to pure non-Tailwind HTML document", () => {
    const rawHtml = `<!doctype html><html><head><title>Pure HTML</title></head><body><h1>Title</h1><p id="desc">Description paragraph</p></body></html>`;
    const res = applyEditsClientSide(rawHtml, [
      { kind: "style", structuralPath: "#desc", styleProperty: "font-size", newStyleValue: "20px" },
      { kind: "style", structuralPath: "#desc", styleProperty: "color", newStyleValue: "#4f46e5" },
      { kind: "style", structuralPath: "#desc", styleProperty: "padding", newStyleValue: "16px" },
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.html).toContain('style="font-size: 20px; color: #4f46e5; padding: 16px;"');
      expect(res.html).toContain("Description paragraph");
    }
  });

  it("applies move mutation to reorder elements before, after, or inside", () => {
    const listHtml = `<html><head></head><body><ul id="list"><li id="item-1">First</li><li id="item-2">Second</li><li id="item-3">Third</li></ul></body></html>`;
    
    // Move item-3 before item-1
    const res = applyEditsClientSide(listHtml, [
      { kind: "move", structuralPath: "#item-3", targetPath: "#item-1", position: "before" },
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.html.indexOf("Third")).toBeLessThan(res.html.indexOf("First"));
      expect(res.html.indexOf("First")).toBeLessThan(res.html.indexOf("Second"));
    }

    // Move item-1 after item-2
    const resAfter = applyEditsClientSide(listHtml, [
      { kind: "move", structuralPath: "#item-1", targetPath: "#item-2", position: "after" },
    ]);
    expect(resAfter.ok).toBe(true);
    if (resAfter.ok) {
      expect(resAfter.html.indexOf("Second")).toBeLessThan(resAfter.html.indexOf("First"));
    }
  });

  it("returns conflict if structuralPath does not exist", () => {
    const res = applyEditsClientSide(html, [
      { kind: "class", structuralPath: "#non-existent", newClassList: ["text-xl"] },
    ]);
    expect(res.ok).toBe(false);
  });
});

