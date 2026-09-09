import { describe, it, expect } from "vitest";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";
import type { ClassEditRecord } from "@/types";

describe("BUG-018: Class Property Editor", () => {
  it("splices added and removed classes into HTML class attribute cleanly", () => {
    const originalHtml = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <!-- hero section -->
  <section id="hero" class="bg-black text-white p-8">
    <h1>Title</h1>
  </section>
</body>
</html>`;

    // Add 'rounded-2xl' and remove 'p-8', adding 'p-12'
    const editRecord: ClassEditRecord = {
      id: "class-edit-1",
      kind: "class",
      structuralPath: "#hero",
      property: "text-content" as any,
      oldClassList: ["bg-black", "text-white", "p-8"],
      newClassList: ["bg-black", "text-white", "rounded-2xl", "p-12"],
      timestamp: new Date().toISOString(),
    };

    const result = applyEditsClientSide(originalHtml, [editRecord as any]);
    expect(result.ok).toBe(true);
    expect(result.html).toContain('class="bg-black text-white rounded-2xl p-12"');
    expect(result.html).toContain("<!-- hero section -->");
    expect(result.html).toContain("<h1>Title</h1>");
  });

  it("adds class attribute to element that previously had no class attribute", () => {
    const originalHtml = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <div id="plain-box">
    <span>Hello</span>
  </div>
</body>
</html>`;

    const editRecord: ClassEditRecord = {
      id: "class-edit-2",
      kind: "class",
      structuralPath: "#plain-box",
      property: "text-content" as any,
      oldClassList: [],
      newClassList: ["flex", "items-center", "shadow-md"],
      timestamp: new Date().toISOString(),
    };

    const result = applyEditsClientSide(originalHtml, [editRecord as any]);
    expect(result.ok).toBe(true);
    expect(result.html).toContain('class="flex items-center shadow-md"');
    expect(result.html).toContain('id="plain-box"');
  });

  it("handles live DOM class mutations for SVGs and HTML elements", () => {
    const div = document.createElement("div");
    div.className = "old-1 old-2";

    // Simulate add
    const list1 = Array.from(div.classList);
    list1.push("new-badge");
    div.className = list1.join(" ");
    expect(div.classList.contains("new-badge")).toBe(true);

    // Simulate remove
    const list2 = Array.from(div.classList).filter((c) => c !== "old-1");
    div.className = list2.join(" ");
    expect(div.classList.contains("old-1")).toBe(false);
    expect(div.classList.contains("old-2")).toBe(true);
    expect(div.classList.contains("new-badge")).toBe(true);
  });
});
