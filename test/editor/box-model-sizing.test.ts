import { describe, it, expect, beforeEach } from "vitest";
import { readCurrentValue } from "@/lib/dom/computed-style";

describe("Box Model & Sizing Engine", () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument("test");
  });

  it("accurately reads 4-side padding when defined via inline styles", () => {
    const div = doc.createElement("div");
    div.style.paddingTop = "12px";
    div.style.paddingRight = "24px";
    div.style.paddingBottom = "16px";
    div.style.paddingLeft = "8px";
    doc.body.appendChild(div);

    expect(readCurrentValue(div, "padding-top")).toBe("12px");
    expect(readCurrentValue(div, "padding-right")).toBe("24px");
    expect(readCurrentValue(div, "padding-bottom")).toBe("16px");
    expect(readCurrentValue(div, "padding-left")).toBe("8px");
  });

  it("reads decomposed margins and padding from Tailwind classes", () => {
    const div = doc.createElement("div");
    div.className = "mt-4 mb-8 pl-6 pr-4";
    doc.body.appendChild(div);

    const theme = { mode: "v3-cdn", colors: [], fonts: [] } as any;
    expect(readCurrentValue(div, "margin-top", theme, "top")).toBe("16px");
    expect(readCurrentValue(div, "margin-bottom", theme, "bottom")).toBe("32px");
    expect(readCurrentValue(div, "padding-left", theme, "left")).toBe("24px");
    expect(readCurrentValue(div, "padding-right", theme, "right")).toBe("16px");
  });

  it("reads px and py classes correctly for respective sides", () => {
    const div = doc.createElement("div");
    div.className = "px-6 py-3 mx-auto";
    doc.body.appendChild(div);

    const theme = { mode: "v3-cdn", colors: [], fonts: [] } as any;
    expect(readCurrentValue(div, "padding-left", theme, "left")).toBe("24px");
    expect(readCurrentValue(div, "padding-right", theme, "right")).toBe("24px");
    expect(readCurrentValue(div, "padding-top", theme, "top")).toBe("12px");
    expect(readCurrentValue(div, "padding-bottom", theme, "bottom")).toBe("12px");
    expect(readCurrentValue(div, "margin-left", theme, "left")).toBe("auto");
    expect(readCurrentValue(div, "margin-right", theme, "right")).toBe("auto");
  });
});
