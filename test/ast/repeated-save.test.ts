import { describe, it, expect } from "vitest";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

describe("Repeated Save & Idempotent Persistence", () => {
  it("saving repeatedly does not duplicate responsive style blocks or drift HTML structure", () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Repeated Save Test</title>
</head>
<body>
  <div id="card" class="p-4">Content</div>
</body>
</html>`;

    const responsiveCss = `@media (max-width: 768px) {
  [data-vse-path="#card"] {
    padding: 8px !important;
  }
}`;

    // First Save
    const firstSave = applyEditsClientSide(
      html,
      [{ kind: "class", structuralPath: "#card", newClassList: ["p-6", "bg-slate-50"] }],
      { responsiveCss }
    );
    expect(firstSave.ok).toBe(true);

    if (firstSave.ok) {
      const firstHtml = firstSave.html;
      const firstOccurrences = (firstHtml.match(/id="vse-responsive-styles"/g) || []).length;
      expect(firstOccurrences).toBe(1);
      expect(firstHtml).toContain("padding: 8px !important;");

      // Second Save on top of saved HTML (repeated save / reload cycle)
      const secondSave = applyEditsClientSide(
        firstHtml,
        [{ kind: "class", structuralPath: "#card", newClassList: ["p-8", "bg-slate-50"] }],
        { responsiveCss }
      );
      expect(secondSave.ok).toBe(true);

      if (secondSave.ok) {
        const secondHtml = secondSave.html;
        const secondOccurrences = (secondHtml.match(/id="vse-responsive-styles"/g) || []).length;
        expect(secondOccurrences).toBe(1); // Never duplicated!
        expect(secondHtml).toContain('class="p-8 bg-slate-50"');
      }
    }
  });

  it("removes responsive style block cleanly when responsive overrides are cleared", () => {
    const htmlWithStyles = `<!DOCTYPE html>
<html>
<head>
  <style id="vse-responsive-styles">
    @media (max-width: 768px) { [data-vse-path="#card"] { font-size: 14px !important; } }
  </style>
</head>
<body>
  <div id="card">Hello</div>
</body>
</html>`;

    const res = applyEditsClientSide(
      htmlWithStyles,
      [{ kind: "text", structuralPath: "#card", newText: "Updated" }],
      { responsiveCss: "" } // Empty overrides
    );

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.html).not.toContain('id="vse-responsive-styles"');
      expect(res.html).toContain("<div id=\"card\">Updated</div>");
    }
  });
});
