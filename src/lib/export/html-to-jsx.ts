/**
 * Static HTML to React JSX / TSX Converter.
 * Converts static HTML markup and styles into idiomatic React TSX component syntax.
 */

const ATTRIBUTE_MAP: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  maxlength: "maxLength",
  minlength: "minLength",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  autoplay: "autoPlay",
  srcset: "srcSet",
  crossorigin: "crossOrigin",
  colspan: "colSpan",
  rowspan: "rowSpan",
  contenteditable: "contentEditable",
  enctype: "encType",
  novalidate: "noValidate",
  formnovalidate: "formNoValidate",
  usemap: "useMap",
  cellpadding: "cellPadding",
  cellspacing: "cellSpacing",
  // SVG attributes
  viewbox: "viewBox",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
  "clip-path": "clipPath",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
};

const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr"
]);

function toCamelCase(prop: string): string {
  return prop
    .trim()
    .replace(/^-ms-/, "ms-")
    .replace(/-([a-z])/g, (_, g) => g.toUpperCase());
}

function parseStyleStringToObject(styleStr: string): string {
  const declarations = styleStr
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean);

  if (declarations.length === 0) return "{}";

  const entries: string[] = [];
  for (const decl of declarations) {
    const colonIdx = decl.indexOf(":");
    if (colonIdx === -1) continue;
    const rawProp = decl.slice(0, colonIdx).trim();
    const rawVal = decl.slice(colonIdx + 1).trim();
    if (!rawProp || !rawVal) continue;

    const prop = rawProp.startsWith("--") ? `"${rawProp}"` : toCamelCase(rawProp);
    // Escape quotes in value
    const val = JSON.stringify(rawVal);
    entries.push(`${prop}: ${val}`);
  }

  return `{{ ${entries.join(", ")} }}`;
}

/**
 * Converts raw HTML string into clean JSX markup.
 */
export function convertHtmlToJsx(html: string): string {
  if (!html || typeof html !== "string") return "";

  // 1. Extract body content if present, else use full string
  let content = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    content = bodyMatch[1].trim();
  }

  // 2. Convert HTML comments <!-- ... --> to JSX comments {/* ... */}
  content = content.replace(/<!--([\s\S]*?)-->/g, "{/*$1*/}");

  // 2b. Safely handle <script> tags for React JSX with placeholder tokens
  // Handle external script tags: <script src="..."></script> -> <script src="..." />
  content = content.replace(/<script([^>]*\bsrc=[^>]*)>[\s\S]*?<\/script>/gi, (_, attrs) => {
    const cleanAttrs = attrs.replace(/\/$/, "").trim();
    return `__VSE_SCRIPT_EXTERNAL_${encodeURIComponent(cleanAttrs)}__`;
  });

  // Handle inline script tags: wrap in dangerouslySetInnerHTML so JS operators (<, &&) don't break JSX
  content = content.replace(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi, (_, attrs, scriptBody) => {
    const trimmed = scriptBody.trim();
    if (!trimmed) return "";
    const cleanAttrs = attrs.trim() ? ` ${attrs.trim()}` : "";
    return `__VSE_SCRIPT_INLINE_${encodeURIComponent(cleanAttrs)}_${encodeURIComponent(trimmed)}__`;
  });

  // 3. Process element opening tags and attributes
  content = content.replace(/<([a-zA-Z0-9:-]+)([^>]*?)(\/?)>/g, (fullTag, tagName, rawAttrs, selfCloseSlash) => {
    const lowerTag = tagName.toLowerCase();
    const isVoid = VOID_TAGS.has(lowerTag);

    // Transform attributes
    let newAttrs = rawAttrs.replace(
      /([a-zA-Z0-9:-]+)(?:=(["'])([\s\S]*?)\2|=([^\s>]+))?/g,
      (fullAttr: string, attrName: string, quote: string, quotedVal: string, unquotedVal: string) => {
        const lowerAttr = attrName.toLowerCase();
        const rawVal = quotedVal !== undefined ? quotedVal : unquotedVal;

        if (lowerAttr === "style" && rawVal !== undefined) {
          const styleObj = parseStyleStringToObject(rawVal);
          return `style=${styleObj}`;
        }

        const mappedAttr = ATTRIBUTE_MAP[lowerAttr] || ATTRIBUTE_MAP[attrName] || attrName;

        // Boolean attributes without values (e.g. `disabled`, `checked`)
        if (rawVal === undefined) {
          return mappedAttr;
        }

        // Return standard JSX attribute
        return `${mappedAttr}="${rawVal.replace(/"/g, '&quot;')}"`;
      }
    );

    if (isVoid) {
      return `<${tagName}${newAttrs} />`;
    }

    return `<${tagName}${newAttrs}${selfCloseSlash ? " /" : ""}>`;
  });

  // Restore preserved script tags with clean JSX syntax
  content = content.replace(/__VSE_SCRIPT_EXTERNAL_([^_]+)__/g, (_, encodedAttrs) => {
    const attrs = decodeURIComponent(encodedAttrs);
    return `<script ${attrs} />`;
  });
  content = content.replace(/__VSE_SCRIPT_INLINE_([^_]*)_([^_]+)__/g, (_, encodedAttrs, encodedBody) => {
    const attrs = decodeURIComponent(encodedAttrs);
    const body = decodeURIComponent(encodedBody);
    return `<script${attrs} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(body)} }} />`;
  });

  return content;
}

export interface ExportJsxOptions {
  componentName?: string;
  typescript?: boolean;
}

/**
 * Generates a full, formatted React TSX component file from HTML.
 */
export function exportAsReactComponent(
  html: string,
  options?: string | ExportJsxOptions
): string {
  const componentName = typeof options === "string" ? options : options?.componentName || "ExportedComponent";
  const isTsx = typeof options === "object" ? options.typescript !== false : true;

  const jsxMarkup = convertHtmlToJsx(html);
  const indentedJsx = jsxMarkup
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");

  if (isTsx) {
    return `import React from "react";

export interface ${componentName}Props extends React.HTMLAttributes<HTMLDivElement> {}

export const ${componentName}: React.FC<${componentName}Props> = ({ className = '', ...props }) => {
  return (
    <>
${indentedJsx}
    </>
  );
};

export default ${componentName};
`;
  }

  return `import React from "react";

export function ${componentName}() {
  return (
    <>
${indentedJsx}
    </>
  );
}

export default ${componentName};
`;
}

/**
 * Generates a full Next.js Client Component.
 */
export function exportAsNextComponent(html: string, componentName = "Page"): string {
  const jsxMarkup = convertHtmlToJsx(html);
  const indentedJsx = jsxMarkup
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");

  return `"use client";

import React from "react";

export default function ${componentName}() {
  return (
    <main className="min-h-screen">
${indentedJsx}
    </main>
  );
}
`;
}
