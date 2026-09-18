import { describe, it, expect, beforeEach } from "vitest";
import { useWorkspaceStore } from "@/store/workspace-store";

describe("workspace-store", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspace();
  });

  it("adds multiple files and automatically sets first file active", () => {
    const store = useWorkspaceStore.getState();
    store.addFiles([
      { name: "index.html", content: "<h1>Home</h1>" },
      { name: "about.html", content: "<h1>About</h1>" },
    ]);

    const state = useWorkspaceStore.getState();
    expect(state.files).toHaveLength(2);
    expect(state.files[0].name).toBe("index.html");
    expect(state.files[1].name).toBe("about.html");
    expect(state.activeFileId).toBe(state.files[0].id);
    expect(state.getActiveFile()?.name).toBe("index.html");
  });

  it("switches active file accurately", () => {
    const store = useWorkspaceStore.getState();
    store.addFiles([
      { name: "index.html", content: "<h1>Home</h1>" },
      { name: "pricing.html", content: "<h1>Pricing</h1>" },
    ]);

    const state = useWorkspaceStore.getState();
    const pricingId = state.files[1].id;
    store.switchActiveFile(pricingId);

    expect(useWorkspaceStore.getState().activeFileId).toBe(pricingId);
    expect(useWorkspaceStore.getState().getActiveFile()?.name).toBe("pricing.html");
  });

  it("syncs active file state (edits, undo, history) without polluting other files", () => {
    const store = useWorkspaceStore.getState();
    store.addFiles([
      { name: "page1.html", content: "<div>Page 1</div>" },
      { name: "page2.html", content: "<div>Page 2</div>" },
    ]);

    const file1Id = useWorkspaceStore.getState().files[0].id;
    const file2Id = useWorkspaceStore.getState().files[1].id;

    store.syncActiveFileState(file1Id, {
      edits: [
        {
          kind: "class",
          structuralPath: "body>div:nth-of-type(1)",
          property: "background-color",
          oldClassList: [],
          newClassList: ["bg-red-500"],
          timestamp: new Date().toISOString(),
        },
      ],
      content: "<div class='bg-red-500'>Page 1</div>",
    });

    const state = useWorkspaceStore.getState();
    expect(state.files[0].isDirty).toBe(true);
    expect(state.files[0].edits).toHaveLength(1);
    expect(state.files[1].isDirty).toBe(false);
    expect(state.files[1].edits).toHaveLength(0);
  });

  it("duplicates file and marks clone as dirty", () => {
    const store = useWorkspaceStore.getState();
    store.addFile({ name: "landing.html", content: "<header>Hero</header>" });

    const sourceId = useWorkspaceStore.getState().files[0].id;
    const cloneId = store.duplicateFile(sourceId);

    const state = useWorkspaceStore.getState();
    expect(state.files).toHaveLength(2);
    expect(state.files[1].id).toBe(cloneId);
    expect(state.files[1].name).toBe("landing-copy.html");
    expect(state.activeFileId).toBe(cloneId);
  });

  it("stores and updates project Tailwind config and custom styles", () => {
    const store = useWorkspaceStore.getState();
    store.setTailwindConfig({
      fileName: "tailwind.config.js",
      rawContent: "module.exports = { theme: { extend: { colors: { brand: '#ff0055' } } } }",
      theme: {
        mode: "v3-cdn",
        colors: [{ name: "brand", value: "#ff0055" }],
        fonts: [],
      },
    });

    store.setCustomStyles({
      fileName: "style.css",
      rawContent: ":root { --custom-accent: #00ffcc; }",
      extractedTheme: {
        colors: [{ name: "custom-accent", value: "#00ffcc" }],
      },
    });

    const config = useWorkspaceStore.getState().projectConfig;
    expect(config.tailwindConfig?.theme.colors?.[0].name).toBe("brand");
    expect(config.customStyles?.extractedTheme?.colors?.[0].name).toBe("custom-accent");
  });
});
