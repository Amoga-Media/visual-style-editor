#!/usr/bin/env node
/**
 * ASSET VERSIONING (perf pass)
 * ------------------------------------------------------------
 * .htaccess now sends `Cache-Control: public, max-age=31536000,
 * immutable` for assets/css/main.css and every assets/js/**\/*.js file.
 * A year-long cache on a *stable filename* is only safe if the filename
 * changes whenever the content does — otherwise a returning visitor can
 * be stuck on a stale bundle for up to a year after a real deploy.
 *
 * Rather than rename the built files themselves (would mean rewriting
 * build.js/build-css.js's output paths and every reference to them, a
 * bigger structural change), this appends a short content-hash query
 * string — `?v=<hash>` — to every reference to a built CSS/JS file
 * across every HTML page, plus the one dynamic reference inside
 * contact.js itself (the runtime <script> tag it injects to lazy-load
 * contact-submit.js — see pages/contact.js). A cache lookup treats
 * `main.css?v=abc123` and `main.css?v=def456` as two different URLs, so
 * a content change automatically busts the old cache entry without
 * needing to lower the cache lifetime for everyone else.
 *
 * Idempotent: safe to run multiple times (e.g. every `npm run build`)
 * — matches and replaces any existing `?v=...` on these specific paths
 * rather than accumulating query strings.
 *
 * Usage: node scripts/version-assets.js   (run after build:css + build:js)
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");

function hashFile(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return null;
  const contents = fs.readFileSync(abs);
  return crypto.createHash("sha256").update(contents).digest("hex").slice(0, 10);
}

const ASSET_PATHS = [
  "assets/css/main.css",
  "assets/js/main.js",
  "assets/js/pages/contact.js",
  "assets/js/pages/contact-submit.js",
  "assets/js/pages/case-studies.js",
];

function findHtmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findHtmlFiles(full, out);
    } else if (entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

function main() {
  // 1. Hash contact-submit.js and rewrite contact.js's own runtime
  //    reference to it FIRST — this mutates contact.js's on-disk content,
  //    so contact.js's own hash (step 2) must be computed *after* this,
  //    or the ?v= this script puts on <script src="contact.js"> tags
  //    would describe content contact.js no longer has.
  const contactSubmitHash = hashFile("assets/js/pages/contact-submit.js");
  const contactJsPath = path.join(ROOT, "assets/js/pages/contact.js");
  if (fs.existsSync(contactJsPath) && contactSubmitHash) {
    let js = fs.readFileSync(contactJsPath, "utf-8");
    const versioned = `/assets/js/pages/contact-submit.js?v=${contactSubmitHash}`;
    const re = /\/assets\/js\/pages\/contact-submit\.js(?:\?v=[a-f0-9]+)?/g;
    fs.writeFileSync(contactJsPath, js.replace(re, versioned), "utf-8");
  }

  // 2. Now hash every built asset, including contact.js's just-updated
  //    final content.
  const hashes = {};
  for (const rel of ASSET_PATHS) {
    const h = hashFile(rel);
    if (h) hashes[rel] = h;
  }

  if (Object.keys(hashes).length === 0) {
    console.warn("[version-assets] no built assets found — run build:css/build:js first");
    return;
  }

  // 3. Rewrite every HTML page's <link>/<script> references using those
  //    final hashes.
  const htmlFiles = [
    ...findHtmlFiles(path.join(ROOT, "pages")),
    path.join(ROOT, "index.html"),
  ];

  let htmlFilesChanged = 0;
  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, "utf-8");
    let changed = false;
    for (const [rel, hash] of Object.entries(hashes)) {
      const urlPath = "/" + rel;
      // Matches href="/assets/css/main.css" or src="/assets/js/main.js",
      // optionally already carrying a ?v=... from a previous run.
      const re = new RegExp(
        `((?:href|src)=")${urlPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\?v=[a-f0-9]+)?(")`,
        "g"
      );
      const next = html.replace(re, `$1${urlPath}?v=${hash}$2`);
      if (next !== html) changed = true;
      html = next;
    }
    if (changed) {
      fs.writeFileSync(file, html, "utf-8");
      htmlFilesChanged++;
    }
  }

  console.log(`[version-assets] hashed ${Object.keys(hashes).length} asset(s), updated ${htmlFilesChanged} HTML file(s)`);
  for (const [rel, hash] of Object.entries(hashes)) {
    console.log(`  ${rel} -> ?v=${hash}`);
  }
}

main();
