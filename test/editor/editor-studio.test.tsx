import { describe, it, expect, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import EditorStudio from "@/components/editor/EditorStudio";

describe("EditorStudio integration", () => {
  it("mounts EditorStudio and transitions to studio mode when a template is selected", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const root = createRoot(container);
    await act(async () => {
      root.render(<EditorStudio />);
    });

    // Verify DropZone is rendered
    expect(container.textContent).toContain("Drop HTML files");
    expect(container.textContent).toContain("Developer Profile & Stack");

    // Click the first starter template
    const templateButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Developer Profile & Stack")
    );
    expect(templateButton).toBeDefined();

    await act(async () => {
      templateButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Verify EditorStudio rendered toolbar, layers, and preview frame
    expect(container.textContent).toContain("VSE");
    expect(container.textContent).toContain("developer-card.html");
    expect(container.querySelector("iframe")).not.toBeNull();

    // Clean up
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
