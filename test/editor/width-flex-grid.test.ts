import { describe, it, expect } from "vitest";
import { applyLiveStyle, commitStyleChange } from "@/lib/dom/live-style-engine";
import { applyClassMutation } from "@/lib/dom/class-list-mutation";
import { applyEditsClientSide } from "@/lib/ast/apply-edits";

const emptyTheme = { mode: "none" as const, colors: [], fonts: [] };
const tailwindTheme = { mode: "v3-cdn" as const, colors: [], fonts: [] };

describe("BUG-022: Width Is Not Being Applied Correctly", () => {
  it("strips conflicting sizing classes (w-full, w-auto, grow, flex-1) when width is changed", () => {
    const initialClasses = ["flex", "w-full", "grow", "flex-1", "bg-blue-500", "p-4"];
    const mutated = applyClassMutation(initialClasses, "width", "w-[340px]", tailwindTheme);

    expect(mutated).toContain("w-[340px]");
    expect(mutated).toContain("bg-blue-500");
    expect(mutated).toContain("p-4");
    expect(mutated).not.toContain("w-full");
    expect(mutated).not.toContain("grow");
    expect(mutated).not.toContain("flex-1");
  });

  it("adjusts flex-grow and flex-basis on flex child to prevent flex stretching from overriding explicit width", () => {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "row";

    const child = document.createElement("div");
    child.style.flexGrow = "1";
    child.className = "flex-1 grow w-full";
    container.appendChild(child);
    document.body.appendChild(container);

    applyLiveStyle(child, "width", "280px", tailwindTheme);

    // Flex child constraints adjusted: flexGrow reset to 0, flexBasis to auto
    expect(child.style.flexGrow).toBe("0");
    expect(child.style.flexBasis).toBe("auto");
    expect(child.style.width).toBe("280px");

    document.body.removeChild(container);
  });

  it("preserves explicit inline width and height in Tailwind mode on commit to prevent snapback", () => {
    const el = document.createElement("div");
    el.className = "w-full bg-slate-100";
    document.body.appendChild(el);

    commitStyleChange(
      el,
      "div",
      "width",
      "350px",
      tailwindTheme,
      undefined,
      "100%"
    );

    // Class updated to arbitrary tailwind class
    expect(el.className).toContain("w-[350px]");
    expect(el.className).not.toContain("w-full");
    // Explicit inline width retained so preview rendering doesn't snap back
    expect(el.style.width).toBe("350px");

    document.body.removeChild(el);
  });

  it("cleanly applies width edits to raw HTML without corrupting surrounding AST structures", () => {
    const rawHtml = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <div class="flex flex-row">
    <!-- First flex item -->
    <div id="card-1" class="flex-1 w-full bg-red-500">Item 1</div>
  </div>
</body>
</html>`;

    const result = applyEditsClientSide(rawHtml, [
      {
        id: "edit-w",
        kind: "class",
        structuralPath: "#card-1",
        property: "width" as any,
        oldClassList: ["flex-1", "w-full", "bg-red-500"],
        newClassList: ["bg-red-500", "w-[300px]"],
        timestamp: new Date().toISOString(),
      } as any,
    ]);

    expect(result.ok).toBe(true);
    expect(result.html).toContain('class="bg-red-500 w-[300px]"');
    expect(result.html).not.toContain("flex-1");
    expect(result.html).not.toContain("w-full");
    expect(result.html).toContain("<!-- First flex item -->");
  });
});
