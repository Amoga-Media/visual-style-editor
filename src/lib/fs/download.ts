/**
 * Universal save fallback: triggers a browser download of `content` named
 * `filename`. Used whenever the app doesn't hold a FileSystemFileHandle for
 * the open file (Firefox/Safari always; Chromium whenever the file was
 * opened via the plain `<input type="file">` fallback rather than drag-drop
 * or `showOpenFilePicker`) — see file-system-access.ts.
 */
export function downloadHtml(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
