/**
 * Converts HTML markup into an Astro component template (.astro).
 */
export function convertHtmlToAstro(html: string, title = "VisualComponent"): string {
  if (!html || typeof html !== "string") return "";

  // Extract body content if present
  let bodyContent = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    bodyContent = bodyMatch[1].trim();
  }

  // Extract head styles or scripts if present
  const styleMatches = Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi));
  const styles = styleMatches.map((m) => m[0]).join("\n\n");

  return `---
// Generated with Visual Style Editor
interface Props {
  class?: string;
}

const { class: className, ...props } = Astro.props;
---

<div class={className} {...props}>
  ${bodyContent}
</div>
${styles ? `\n${styles}\n` : ""}
`;
}
