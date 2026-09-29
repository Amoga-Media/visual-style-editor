import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { computeStructuralPath } from "@/lib/ast/structural-path";
import { domAdapter } from "@/lib/dom/dom-adapter";

// BUG-005 regression: LinkGroup must record href/rel/target edits on the <a> tag, not a child element
describe("LinkGroup structural path (BUG-005)", () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><html><body>
      <a id="nav-link" href="https://example.com">
        <span id="label">Click me</span>
      </a>
    </body></html>`);
  });

  it("computeStructuralPath on <a> returns path anchored to the <a>", () => {
    const anchor = dom.window.document.getElementById("nav-link") as HTMLElement;
    const path = computeStructuralPath(anchor, domAdapter);
    expect(path).toContain("#nav-link");
  });

  it("computeStructuralPath on child <span> returns the span's path, not the anchor", () => {
    const span = dom.window.document.getElementById("label") as HTMLElement;
    const path = computeStructuralPath(span, domAdapter);
    // Span is INSIDE the anchor, so path should reference the span not the anchor
    expect(path).not.toBe("#nav-link");
  });

  it("anchor.closest('a') on the <span> returns the parent <a>", () => {
    const span = dom.window.document.getElementById("label") as HTMLElement;
    const anchor = span.closest("a") as HTMLElement;
    expect(anchor).not.toBeNull();
    expect(anchor.id).toBe("nav-link");
    const path = computeStructuralPath(anchor, domAdapter);
    expect(path).toContain("#nav-link");
  });
});
