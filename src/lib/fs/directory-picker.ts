import { isHtmlFile } from "./is-html-file";
import { parseTailwindConfigContent } from "../tailwind/config-parser";
import { parseCssThemeContent } from "../tailwind/css-theme-parser";
import type { UploadedConfig, UploadedStyles } from "@/types";

export interface IngestedProject {
  htmlFiles: Array<{ name: string; path: string; content: string; handle?: FileSystemFileHandle | null }>;
  tailwindConfig?: UploadedConfig | null;
  customStyles?: UploadedStyles | null;
  nonHtmlCount: number;
}

const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", ".astro", ".agents", "skills", ".next", ".nuxt", "build"]);

export async function readDirectoryHandle(
  dirHandle: any,
  currentPath = ""
): Promise<IngestedProject> {
  const result: IngestedProject = {
    htmlFiles: [],
    tailwindConfig: null,
    customStyles: null,
    nonHtmlCount: 0,
  };

  async function traverse(handle: any, relPath: string) {
    for await (const entry of handle.values()) {
      if (entry.kind === "directory") {
        if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
          await traverse(entry, relPath ? `${relPath}/${entry.name}` : entry.name);
        }
      } else if (entry.kind === "file") {
        const file = await entry.getFile();
        const filePath = relPath ? `${relPath}/${entry.name}` : entry.name;
        const lowerName = entry.name.toLowerCase();

        if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
          const content = await file.text();
          result.htmlFiles.push({
            name: entry.name,
            path: filePath,
            content,
            handle: entry,
          });
        } else if (lowerName.includes("tailwind.config") && (lowerName.endsWith(".js") || lowerName.endsWith(".cjs") || lowerName.endsWith(".mjs") || lowerName.endsWith(".ts") || lowerName.endsWith(".json"))) {
          const rawContent = await file.text();
          const parsed = parseTailwindConfigContent(rawContent, entry.name);
          result.tailwindConfig = {
            fileName: entry.name,
            rawContent,
            theme: parsed,
          };
        } else if (lowerName.endsWith(".css") && (lowerName === "style.css" || lowerName === "styles.css" || lowerName === "globals.css" || lowerName === "main.css" || lowerName === "app.css" || !result.customStyles)) {
          const rawContent = await file.text();
          const parsed = parseCssThemeContent(rawContent, entry.name);
          result.customStyles = {
            fileName: entry.name,
            rawContent,
            extractedTheme: {
              colors: parsed.colors,
              fonts: parsed.fonts,
            },
          };
        } else {
          result.nonHtmlCount++;
        }
      }
    }
  }

  await traverse(dirHandle, currentPath);
  return result;
}

export async function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    try {
      return await file.text();
    } catch {}
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export async function processDroppedFileList(
  files: File[],
  handles?: (FileSystemFileHandle | null)[]
): Promise<IngestedProject> {
  const result: IngestedProject = {
    htmlFiles: [],
    tailwindConfig: null,
    customStyles: null,
    nonHtmlCount: 0,
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const handle = handles?.[i] || null;
    const lowerName = file.name.toLowerCase();
    const filePath = (file as any).webkitRelativePath || file.name;

    if (isHtmlFile(file)) {
      try {
        const content = await readFileText(file);
        result.htmlFiles.push({
          name: file.name,
          path: filePath,
          content,
          handle,
        });
      } catch {}
    } else if (lowerName.includes("tailwind.config") && (lowerName.endsWith(".js") || lowerName.endsWith(".cjs") || lowerName.endsWith(".mjs") || lowerName.endsWith(".ts") || lowerName.endsWith(".json"))) {
      try {
        const rawContent = await readFileText(file);
        const parsed = parseTailwindConfigContent(rawContent, file.name);
        result.tailwindConfig = {
          fileName: file.name,
          rawContent,
          theme: parsed,
        };
      } catch {}
    } else if (lowerName.endsWith(".css")) {
      try {
        const rawContent = await readFileText(file);
        const parsed = parseCssThemeContent(rawContent, file.name);
        result.customStyles = {
          fileName: file.name,
          rawContent,
          extractedTheme: {
            colors: parsed.colors,
            fonts: parsed.fonts,
          },
        };
      } catch {}
    } else {
      result.nonHtmlCount++;
    }
  }

  return result;
}

export async function readWebkitDirectoryEntry(entry: any): Promise<File[]> {
  const files: File[] = [];
  async function readEntry(item: any) {
    if (item.isFile) {
      try {
        const file = await new Promise<File>((resolve, reject) => item.file(resolve, reject));
        files.push(file);
      } catch {}
    } else if (item.isDirectory) {
      if (IGNORED_DIRS.has(item.name) || item.name.startsWith(".")) return;
      try {
        const reader = item.createReader();
        const entries = await new Promise<any[]>((resolve, reject) => reader.readEntries(resolve, reject));
        for (const child of entries) {
          await readEntry(child);
        }
      } catch {}
    }
  }
  await readEntry(entry);
  return files;
}

