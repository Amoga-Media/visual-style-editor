#!/usr/bin/env node
/**
 * CSS BUILD SCRIPT
 * ------------------------------------------------------------
 * Assembles src/css/main.css into one file, then runs it through
 * the Tailwind CLI.
 *
 * Why not the postcss-import plugin? Because it (correctly) enforces
 * the real CSS spec rule that @import must precede every other
 * statement in a file. This project intentionally imports some
 * partials BEFORE the @tailwind directives and some AFTER them
 * (see the comment in src/css/main.css for why the split matters),
 * so a spec-compliant @import resolver can't do it — it silently
 * drops any @import that isn't first. This script is a ~40-line
 * stand-in that resolves @import "./relative/path.css"; anywhere in
 * the file, in place, with no such restriction.
 *
 * Usage:
 *   node scripts/build-css.js            → one-off build, minified
 *   node scripts/build-css.js --watch    → rebuild on any src/css change
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.join(__dirname, "..");
const CSS_DIR = path.join(ROOT, "src", "css");
const ENTRY = path.join(CSS_DIR, "main.css");
const TMP_ENTRY = path.join(ROOT, ".tmp", "main.assembled.css");
const OUT = path.join(ROOT, "assets", "css", "main.css");

const IMPORT_RE = /^\s*@import\s+["']([^"']+)["'];\s*$/;

function assemble(filePath, seen) {
  const resolved = path.resolve(filePath);
  if (seen.has(resolved)) {
    throw new Error(`Circular @import detected at ${resolved}`);
  }
  const dir = path.dirname(resolved);
  return fs
    .readFileSync(resolved, "utf8")
    .split("\n")
    .map((line) => {
      const match = line.match(IMPORT_RE);
      if (!match) return line;
      return assemble(path.join(dir, match[1]), new Set(seen).add(resolved));
    })
    .join("\n");
}

function buildEntry() {
  fs.mkdirSync(path.dirname(TMP_ENTRY), { recursive: true });
  fs.writeFileSync(TMP_ENTRY, assemble(ENTRY, new Set()));
}

function walkDirs(dir, acc = []) {
  acc.push(dir);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) walkDirs(path.join(dir, entry.name), acc);
  }
  return acc;
}

const watch = process.argv.includes("--watch");

try {
  buildEntry();
} catch (err) {
  console.error("[build-css] " + err.message);
  process.exit(1);
}

// Resolve the local Tailwind CLI script directly instead of shelling out to
// `npx`. `tailwindcss`'s "bin" is a plain Node script (lib/cli.js), so it can
// be run as `node <script> <args>` with args passed as an array. This avoids
// `shell: true`, which on Windows concatenates argv into one command-line
// string and — since it doesn't quote paths containing spaces — silently
// truncates any path like "...\Axris main Folder\..." at the first space.
const tailwindCli = require.resolve("tailwindcss/lib/cli.js");

const tailwindArgs = [tailwindCli, "-i", TMP_ENTRY, "-o", OUT];
if (!watch) tailwindArgs.push("--minify");
if (watch) tailwindArgs.push("--watch");

const tw = spawn(process.execPath, tailwindArgs, { stdio: "inherit" });

if (watch) {
  console.log("[build-css] watching src/css/ for changes…");
  for (const dir of walkDirs(CSS_DIR)) {
    fs.watch(dir, { recursive: false }, (_event, filename) => {
      if (!filename || !filename.endsWith(".css")) return;
      try {
        buildEntry(); // touching the tmp file re-triggers Tailwind's own --watch
      } catch (err) {
        console.error("[build-css] " + err.message);
      }
    });
  }
}

tw.on("exit", (code) => process.exit(code ?? 0));
