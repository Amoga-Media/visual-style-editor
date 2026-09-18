import type { WorkspaceFile, ProjectConfig } from "@/types";

const SESSION_STORAGE_KEY = "vse_workspace_session_v1";

export interface WorkspaceSessionData {
  files: Array<{
    id: string;
    name: string;
    path: string;
    content: string;
    originalContent: string;
    isDirty: boolean;
  }>;
  activeFileId: string | null;
  projectConfig: ProjectConfig;
  savedAt: number;
}

/**
 * Save workspace files and configs to localStorage.
 * Gracefully handles localStorage quota exceeded errors.
 */
export function saveWorkspaceSession(
  files: WorkspaceFile[],
  activeFileId: string | null,
  projectConfig: ProjectConfig
): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;

  try {
    const serializedFiles = files.map((f) => ({
      id: f.id,
      name: f.name,
      path: f.path || f.name,
      content: f.content,
      originalContent: f.originalContent || f.content,
      isDirty: Boolean(f.isDirty),
    }));

    const sessionData: WorkspaceSessionData = {
      files: serializedFiles,
      activeFileId,
      projectConfig,
      savedAt: Date.now(),
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    return true;
  } catch {
    // If storage is full, attempt to save minimal data
    try {
      const minimalFiles = files.map((f) => ({
        id: f.id,
        name: f.name,
        path: f.path || f.name,
        content: f.content,
        originalContent: f.content,
        isDirty: Boolean(f.isDirty),
      }));
      const minimalData: WorkspaceSessionData = {
        files: minimalFiles,
        activeFileId,
        projectConfig,
        savedAt: Date.now(),
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(minimalData));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Load workspace session from localStorage.
 */
export function loadWorkspaceSession(): WorkspaceSessionData | null {
  if (typeof window === "undefined" || !window.localStorage) return null;

  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceSessionData;
    if (parsed && Array.isArray(parsed.files) && parsed.files.length > 0) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear the saved workspace session from localStorage.
 */
export function clearWorkspaceSession(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {}
}
