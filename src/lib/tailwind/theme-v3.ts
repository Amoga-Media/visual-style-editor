import { parse as acornParse } from "acorn";
import type { ThemeColorToken, ThemeFontToken } from "@/types";

/** Recursively evaluate ONLY literal/object/array AST nodes. Throws on anything else. */
function evalLiteralNode(node: any): unknown {
  switch (node.type) {
    case "Literal":
      return node.value;
    case "ObjectExpression": {
      const obj: Record<string, unknown> = {};
      for (const prop of node.properties) {
        if (prop.type !== "Property") continue;
        const key = prop.key.type === "Identifier" ? prop.key.name : evalLiteralNode(prop.key);
        obj[String(key)] = evalLiteralNode(prop.value);
      }
      return obj;
    }
    case "ArrayExpression":
      return node.elements.map((el: any) => (el ? evalLiteralNode(el) : undefined));
    case "TemplateLiteral":
      if (node.expressions.length === 0) return node.quasis.map((q: any) => q.value.cooked).join("");
      throw new Error("Template literal with interpolation not supported");
    default:
      throw new Error(`Unsupported node type in tailwind.config: ${node.type}`);
  }
}

function extractConfigObject(html: string): Record<string, unknown> | null {
  const scriptRe = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRe.exec(html))) {
    const body = match[1];
    if (!/tailwind\.config\s*=/.test(body)) continue;
    try {
      const ast = acornParse(body, { ecmaVersion: "latest" }) as any;
      for (const stmt of ast.body) {
        if (
          stmt.type === "ExpressionStatement" &&
          stmt.expression.type === "AssignmentExpression" &&
          stmt.expression.left.type === "MemberExpression" &&
          stmt.expression.left.object.name === "tailwind" &&
          stmt.expression.left.property.name === "config"
        ) {
          return evalLiteralNode(stmt.expression.right) as Record<string, unknown>;
        }
      }
    } catch {
      return null;
    }
  }
  return null;
}

function flattenColors(colors: unknown, prefix = ""): ThemeColorToken[] {
  if (typeof colors !== "object" || colors === null) return [];
  const out: ThemeColorToken[] = [];
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === "string") {
      out.push({ name: prefix ? `${prefix}-${key}` : key, value });
    } else if (typeof value === "object" && value !== null) {
      out.push(...flattenColors(value, prefix ? `${prefix}-${key}` : key));
    }
  }
  return out;
}

export function parseV3Theme(html: string): { colors: ThemeColorToken[]; fonts: ThemeFontToken[] } {
  const config = extractConfigObject(html);
  if (!config) return { colors: [], fonts: [] };

  const theme = (config.theme ?? {}) as any;
  const extend = (theme.extend ?? {}) as any;

  const colors = [...flattenColors(theme.colors), ...flattenColors(extend.colors)];

  const fontFamily = { ...(theme.fontFamily ?? {}), ...(extend.fontFamily ?? {}) };
  const fonts: ThemeFontToken[] = Object.entries(fontFamily).map(([name, stack]) => ({
    name,
    stack: Array.isArray(stack) ? stack.join(", ") : String(stack),
  }));

  return { colors, fonts };
}
