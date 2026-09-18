import { parse as acornParse } from "acorn";
import type { ThemeColorToken, ThemeFontToken, ThemeMap } from "@/types";

/** Recursively evaluate ONLY literal/object/array AST nodes safely without eval. */
function evalAstNode(node: any): unknown {
  if (!node) return undefined;
  switch (node.type) {
    case "Literal":
      return node.value;
    case "Identifier":
      return node.name;
    case "UnaryExpression":
      if (node.operator === "-" && node.argument?.type === "Literal") {
        return -node.argument.value;
      }
      return undefined;
    case "ObjectExpression": {
      const obj: Record<string, unknown> = {};
      for (const prop of node.properties) {
        if (prop.type !== "Property") continue;
        const key =
          prop.key.type === "Identifier"
            ? prop.key.name
            : prop.key.type === "Literal"
            ? String(prop.key.value)
            : String(evalAstNode(prop.key));
        obj[key] = evalAstNode(prop.value);
      }
      return obj;
    }
    case "ArrayExpression":
      return node.elements.map((el: any) => (el ? evalAstNode(el) : undefined));
    case "TemplateLiteral":
      if (node.expressions.length === 0) {
        return node.quasis.map((q: any) => q.value.cooked).join("");
      }
      return node.quasis.map((q: any) => q.value.cooked).join("");
    default:
      return undefined;
  }
}

function extractObjectFromAst(ast: any): Record<string, unknown> | null {
  if (!ast || !ast.body) return null;

  for (const stmt of ast.body) {
    // 1. module.exports = { ... } or exports.default = { ... }
    if (stmt.type === "ExpressionStatement" && stmt.expression.type === "AssignmentExpression") {
      const left = stmt.expression.left;
      if (
        (left.type === "MemberExpression" && left.object?.name === "module" && left.property?.name === "exports") ||
        (left.type === "MemberExpression" && left.object?.name === "exports")
      ) {
        const result = evalAstNode(stmt.expression.right);
        if (typeof result === "object" && result !== null) {
          return result as Record<string, unknown>;
        }
      }
    }

    // 2. export default { ... }
    if (stmt.type === "ExportDefaultDeclaration") {
      const decl = stmt.declaration;
      const result = evalAstNode(decl);
      if (typeof result === "object" && result !== null) {
        return result as Record<string, unknown>;
      }
    }

    // 3. const config = { ... }; export default config;
    if (stmt.type === "VariableDeclaration") {
      for (const declarator of stmt.declarations) {
        if (declarator.id?.name === "config" || declarator.id?.name === "tailwindConfig") {
          const result = evalAstNode(declarator.init);
          if (typeof result === "object" && result !== null) {
            return result as Record<string, unknown>;
          }
        }
      }
    }
  }

  // Fallback: search for first ObjectExpression in AST
  for (const stmt of ast.body) {
    if (stmt.type === "ExpressionStatement" && stmt.expression.type === "ObjectExpression") {
      const result = evalAstNode(stmt.expression);
      if (typeof result === "object" && result !== null) return result as Record<string, unknown>;
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

export function parseTailwindConfigContent(
  rawContent: string,
  fileName = "tailwind.config.js"
): { colors: ThemeColorToken[]; fonts: ThemeFontToken[]; mode: ThemeMap["mode"] } {
  let configObj: Record<string, unknown> | null = null;

  // Check if JSON
  if (fileName.endsWith(".json") || rawContent.trim().startsWith("{")) {
    try {
      configObj = JSON.parse(rawContent);
    } catch {}
  }

  // Parse JS/TS/CJS/MJS with acorn
  if (!configObj) {
    try {
      // Strip TS type annotations like `import type { Config } from 'tailwindcss'` or `: Config`
      const cleaned = rawContent
        .replace(/import\s+type\s+[^;]+;/g, "")
        .replace(/import\s+[^;]+;/g, "")
        .replace(/:\s*Config\b/g, "")
        .replace(/satisfies\s+Config\b/g, "");

      const ast = acornParse(cleaned, {
        ecmaVersion: "latest",
        sourceType: "module",
      }) as any;

      configObj = extractObjectFromAst(ast);
    } catch {
      // Try script mode
      try {
        const ast = acornParse(rawContent, {
          ecmaVersion: "latest",
          sourceType: "script",
        }) as any;
        configObj = extractObjectFromAst(ast);
      } catch {}
    }
  }

  if (!configObj) {
    return { colors: [], fonts: [], mode: "v3" };
  }

  const theme = (configObj.theme ?? {}) as any;
  const extend = (theme.extend ?? {}) as any;

  const colors = [...flattenColors(theme.colors), ...flattenColors(extend.colors)];

  const fontFamily = { ...(theme.fontFamily ?? {}), ...(extend.fontFamily ?? {}) };
  const fonts: ThemeFontToken[] = Object.entries(fontFamily).map(([name, stack]) => ({
    name,
    stack: Array.isArray(stack) ? stack.join(", ") : String(stack),
  }));

  return {
    colors,
    fonts,
    mode: "v3",
  };
}
