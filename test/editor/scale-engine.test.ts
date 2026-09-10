import { describe, it, expect, beforeEach } from "vitest";
import { formatCssValue, applyLiveStyle } from "@/lib/dom/live-style-engine";
import { readCurrentValue } from "@/lib/dom/computed-style";

describe("Element Scale Engine", () => {
  it("formats scale property correctly as numeric multiplier", () => {
    const res = formatCssValue("scale", "1.25");
    expect(res.prop).toBe("scale");
    expect(res.val).toBe("1.25");
  });

  it("applies scale property to element style", () => {
    const div = document.createElement("div");
    applyLiveStyle(div, "scale", "1.5");
    expect(div.style.scale).toBe("1.5");
  });

  it("reads scale property from computed/inline styles", () => {
    const div = document.createElement("div");
    div.style.scale = "1.75";
    document.body.appendChild(div);
    expect(readCurrentValue(div, "scale")).toBe("1.75");
  });
});
