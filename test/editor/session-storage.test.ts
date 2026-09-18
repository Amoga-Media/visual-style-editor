import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveWorkspaceSession, loadWorkspaceSession, clearWorkspaceSession } from "@/lib/fs/session-storage";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { WorkspaceFile } from "@/types";

describe("Workspace Session Storage & Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkspaceStore.getState().resetWorkspace();
  });

  it("persists workspace files, active file selection, and project config to localStorage", () => {
    const mockFiles: WorkspaceFile[] = [
      {
        id: "index-html",
        name: "index.html",
        path: "index.html",
        content: "<h1>Home Page</h1>",
        originalContent: "<h1>Home Page</h1>",
        handle: null,
        edits: [],
        undoPast: [],
        undoFuture: [],
        versionHistory: [{ id: 1, label: "Original", html: "<h1>Home Page</h1>" }],
        isDirty: false,
      },
      {
        id: "about-html",
        name: "about.html",
        path: "about.html",
        content: "<h1>About Us</h1>",
        originalContent: "<h1>About Us</h1>",
        handle: null,
        edits: [],
        undoPast: [],
        undoFuture: [],
        versionHistory: [{ id: 1, label: "Original", html: "<h1>About Us</h1>" }],
        isDirty: true,
      },
    ];

    const projectConfig = {
      tailwindConfig: {
        rawContent: "module.exports = { theme: { extend: {} } }",
        fileName: "tailwind.config.js",
        theme: { colors: [], fonts: [] },
      },
    };

    const saved = saveWorkspaceSession(mockFiles, "about-html", projectConfig);
    expect(saved).toBe(true);

    const loaded = loadWorkspaceSession();
    expect(loaded).not.toBeNull();
    expect(loaded?.files.length).toBe(2);
    expect(loaded?.activeFileId).toBe("about-html");
    expect(loaded?.projectConfig?.tailwindConfig?.fileName).toBe("tailwind.config.js");
    expect(loaded?.files[1].isDirty).toBe(true);
  });

  it("restores persisted session through useWorkspaceStore.loadPersistedSession()", () => {
    // Add multiple files to store which automatically saves session
    useWorkspaceStore.getState().addFiles([
      { name: "page-1.html", content: "<div>Page 1</div>" },
      { name: "page-2.html", content: "<div>Page 2</div>" },
    ]);
    useWorkspaceStore.getState().switchActiveFile("page-2.html");

    // Reset in-memory store (simulating browser reload)
    useWorkspaceStore.setState({ files: [], activeFileId: null, projectConfig: {} });
    expect(useWorkspaceStore.getState().files.length).toBe(0);

    // Call loadPersistedSession
    const restored = useWorkspaceStore.getState().loadPersistedSession();
    expect(restored).toBe(true);
    expect(useWorkspaceStore.getState().files.length).toBe(2);
    expect(useWorkspaceStore.getState().activeFileId).toBe("page-2.html");
  });

  it("handles storage quota errors gracefully and falls back to minimal saving", () => {
    let callCount = 0;
    const originalSetItem = localStorage.setItem.bind(localStorage);

    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
      callCount++;
      if (callCount === 1) {
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      }
      originalSetItem(key, value);
    });

    const mockFiles: WorkspaceFile[] = [
      {
        id: "index-html",
        name: "index.html",
        path: "index.html",
        content: "<p>Large test content</p>",
        originalContent: "<p>Large test content</p>",
        handle: null,
        edits: [],
        undoPast: [],
        undoFuture: [],
        versionHistory: [],
        isDirty: false,
      },
    ];

    const result = saveWorkspaceSession(mockFiles, "index-html", {});
    expect(result).toBe(true);
    expect(callCount).toBe(2); // Retried with fallback minimal payload
  });

  it("clears workspace session on reset", () => {
    useWorkspaceStore.getState().addFile({ name: "test.html", content: "<div>Test</div>" });
    expect(loadWorkspaceSession()).not.toBeNull();

    useWorkspaceStore.getState().resetWorkspace();
    expect(loadWorkspaceSession()).toBeNull();
  });
});
