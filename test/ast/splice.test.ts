import { describe, it, expect } from "vitest";
import { applySplices, type Splice } from "@/lib/ast/splice";

function findAttrValueRange(html: string, attrValue: string): { startOffset: number; endOffset: number } {
  const marker = `="${attrValue}"`;
  const idx = html.indexOf(marker);
  if (idx === -1) throw new Error(`attribute value not found in fixture: ${attrValue}`);
  const startOffset = idx + 2;
  const endOffset = startOffset + attrValue.length;
  return { startOffset, endOffset };
}

describe("applySplices — replace variant, order-independence", () => {
  const original = `<div class="a b" data-x="1"><span class="c"></span></div>`;
  const expected = `<div class="x y" data-x="1"><span class="z"></span></div>`;

  const aRange = findAttrValueRange(original, "a b");
  const cRange = findAttrValueRange(original, "c");
  const spliceA: Splice = { ...aRange, replacement: "x y" };
  const spliceC: Splice = { ...cRange, replacement: "z" };

  it("applies both splices correctly given in source order (forwards)", () => {
    expect(applySplices(original, [spliceA, spliceC])).toBe(expected);
  });

  it("applies both splices correctly given in reverse source order", () => {
    expect(applySplices(original, [spliceC, spliceA])).toBe(expected);
  });

  it("produces IDENTICAL output forwards vs reversed", () => {
    const forward = applySplices(original, [spliceA, spliceC]);
    const reversed = applySplices(original, [spliceC, spliceA]);
    expect(forward).toBe(reversed);
    expect(forward).toBe(expected);
  });
});

describe("applySplices — insert variant (no existing class attribute)", () => {
  it("inserts a brand-new class attribute at a zero-width splice position", () => {
    const original = `<div data-x="1"><span></span></div>`;
    const insertAt = original.indexOf("<div") + "<div".length;
    const insertSplice: Splice = { startOffset: insertAt, endOffset: insertAt, replacement: ' class="p-4"' };
    expect(applySplices(original, [insertSplice])).toBe(`<div class="p-4" data-x="1"><span></span></div>`);
  });

  it("combines an insert splice with a replace splice in one call, order-independent both ways", () => {
    const original = `<div data-x="1"><span class="c"></span></div>`;
    const insertAt = original.indexOf("<div") + "<div".length;
    const insertSplice: Splice = { startOffset: insertAt, endOffset: insertAt, replacement: ' class="p-4"' };

    const cRange = findAttrValueRange(original, "c");
    const replaceSplice: Splice = { ...cRange, replacement: "z" };

    const expected = `<div class="p-4" data-x="1"><span class="z"></span></div>`;

    expect(applySplices(original, [insertSplice, replaceSplice])).toBe(expected);
    expect(applySplices(original, [replaceSplice, insertSplice])).toBe(expected);
  });
});
