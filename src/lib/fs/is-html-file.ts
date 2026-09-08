/** True if `file` looks like an HTML file by extension or MIME type. */
export function isHtmlFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".html") || name.endsWith(".htm") || file.type === "text/html";
}
