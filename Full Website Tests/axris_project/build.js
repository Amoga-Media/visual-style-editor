#!/usr/bin/env node
/**
 * JS BUILD SCRIPT
 * ------------------------------------------------------------
 * Bundles the ES modules under src/js/ into the plain <script defer>
 * files every HTML page already loads. GSAP, ScrollTrigger, Lenis
 * and @supabase/supabase-js are real npm dependencies (package.json)
 * and get bundled straight into these output files — there is no
 * CDN and no /assets/vendor/*.min.js to keep in sync by hand.
 *
 * Entry points → outputs:
 *   src/js/main.js              → assets/js/main.js               (every page)
 *   src/js/pages/contact.js      → assets/js/pages/contact.js       (contact.html only)
 *   src/js/pages/case-studies.js → assets/js/pages/case-studies.js  (case-studies.html only)
 *
 * contact.js and case-studies.js no longer bundle their own copy of GSAP/
 * ScrollTrigger — see the external-global plugin below, which resolves
 * their `import ... from "gsap"` to the window.gsap global main.js already
 * set up (fixes architecture.md §7.1).
 *
 * Each is bundled independently (format: "iife") so every HTML page
 * only ever needs plain <script src="..." defer></script> tags — no
 * type="module", no import-map, nothing that breaks if a page is
 * opened directly off disk instead of through a real server.
 *
 * Usage:
 *   node build.js            → one-off build, minified
 *   node build.js --watch    → rebuild on any src/js change
 */
const path = require("path");
const esbuild = require("esbuild");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src", "js");
const OUT = path.join(ROOT, "assets", "js");

/**
 * external-global plugin (fixes architecture.md §7.1 — GSAP/ScrollTrigger
 * bundled a second time into every page-specific entry point).
 *
 * main.js loads on every page and, once it registers GSAP/ScrollTrigger
 * (src/js/core/lenis-setup.js), assigns them to window.gsap /
 * window.ScrollTrigger. contact.js and case-studies.js both load *after*
 * main.js on their respective pages (see architecture.md §4.4), so instead
 * of letting esbuild bundle a second full copy of GSAP core into each of
 * them, this plugin intercepts `import { gsap } from "gsap"` /
 * `import { ScrollTrigger } from "gsap/ScrollTrigger"` in those two entry
 * points only and resolves them to the already-loaded globals instead.
 *
 * Result: ~90KB+ of duplicate vendor code removed from each of
 * contact.js and case-studies.js (see roadmap.md / architecture.md for the
 * measured before-sizes).
 */
function externalGlobalPlugin(mapping) {
  return {
    name: "external-global",
    setup(build) {
      for (const mod of Object.keys(mapping)) {
        const filter = new RegExp(`^${mod.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
        build.onResolve({ filter }, () => ({ path: mod, namespace: "external-global" }));
      }
      build.onLoad({ filter: /.*/, namespace: "external-global" }, (args) => ({
        contents: mapping[args.path],
        loader: "js",
      }));
    },
  };
}

const gsapGlobalShim = externalGlobalPlugin({
  gsap: "module.exports = { gsap: window.gsap };",
  "gsap/ScrollTrigger": "module.exports = { ScrollTrigger: window.ScrollTrigger };",
});

const entries = [
  { in: path.join(SRC, "main.js"), out: path.join(OUT, "main.js") },
  {
    in: path.join(SRC, "pages", "contact.js"),
    out: path.join(OUT, "pages", "contact.js"),
    plugins: [gsapGlobalShim],
  },
  // Perf pass: @supabase/supabase-js used to be bundled directly into
  // contact.js (~190KB of its ~213KB). It's now its own entry point,
  // loaded lazily at runtime (idle-time prefetch, or on submit) by
  // contact.js's loadSubmitChunk() rather than parsed/executed as part
  // of the page's critical initial script — see contact-submit.js's own
  // header comment.
  {
    in: path.join(SRC, "pages", "contact-submit.js"),
    out: path.join(OUT, "pages", "contact-submit.js"),
  },
  {
    in: path.join(SRC, "pages", "case-studies.js"),
    out: path.join(OUT, "pages", "case-studies.js"),
    plugins: [gsapGlobalShim],
  },
];

const watch = process.argv.includes("--watch");

async function buildOne({ in: entryPoint, out: outfile, plugins = [] }) {
  return esbuild.build({
    entryPoints: [entryPoint],
    outfile,
    bundle: true,
    format: "iife",
    target: ["es2019"],
    minify: !watch,
    sourcemap: watch ? "inline" : false,
    logLevel: "info",
    plugins,
  });
}

async function buildAll() {
  await Promise.all(entries.map(buildOne));
}

async function main() {
  if (!watch) {
    await buildAll();
    return;
  }

  // esbuild's own incremental "watch" API rebuilds a single entry point on
  // its own file changes; since we have four independent entry points that
  // don't share a graph, four independent watch contexts keep rebuilds
  // scoped to only the bundle whose source actually changed.
  const contexts = await Promise.all(
    entries.map((e) =>
      esbuild.context({
        entryPoints: [e.in],
        outfile: e.out,
        bundle: true,
        format: "iife",
        target: ["es2019"],
        sourcemap: "inline",
        logLevel: "info",
        plugins: e.plugins || [],
      })
    )
  );
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log("[build-js] watching src/js/ for changes…");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
