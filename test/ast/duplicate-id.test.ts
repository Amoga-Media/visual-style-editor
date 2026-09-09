import { describe, it, expect } from "vitest";
import { generateUniqueId, rewriteSubtreeIds, extractExistingIds } from "@/lib/ast/unique-id";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

describe("Unique ID & Subtree Reference Remapping", () => {
  it("generates deterministic collision-free sequence: card -> card-copy -> card-copy-2", () => {
    const existingIds = new Set(["card"]);
    const first = generateUniqueId("card", existingIds);
    expect(first).toBe("card-copy");

    const second = generateUniqueId("card", existingIds);
    expect(second).toBe("card-copy-2");

    const third = generateUniqueId("card", existingIds);
    expect(third).toBe("card-copy-3");
  });

  it("handles base ID that already has -copy suffix", () => {
    const existingIds = new Set(["card", "card-copy"]);
    const id = generateUniqueId("card-copy", existingIds);
    expect(id).toBe("card-copy-2");
  });

  it("rewrites internal references (for, href=#, aria-*) in duplicated subtree", () => {
    const slice = `<div id="section-1">
      <label for="email-input">Email</label>
      <input id="email-input" aria-describedby="email-help" />
      <span id="email-help">Enter your email</span>
      <a href="#section-1">Back to top</a>
    </div>`;

    const existingIds = new Set(["section-1", "email-input", "email-help"]);
    const { rewrittenSlice, idMap } = rewriteSubtreeIds(slice, existingIds);

    expect(idMap.get("section-1")).toBe("section-1-copy");
    expect(idMap.get("email-input")).toBe("email-input-copy");
    expect(idMap.get("email-help")).toBe("email-help-copy");

    expect(rewrittenSlice).toContain('id="section-1-copy"');
    expect(rewrittenSlice).toContain('for="email-input-copy"');
    expect(rewrittenSlice).toContain('id="email-input-copy"');
    expect(rewrittenSlice).toContain('aria-describedby="email-help-copy"');
    expect(rewrittenSlice).toContain('id="email-help-copy"');
    expect(rewrittenSlice).toContain('href="#section-1-copy"');
  });

  it("applies collision-free duplication during AST splicing", () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div id="hero" class="p-4">
    <a href="#hero">Link</a>
  </div>
</body>
</html>`;

    const res = applyEditsClientSide(html, [{ kind: "duplicate", structuralPath: "#hero" }]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.html).toContain('id="hero"');
      expect(res.html).toContain('id="hero-copy"');
      expect(res.html).toContain('href="#hero-copy"');
    }
  });
});
