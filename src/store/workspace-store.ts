import { create } from "zustand";
import type { WorkspaceFile, ProjectConfig, UploadedConfig, UploadedStyles, EditRecord } from "@/types";
import type { VersionEntry } from "@/lib/fs/version-history";
import { saveWorkspaceSession, loadWorkspaceSession, clearWorkspaceSession } from "@/lib/fs/session-storage";

interface WorkspaceState {
  files: WorkspaceFile[];
  activeFileId: string | null;
  projectConfig: ProjectConfig;

  // Actions
  addFile: (file: { name: string; path?: string; content: string; handle?: FileSystemFileHandle | null }) => string;
  addFiles: (
    files: Array<{
      name: string;
      path?: string;
      content: string;
      handle?: FileSystemFileHandle | null;
    }>
  ) => string[];
  switchActiveFile: (fileId: string) => void;
  updateFileContent: (id: string, content: string) => void;
  syncActiveFileState: (
    fileId: string,
    state: {
      edits?: EditRecord[];
      undoPast?: EditRecord[][];
      undoFuture?: EditRecord[][];
      versionHistory?: VersionEntry[];
      content?: string;
    }
  ) => void;
  markFileSaved: (fileId: string, newContent: string, newVersionEntry?: VersionEntry) => void;
  duplicateFile: (fileId: string) => string | null;
  renameFile: (fileId: string, newName: string) => void;
  removeFile: (fileId: string) => void;
  setTailwindConfig: (config: UploadedConfig | null) => void;
  setCustomStyles: (styles: UploadedStyles | null) => void;
  resetWorkspace: () => void;
  loadPersistedSession: () => boolean;
  getActiveFile: () => WorkspaceFile | null;
}

function generateFileId(name: string, existingFiles: WorkspaceFile[]): string {
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9_.-]/g, "-");
  let id = baseSlug;
  let counter = 1;
  while (existingFiles.some((f) => f.id === id)) {
    id = `${baseSlug}-${counter}`;
    counter++;
  }
  return id;
}

