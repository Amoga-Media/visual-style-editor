import { describe, it, expect } from "vitest";
import { computeStructuralPath } from "@/lib/ast/structural-path";
import { domAdapter } from "@/lib/dom/dom-adapter";

describe("domAdapter + computeStructuralPath", () => {
  it("returns #id when the element has an id", () => {
    document.body.innerHTML = `<div><h1 id="hero">Hi</h1></div>`;
    const el = document.getElementById("hero")!;
    expect(computeStructuralPath(el, domAdapter)).toBe("#hero");
  });

  it("returns a full chain when there's no id", () => {
    document.body.innerHTML = `<section><div></div><div><p>target</p></div></section>`;
    const target = document.querySelector("p")!;
    expect(computeStructuralPath(target, domAdapter)).toBe(
      "html>body:nth-of-type(1)>section:nth-of-type(1)>div:nth-of-type(2)>p:nth-of-type(1)"
    );
  });
});
