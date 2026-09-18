/**
 * Smoke test: loads each real HTML page + its bundled JS into jsdom,
 * fetches navbar/footer components over real HTTP (server must be running
 * on :8080), and reports any uncaught JS errors. jsdom doesn't implement
 * every browser API GSAP/ScrollTrigger touch (canvas, real layout), so
 * this can't prove animations look right — but it WILL catch reference
 * errors, wrong import paths, and anything that throws before those
 * unimplemented APIs are ever reached, since every init() in the engine
 * runs inside its own try/catch (see core/state.js `run()`).
 *
 * Usage (two terminals):
 *   npm run build   → build first, so assets/ reflects your latest edits
 *   npm run serve   → terminal 1: serves the site on :8080
 *   npm test        → terminal 2: runs this script against it
 */
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:8080";

// Suppresses jsdom's own internal resource-loading noise (e.g. the live
// Google Maps <iframe> embeds on index.html/about-us.html, which jsdom
// tries and fails to fetch in this sandboxed environment) — unrelated to
// our bundled JS, so it shouldn't show up as a false-positive error below.
const virtualConsole = new VirtualConsole();

const pages = [
  "index.html",
  "pages/about-us.html",
  "pages/services.html",
  "pages/case-studies.html",
  "pages/contact.html",
  "pages/casl.html",
  "pages/privacy-policy.html",
  "pages/terms.html",
  "pages/service-pages/abm.html",
  "pages/service-pages/bant-campaign.html",
  "pages/service-pages/content-syndication.html",
  "pages/service-pages/data-cleaning.html",
  "pages/service-pages/demand-generation.html",
  "pages/service-pages/email-marketing.html",
  "pages/service-pages/lead-gen.html",
  "pages/service-pages/lead-nurturing.html",
];

async function testPage(relPath) {
  const url = `${BASE}/${relPath}`;
  const errors = [];

  const dom = new JSDOM("", {
    url,
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      // jsdom has no layout engine — every element reports 0 for these.
      // Stub them so GSAP/ScrollTrigger's internal measurements don't
      // throw; this is exactly the "can't verify visuals" limitation
      // noted above, scoped to just enough that init() functions run.
      window.HTMLElement.prototype.getBoundingClientRect = function () {
        return { top: 0, left: 0, right: 0, bottom: 0, width: 100, height: 100, x: 0, y: 0 };
      };
      window.matchMedia = window.matchMedia || function () {
        return { matches: false, addListener() {}, removeListener() {} };
      };
      if (!window.IntersectionObserver) {
        window.IntersectionObserver = class {
          observe() {}
          unobserve() {}
          disconnect() {}
        };
      }
      window.onerror = (msg) => errors.push(String(msg));
      window.addEventListener("error", (e) => {
        errors.push(e.error ? (e.error.stack || e.error.message) : e.message);
      });
      const origError = window.console.error.bind(window.console);
      window.console.error = (...args) => {
        errors.push("console.error: " + args.map(String).join(" "));
        origError(...args);
      };
    },
  });

  const html = fs.readFileSync(path.join(__dirname, "..", relPath), "utf8");
  dom.window.document.write(html);
  dom.window.document.close();

  // Give deferred scripts + async fetch()/DOMContentLoaded chains time to run
  await new Promise((r) => setTimeout(r, 1500));

  dom.window.close();
  return errors;
}

async function main() {
  let totalErrors = 0;
  for (const p of pages) {
    const errors = await testPage(p);
    if (errors.length) {
      totalErrors += errors.length;
      console.log(`\n✗ ${p} — ${errors.length} error(s):`);
      errors.forEach((e) => console.log(`    ${e}`));
    } else {
      console.log(`✓ ${p}`);
    }
  }
  console.log(`\n${totalErrors === 0 ? "All pages clean." : `${totalErrors} total error(s) found.`}`);
  process.exit(totalErrors === 0 ? 0 : 1);
}

main();
