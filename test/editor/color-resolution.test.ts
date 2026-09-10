import { describe, it, expect } from "vitest";
import { readCurrentValue } from "@/lib/dom/computed-style";

import { DEFAULT_COLORS } from "@/lib/tailwind/default-theme";

describe("Color Value Resolution Engine", () => {
  it("resolves Tailwind standard color names via DEFAULT_COLORS to hex codes", () => {
    const el = document.createElement("p");
    el.className = "text-slate-900";
    document.body.appendChild(el);

    const token = readCurrentValue(el, "text-color", { mode: "v3-cdn", colors: [], fonts: [] });
    expect(token).toBe("slate-900");

    const matched = DEFAULT_COLORS.find((c) => c.name === token);
    expect(matched?.hex).toBe("#0f172a");

    el.remove();
  });

  it("resolves white and black named color tokens from classList", () => {
    const el = document.createElement("div");
    el.className = "text-white bg-black";
    document.body.appendChild(el);

    const textVal = readCurrentValue(el, "text-color", { mode: "v3-cdn", colors: [], fonts: [] });
    expect(textVal).toBe("white");

    const bgVal = readCurrentValue(el, "background-color", { mode: "v3-cdn", colors: [], fonts: [] });
    expect(bgVal).toBe("black");

    el.remove();
  });

  it("reads explicit inline style color via css property name", () => {
    const el = document.createElement("h1");
    el.style.color = "#3b82f6";
    document.body.appendChild(el);

    const textVal = readCurrentValue(el, "text-color", { mode: "none", colors: [], fonts: [] });
    expect(textVal).toBe("rgb(59, 130, 246)");

    el.remove();
  });
});