function autoPersist(files: WorkspaceFile[], activeFileId: string | null, projectConfig: ProjectConfig) {
  saveWorkspaceSession(files, activeFileId, projectConfig);
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  files: [],
  activeFileId: null,
  projectConfig: {},

  getActiveFile: () => {
    const { files, activeFileId } = get();
    return files.find((f) => f.id === activeFileId) || null;
  },

  loadPersistedSession: () => {
    const session = loadWorkspaceSession();
    if (!session || !session.files || session.files.length === 0) return false;

    const files: WorkspaceFile[] = session.files.map((f) => ({
      id: f.id,
      name: f.name,
      path: f.path || f.name,
      content: f.content,
      originalContent: f.originalContent || f.content,
      handle: null,
      edits: [],
      undoPast: [],
      undoFuture: [],
      versionHistory: [{ id: 1, label: "Restored from session", html: f.content }],
      isDirty: f.isDirty,
    }));

    const activeFileId =
      session.activeFileId && files.some((f) => f.id === session.activeFileId)
        ? session.activeFileId
        : files[0].id;

    set({
      files,
      activeFileId,
      projectConfig: session.projectConfig || {},
    });
    return true;
  },

  addFile: (fileData) => {
    const id = generateFileId(fileData.name, get().files);
    const newFile: WorkspaceFile = {
      id,
      name: fileData.name,
      path: fileData.path || fileData.name,
      content: fileData.content,
      originalContent: fileData.content,
      handle: fileData.handle || null,
      edits: [],
      undoPast: [],
      undoFuture: [],
      versionHistory: [{ id: 1, label: "Original as opened", html: fileData.content }],
      isDirty: false,
    };

    const updatedFiles = [...get().files, newFile];
    const nextActiveId = get().activeFileId ?? id;

    set({
      files: updatedFiles,
      activeFileId: nextActiveId,
    });

    autoPersist(updatedFiles, nextActiveId, get().projectConfig);
    return id;
  },

  addFiles: (incomingFiles) => {
    if (!incomingFiles || incomingFiles.length === 0) return [];

    const currentFiles = [...get().files];
    const newWorkspaceFiles: WorkspaceFile[] = [];

    for (const f of incomingFiles) {
      const id = generateFileId(f.name, [...currentFiles, ...newWorkspaceFiles]);
      newWorkspaceFiles.push({
        id,
        name: f.name,
        path: f.path || f.name,
        content: f.content,
        originalContent: f.content,
        handle: f.handle || null,
        edits: [],
        undoPast: [],
        undoFuture: [],
        versionHistory: [{ id: 1, label: "Original as opened", html: f.content }],
        isDirty: false,
      });
    }

    const updatedFiles = [...currentFiles, ...newWorkspaceFiles];
    const nextActiveId = get().activeFileId ?? (updatedFiles[0]?.id || null);

    set({
      files: updatedFiles,
      activeFileId: nextActiveId,
    });

    autoPersist(updatedFiles, nextActiveId, get().projectConfig);
    return newWorkspaceFiles.map((f) => f.id);
  },

  removeFile: (id) => {
    const updatedFiles = get().files.filter((f) => f.id !== id);
    let nextActiveId = get().activeFileId;
    if (get().activeFileId === id) {
      nextActiveId = updatedFiles[0]?.id || null;
    }

    set({
      files: updatedFiles,
      activeFileId: nextActiveId,
    });

    autoPersist(updatedFiles, nextActiveId, get().projectConfig);
  },

  switchActiveFile: (id) => {
    const fileExists = get().files.some((f) => f.id === id);
    if (fileExists) {
      set({ activeFileId: id });
      autoPersist(get().files, id, get().projectConfig);
    }
  },

  updateFileContent: (id, content) => {
    const updatedFiles = get().files.map((f) => {
      if (f.id !== id) return f;
      return {
        ...f,
        content,
        isDirty: content !== f.originalContent || f.edits.length > 0,
      };
    });

    set({ files: updatedFiles });
    autoPersist(updatedFiles, get().activeFileId, get().projectConfig);
  },

  syncActiveFileState: (id, state) => {
    const updatedFiles = get().files.map((f) => {
      if (f.id !== id) return f;
      const newEdits = state.edits ?? f.edits;
      const newContent = state.content ?? f.content;
      const isDirty = (newEdits.length > 0) || (newContent !== f.originalContent);

      return {
        ...f,
        edits: newEdits,
        undoPast: state.undoPast ?? f.undoPast,
        undoFuture: state.undoFuture ?? f.undoFuture,
        versionHistory: state.versionHistory ?? f.versionHistory,
        content: newContent,
        isDirty,
      };
    });

    set({ files: updatedFiles });
    autoPersist(updatedFiles, get().activeFileId, get().projectConfig);
  },

  duplicateFile: (id) => {
    const source = get().files.find((f) => f.id === id);
    if (!source) return "";

    const extIndex = source.name.lastIndexOf(".");
    const baseName = extIndex !== -1 ? source.name.slice(0, extIndex) : source.name;
    const ext = extIndex !== -1 ? source.name.slice(extIndex) : ".html";
    const duplicateName = `${baseName}-copy${ext}`;

    const newId = generateFileId(duplicateName, get().files);
    const newFile: WorkspaceFile = {
      id: newId,
      name: duplicateName,
      path: duplicateName,
      content: source.content,
      originalContent: source.content,
      handle: null, // Clones don't inherit disk file handle
      edits: [...source.edits],
      undoPast: [...source.undoPast],
      undoFuture: [...source.undoFuture],
      versionHistory: [{ id: 1, label: "Original as opened", html: source.content }],
      isDirty: true,
    };

    const updatedFiles = [...get().files, newFile];
    set({
      files: updatedFiles,
      activeFileId: newId,
    });

    autoPersist(updatedFiles, newId, get().projectConfig);
    return newId;
  },

  renameFile: (id, newName) => {
    if (!newName.trim()) return;
    const updatedFiles = get().files.map((f) => (f.id === id ? { ...f, name: newName.trim(), path: newName.trim() } : f));
    set({ files: updatedFiles });
    autoPersist(updatedFiles, get().activeFileId, get().projectConfig);
  },

  setTailwindConfig: (config) => {
    const newConfig = {
      ...get().projectConfig,
      tailwindConfig: config,
    };
    set({ projectConfig: newConfig });
    autoPersist(get().files, get().activeFileId, newConfig);
  },

  setCustomStyles: (styles) => {
    const newConfig = {
      ...get().projectConfig,
      customStyles: styles,
    };
    set({ projectConfig: newConfig });
    autoPersist(get().files, get().activeFileId, newConfig);
  },

  markFileSaved: (id, newContent) => {
    const updatedFiles = get().files.map((f) => {
      if (f.id !== id) return f;
      return {
        ...f,
        content: newContent,
        originalContent: newContent,
        edits: [],
        isDirty: false,
      };
    });

    set({ files: updatedFiles });
    autoPersist(updatedFiles, get().activeFileId, get().projectConfig);
  },

  resetWorkspace: () => {
    clearWorkspaceSession();
    set({
      files: [],
      activeFileId: null,
      projectConfig: {},
    });
  },
}));
