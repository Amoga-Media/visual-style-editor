/* ─────────────────────────────────────────────────────────
   CONTACT FORM — SUBMIT CHUNK (lazy-loaded)
   ------------------------------------------------------------
   Perf pass: @supabase/supabase-js alone accounted for ~190KB of
   the ~213KB minified contact.js bundle — all of it parsed and
   evaluated on every visit to contact.html even though it's only
   ever *used* at the moment someone submits the form. Splitting
   it into its own entry point (see build.js) means the browser
   no longer has to fetch/parse/execute it as part of the page's
   critical initial script — it loads in the background during
   idle time instead (see loadSubmitChunk() in pages/contact.js),
   and is ready by the time a real visitor finishes filling out
   four fields.

   Submission contract (Supabase URL/key, `contact_submissions`
   table + column names) is UNCHANGED — see file-ownership.md,
   Responsibility 10: this is a loading-strategy change only, not
   a change to what gets sent or where.
───────────────────────────────────────────────────────── */
import { createClient } from "@supabase/supabase-js";

let _sb;
function getSupabaseClient() {
  if (!_sb) {
    _sb = createClient(
      "https://mpwsiaarnccddejnkjdm.supabase.co",
      "sb_publishable_YmSZSZKrQ3TzI0PH1qfang_5l1eYC5Z"
    );
  }
  return _sb;
}

// Exposed as a global rather than an ES export because this file is loaded
// via a plain injected <script> tag (iife bundle — see build.js), not an
// import, so pages/contact.js can call it without needing module loading
// semantics of its own (keeps every page's markup free of type="module",
// matching the rest of the site — see build.js's own header comment).
window.__axSubmitContact = function (payload) {
  return getSupabaseClient().from("contact_submissions").insert([payload]);
};

// Lets pages/contact.js's loader resolve immediately if this script was
// already requested (e.g. the idle-time prefetch) before it's needed.
window.dispatchEvent(new Event("ax:contact-submit-ready"));
