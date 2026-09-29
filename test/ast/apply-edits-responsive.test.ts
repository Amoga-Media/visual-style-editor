import { describe, it, expect } from "vitest";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

// BUG-006 regression: responsive CSS styles must be injected into saved HTML <head>
describe("responsive CSS persistence (BUG-006)", () => {
  it("injects responsive CSS into <head> when responsiveCss option is provided", () => {
    const html = `<!DOCTYPE html><html><head><title>T</title></head><body></body></html>`;
    const result = applyEditsClientSide(html, [], {
      responsiveCss: "@media (max-width: 768px) { p { font-size: 14px; } }",
    });
    if (!result.ok) throw new Error("Expected ok response");
    expect(result.html).toContain('<style id="vse-responsive-styles">');
    expect(result.html).toContain("768px");
  });

  it("updates existing tag without creating duplicate", () => {
    const html = `<!DOCTYPE html><html><head><style id="vse-responsive-styles">/* old */</style></head><body></body></html>`;
    const result = applyEditsClientSide(html, [], { responsiveCss: "@media (max-width:640px){}" });
    if (!result.ok) throw new Error("Expected ok response");
    expect((result.html.match(/vse-responsive-styles/g) ?? []).length).toBe(1);
    expect(result.html).not.toContain("/* old */");
  });

  it("does not inject empty responsive CSS", () => {
    const html = `<!DOCTYPE html><html><head></head><body></body></html>`;
    const result = applyEditsClientSide(html, [], { responsiveCss: "" });
    if (!result.ok) throw new Error("Expected ok response");
    // No <style id="vse-responsive-styles"> should be added when responsiveCss is empty
    expect(result.html).not.toContain('id="vse-responsive-styles"');
  });

  it("injects before </head> when there's no existing responsive style tag", () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><p>Hello</p></body></html>`;
    const css = "@media (max-width: 768px) { p { color: red; } }";
    const result = applyEditsClientSide(html, [], { responsiveCss: css });
    if (!result.ok) throw new Error("Expected ok response");
    const headEnd = result.html.indexOf("</head>");
    const styleTag = result.html.indexOf("vse-responsive-styles");
    expect(headEnd).toBeGreaterThan(-1);
    expect(styleTag).toBeGreaterThan(-1);
    expect(styleTag).toBeLessThan(headEnd);
  });

  it("responsive style block appears once even after multiple calls", () => {
    const html = `<!DOCTYPE html><html><head></head><body></body></html>`;
    const first = applyEditsClientSide(html, [], { responsiveCss: "@media(max-width:640px){}" });
    if (!first.ok) throw new Error("Expected ok response");
    const second = applyEditsClientSide(first.html!, [], { responsiveCss: "@media(max-width:640px){ p{color:blue} }" });
    if (!second.ok) throw new Error("Expected ok response on second call");
    expect((second.html!.match(/vse-responsive-styles/g) ?? []).length).toBe(1);
  });
});
