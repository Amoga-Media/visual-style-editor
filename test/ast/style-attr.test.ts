import { describe, it, expect } from "vitest";
import { parseStyleAttr, serializeStyleAttr, setStyleProperty } from "@/lib/ast/style-attr";

describe("parseStyleAttr", () => {
  it("parses empty string to empty array", () => {
    expect(parseStyleAttr("")).toEqual([]);
    expect(parseStyleAttr("   ")).toEqual([]);
  });

  it("parses single declaration", () => {
    expect(parseStyleAttr("color: red")).toEqual([{ property: "color", value: "red" }]);
    expect(parseStyleAttr("color: red;")).toEqual([{ property: "color", value: "red" }]);
  });

  it("parses multiple declarations preserving order", () => {
    expect(parseStyleAttr("color: red; font-size: 16px; margin-top: 8px")).toEqual([
      { property: "color", value: "red" },
      { property: "font-size", value: "16px" },
      { property: "margin-top", value: "8px" },
    ]);
  });
});

describe("serializeStyleAttr", () => {
  it("serializes declarations to CSS style string", () => {
    expect(serializeStyleAttr([{ property: "color", value: "red" }])).toBe("color: red;");
    expect(
      serializeStyleAttr([
        { property: "color", value: "red" },
        { property: "font-size", value: "16px" },
      ])
    ).toBe("color: red; font-size: 16px;");
  });
});

describe("setStyleProperty", () => {
  it("inserts new property on empty style attribute", () => {
    expect(setStyleProperty("", "font-size", "24px")).toBe("font-size: 24px;");
  });

  it("updates existing property in place preserving other declarations", () => {
    const original = "color: red; font-size: 16px; margin: 0;";
    expect(setStyleProperty(original, "font-size", "24px")).toBe("color: red; font-size: 24px; margin: 0;");
  });

  it("appends new property if not currently present", () => {
    const original = "color: red;";
    expect(setStyleProperty(original, "font-size", "24px")).toBe("color: red; font-size: 24px;");
  });
});
