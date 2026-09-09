import { describe, it, expect } from "vitest";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

describe("Source HTML Byte-Preservation", () => {
  it("preserves untouched comments, scripts, whitespace, and custom attributes byte-identical", () => {
    const originalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Critical Comment: Do Not Remove -->
  <meta charset="UTF-8" />
  <script>
    const analyticsConfig = { id: "UA-12345", enabled: true };
    console.log("Analytics initialized");
  </script>
  <style>
    .custom-user-rule { color: purple; }
  </style>
</head>
<body data-custom-root="123" class="bg-white">
  <!-- Header Section -->
  <header id="site-header" custom-attr="safe">
    <h1 id="title" class="text-xl font-normal">Welcome</h1>
    <p class="text-sm">Subtitle text</p>
  </header>
  <!-- Footer Section -->
  <footer>
    <p>&copy; 2026 Company Inc.</p>
  </footer>
</body>
</html>`;

    // Edit only the #title element
    const res = applyEditsClientSide(originalHtml, [
      { kind: "class", structuralPath: "#title", newClassList: ["text-2xl", "font-bold"] },
    ]);

    expect(res.ok).toBe(true);
    if (res.ok) {
      // 1. Target element was updated
      expect(res.html).toContain('class="text-2xl font-bold"');

      // 2. Comments are preserved
      expect(res.html).toContain("<!-- Critical Comment: Do Not Remove -->");
      expect(res.html).toContain("<!-- Header Section -->");
      expect(res.html).toContain("<!-- Footer Section -->");

      // 3. Script contents and whitespace are preserved exactly
      expect(res.html).toContain(`  <script>
    const analyticsConfig = { id: "UA-12345", enabled: true };
    console.log("Analytics initialized");
  </script>`);

      // 4. Custom styles and attributes are preserved exactly
      expect(res.html).toContain(".custom-user-rule { color: purple; }");
      expect(res.html).toContain('data-custom-root="123"');
      expect(res.html).toContain('custom-attr="safe"');
      expect(res.html).toContain("<p>&copy; 2026 Company Inc.</p>");
    }
  });
});
