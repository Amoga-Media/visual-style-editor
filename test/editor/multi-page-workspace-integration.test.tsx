import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import { useChangeSetStore } from "@/store/change-set-store";
import { useUndoStore } from "@/store/undo-store";
import PagesPanel from "@/components/editor/PagesPanel";
import ProjectConfigModal from "@/components/editor/ProjectConfigModal";
import Toolbar from "@/components/editor/Toolbar";
import { parseTailwindConfigContent } from "@/lib/tailwind/config-parser";
import { parseCssThemeContent } from "@/lib/tailwind/css-theme-parser";
import { analyzeHtmlClientSide } from "@/lib/ast/analyze";

describe("Multi-Page Project Workspace Integration", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspace();
    useChangeSetStore.getState().clear();
    useUndoStore.getState().reset();
  });

  it("manages multi-page project files, dirty state tracking, and page switching", async () => {
    const store = useWorkspaceStore.getState();

    // 1. Add 3 project pages
    const addedIds = store.addFiles([
      { name: "index.html", path: "index.html", content: "<html><body><h1 id='h1'>Home</h1></body></html>" },
      { name: "about.html", path: "about.html", content: "<html><body><h1 id='h2'>About</h1></body></html>" },
      { name: "pricing.html", path: "pricing.html", content: "<html><body><h1 id='h3'>Pricing</h1></body></html>" },
    ]);

    expect(addedIds.length).toBe(3);
    expect(useWorkspaceStore.getState().files.length).toBe(3);
    expect(useWorkspaceStore.getState().activeFileId).toBe(addedIds[0]);

    // 2. Perform an edit on page 1
    useChangeSetStore.getState().recordEdit({
      kind: "class",
      structuralPath: "html/body/h1",
      property: "text-color",
      oldClassList: [],
      newClassList: ["text-red-500"],
      viewport: "desktop",
      timestamp: new Date().toISOString(),
    });

    // Sync state for active file
    useWorkspaceStore.getState().syncActiveFileState(addedIds[0], {
      edits: useChangeSetStore.getState().edits,
      undoPast: useUndoStore.getState().past,
      undoFuture: useUndoStore.getState().future,
    });

    expect(useWorkspaceStore.getState().files[0].isDirty).toBe(true);
    expect(useWorkspaceStore.getState().files[1].isDirty).toBe(false);

    // 3. Switch to page 2 (about.html)
    const switchHandler = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PagesPanel
          onSwitchPage={switchHandler}
          onOpenFolderPicker={vi.fn()}
          onOpenFilesPicker={vi.fn()}
        />
      );
    });

    expect(container.textContent).toContain("index.html");
    expect(container.textContent).toContain("about.html");
    expect(container.textContent).toContain("pricing.html");

    // Click about.html
    const aboutBtn = Array.from(container.querySelectorAll("[role='button'], button")).find((b) =>
      b.textContent?.includes("about.html")
    );
    expect(aboutBtn).toBeDefined();

    await act(async () => {
      aboutBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(switchHandler).toHaveBeenCalledWith(addedIds[1]);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("handles project-level Tailwind config & custom CSS extraction and token distribution", () => {
    const rawConfig = `
      module.exports = {
        theme: {
          extend: {
            colors: {
              cyberpunk: '#ff007f',
              neonblue: '#00f0ff'
            },
            fontFamily: {
              cyber: ['Orbitron', 'sans-serif']
            }
          }
        }
      };
    `;

    const parsedTheme = parseTailwindConfigContent(rawConfig, "tailwind.config.js");
    expect(parsedTheme.colors).toContainEqual(
      expect.objectContaining({ name: "cyberpunk", value: "#ff007f" })
    );
    expect(parsedTheme.fonts).toContainEqual(
      expect.objectContaining({ name: "cyber", stack: "Orbitron, sans-serif" })
    );

    // Set in workspace store
    useWorkspaceStore.getState().setTailwindConfig({
      fileName: "tailwind.config.js",
      rawContent: rawConfig,
      theme: parsedTheme,
    });

    const rawCss = `
      :root {
        --primary-glow: #7928ca;
        --accent-glow: #ff0080;
      }
    `;

    const parsedCss = parseCssThemeContent(rawCss, "style.css");
    expect(parsedCss.colors).toContainEqual(
      expect.objectContaining({ name: "primary-glow", value: "#7928ca" })
    );

    useWorkspaceStore.getState().setCustomStyles({
      fileName: "style.css",
      rawContent: rawCss,
      extractedTheme: {
        colors: parsedCss.colors,
        fonts: parsedCss.fonts,
      },
    });

    const projectConfig = useWorkspaceStore.getState().projectConfig;
    expect(projectConfig.tailwindConfig).not.toBeNull();
    expect(projectConfig.customStyles).not.toBeNull();

    // Verify analyzeHtmlClientSide injects these custom tokens for any HTML page
    const sampleHtml = "<html><body><div class='bg-cyberpunk text-white'>Hello</div></body></html>";
    const analyzeResponse = analyzeHtmlClientSide(sampleHtml, projectConfig);
    const themeMap = analyzeResponse.theme;

    expect(themeMap.colors).toContainEqual(
      expect.objectContaining({ name: "cyberpunk", value: "#ff007f" })
    );
    expect(themeMap.colors).toContainEqual(
      expect.objectContaining({ name: "primary-glow", value: "#7928ca" })
    );
    expect(themeMap.fonts).toContainEqual(
      expect.objectContaining({ name: "cyber", stack: "Orbitron, sans-serif" })
    );
  });

  it("renders Toolbar with active file badge, Project Config button, and Save All", async () => {
    const store = useWorkspaceStore.getState();
    const ids = store.addFiles([
      { name: "index.html", path: "index.html", content: "<h1>Index</h1>" },
      { name: "contact.html", path: "contact.html", content: "<h1>Contact</h1>" },
    ]);

    const onOpenConfig = vi.fn();
    const onSaveAll = vi.fn();
    const onSwitchPage = vi.fn();

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <Toolbar
          fileName="index.html"
          viewport="desktop"
          onViewportChange={vi.fn()}
          onChangeFile={vi.fn()}
          onOpenProjectConfig={onOpenConfig}
          onSaveAll={onSaveAll}
          onSwitchPage={onSwitchPage}
          statusMessage={null}
          historyCount={0}
          onToggleHistory={vi.fn()}
          onOpenReview={vi.fn()}
          onOpenExport={vi.fn()}
          onCopyCode={vi.fn()}
          onCopyJsx={vi.fn()}
          iframeDocument={null}
          leftSidebarOpen={true}
          onToggleLeftSidebar={vi.fn()}
          zoom={1}
          onZoomIn={vi.fn()}
          onZoomOut={vi.fn()}
          onZoomReset={vi.fn()}
          onOpenShortcuts={vi.fn()}
        />
      );
    });

    // Check project config button exists
    const configBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.getAttribute("title")?.includes("Project Config")
    );
    expect(configBtn).toBeDefined();

    await act(async () => {
      configBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onOpenConfig).toHaveBeenCalled();

    // Check page switcher dropdown is displayed
    const switcherBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("index.html")
    );
    expect(switcherBtn).toBeDefined();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("opens ProjectConfigModal and displays uploaded config and styles details", async () => {
    const store = useWorkspaceStore.getState();
    store.setTailwindConfig({
      fileName: "tailwind.config.js",
      rawContent: "module.exports = { theme: { extend: {} } }",
      theme: {
        colors: [{ name: "brand-purple", value: "#8a2be2" }],
        fonts: [{ name: "brand-sans", stack: "Inter, sans-serif" }],
      },
    });

    const onClose = vi.fn();
    const onConfigChanged = vi.fn();

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ProjectConfigModal
          isOpen={true}
          onClose={onClose}
          onConfigChanged={onConfigChanged}
        />
      );
    });

    expect(container.textContent).toContain("Project Config & Styles");
    expect(container.textContent).toContain("tailwind.config.js");
    expect(container.textContent).toContain("brand-purple");
    expect(container.textContent).toContain("brand-sans");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
