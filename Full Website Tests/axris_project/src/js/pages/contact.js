/* ─────────────────────────────────────────────────────────
   CONTACT PAGE — form submission + success/error modals
   ------------------------------------------------------------
   Bundled to assets/js/pages/contact.js and loaded ONLY on
   contact.html, after main.js.

   Perf pass: @supabase/supabase-js (~190KB minified) no longer
   lives in this file — it's its own lazy-loaded chunk,
   pages/contact-submit.js (built to assets/js/pages/
   contact-submit.js), fetched via loadSubmitChunk() below rather
   than bundled here. That keeps this file — the one that has to
   parse and run before the form is even interactive — small.
   See loadSubmitChunk()'s own comment for the loading strategy.

   Note for future edits: this file is a real ES module, not an
   inline <script>, so its functions are NOT on `window` and
   can't be wired up via onclick="..."/onsubmit="..." attributes
   in the HTML. Instead this file attaches its own listeners
   below (to #contact-form, and to the two modals' buttons) once
   the DOM is ready. If you add a new button that needs one of
   these actions, give it an id and addEventListener it here —
   don't add an inline onclick attribute back in the HTML.
───────────────────────────────────────────────────────── */
import { gsap } from "gsap";

// This bundle is intentionally standalone (no import from motion/core.js —
// see file header) so it re-derives the one motion preference it actually
// needs rather than pulling in the full engine for a single check.
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The four required fields, keyed by id. "Primary Interest" and "Message"
// are intentionally excluded — the HTML never marked them required and
// nothing about this pass changes that.
const FIELD_RULES = {
  first_name: { label: "First name" },
  last_name: { label: "Last name" },
  work_email: { label: "Work email", email: true },
  company_name: { label: "Company name" },
};

// Loads assets/js/pages/contact-submit.js — the chunk that actually bundles
// @supabase/supabase-js — via a plain injected <script>, not import(), to
// stay consistent with every other bundle on this site (iife, no
// type="module" anywhere — see build.js). Idempotent: safe to call
// multiple times (prefetch on idle, then again on submit) — the promise is
// cached, and if the global is already there (script finished, or was
// somehow inlined) it resolves immediately without re-injecting anything.
let _submitChunkPromise;
function loadSubmitChunk() {
  if (window.__axSubmitContact) return Promise.resolve();
  if (_submitChunkPromise) return _submitChunkPromise;

  _submitChunkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/assets/js/pages/contact-submit.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("contact-submit chunk failed to load"));
    document.head.appendChild(script);
  });
  return _submitChunkPromise;
}

// Warms the chunk during idle time so it's already cached/parsed by the
// time a real visitor reaches the submit button — this is a courtesy
// prefetch, not a requirement: handleFormSubmit() below calls
// loadSubmitChunk() itself either way, so a visitor who submits before
// idle time ever fires (or on a browser without requestIdleCallback) still
// gets the chunk, just fetched right at submit time instead of ahead of it.
function prefetchSubmitChunk() {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => loadSubmitChunk().catch(() => {}), { timeout: 4000 });
  } else {
    setTimeout(() => loadSubmitChunk().catch(() => {}), 2000);
  }
}

// Finds (or creates, once) the error message paragraph belonging to a
// field. Reuses forms.css's existing .form-error-text hook rather than
// inventing a new one, and wires aria-describedby so screen readers
// announce the message, not just the aria-invalid state.
function getErrorEl(input) {
  let el = input.parentElement.querySelector(".form-error-text");
  if (!el) {
    el = document.createElement("p");
    el.className = "form-error-text";
    el.id = `${input.id}-error`;
    el.setAttribute("role", "alert");
    input.insertAdjacentElement("afterend", el);
  }
  return el;
}

// Required + (for work_email) format check. Returns true when valid.
// Called on blur (first pass), on input while already-invalid (so a fix
// clears itself immediately instead of waiting for the next blur), and
// up front on submit.
function validateField(input) {
  const rule = FIELD_RULES[input.id];
  if (!rule) return true;

  const value = input.value.trim();
  let message = "";
  if (!value) {
    message = `${rule.label} is required.`;
  } else if (rule.email && !EMAIL_RE.test(value)) {
    message = "Enter a valid work email address.";
  }

  const errorEl = getErrorEl(input);
  if (message) {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", errorEl.id);
    errorEl.textContent = message;
  } else {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
    errorEl.textContent = "";
  }
  return !message;
}

// ── Dialog focus management ──────────────────────────────────────────
// Both #success-modal and #error-modal are role="dialog" aria-modal="true"
// but, before this pass, opening one never moved focus into it, Tab could
// escape into the form sitting behind it, Escape didn't close it, and
// closing it never returned focus to whatever the user had been on —
// exactly the four things mobile-nav.js's dialog already gets right for
// the mobile menu. Same fix, applied here too, factored into one small
// controller since both modals share an identical shape (backdrop +
// content + one primary button, sometimes a second link).
function makeDialogController(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return null;
  let lastFocused = null;
  let onRequestClose = null; // the real close-and-animate-out function for whichever dialog this is, supplied by open()

  function getFocusable() {
    return Array.from(
      modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter((el) => el.offsetParent !== null);
  }

  function handleBackdropClick() {
    if (onRequestClose) onRequestClose();
  }

  function trapFocus(e) {
    if (e.key === "Escape") {
      if (onRequestClose) onRequestClose();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = getFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // requestClose: the dialog's own closeModal()/closeErrorModal() — the
  // function that actually plays the fade-out and flips aria-hidden.
  // Escape and a backdrop click both route through it rather than through
  // this controller's own restoreFocus(), so every way of dismissing the
  // dialog ends up doing the exact same thing the "Got it"/"Close" button
  // already does.
  function open(requestClose) {
    onRequestClose = requestClose;
    lastFocused = document.activeElement;
    modal.addEventListener("keydown", trapFocus);
    const backdrop = modal.querySelector(".modal-backdrop");
    if (backdrop) backdrop.addEventListener("click", handleBackdropClick);
    // Give the open transition a moment to start, same delay mobile-nav
    // uses, then move focus to the first real control inside the dialog.
    window.setTimeout(() => {
      const focusable = getFocusable();
      if (focusable.length) focusable[0].focus();
    }, 120);
  }

  // Called from the dialog's real close function once it's actually
  // dismissing — undoes what open() wired up and, without this, focus
  // would silently drop to <body> and a keyboard/screen-reader user
  // would lose their place on the page.
  function restoreFocus() {
    modal.removeEventListener("keydown", trapFocus);
    const backdrop = modal.querySelector(".modal-backdrop");
    if (backdrop) backdrop.removeEventListener("click", handleBackdropClick);
    onRequestClose = null;
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  return { open, restoreFocus };
}

function clearAllErrors(form) {
  Object.keys(FIELD_RULES).forEach((id) => {
    const input = form.querySelector(`#${id}`);
    if (!input) return;
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
    const errorEl = input.parentElement.querySelector(".form-error-text");
    if (errorEl) errorEl.textContent = "";
  });
}

// A small, fast horizontal shake — same "acknowledge the failed attempt"
// role the magnetic buttons' mousedown scale plays for a successful one.
// Reduced-motion visitors get the border/glow color change from
// forms.css's [aria-invalid] rule instead, with no added movement.
function shakeField(input) {
  if (prefersReducedMotion) return;
  gsap.fromTo(input, { x: -6 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.5)" });
}

function wireFieldValidation(form) {
  Object.keys(FIELD_RULES).forEach((id) => {
    const input = form.querySelector(`#${id}`);
    if (!input) return;
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") validateField(input);
    });
  });
}


// Submit form data to Supabase and then trigger modal
async function handleFormSubmit(e) {
  e.preventDefault();

  const form = e.target;

  // Validate every required field up front rather than relying on native
  // HTML constraint validation (disabled via novalidate on the <form> —
  // see contact.html) — this way a failed attempt gets the same crafted,
  // on-brand treatment as everything else on this page instead of the
  // browser's default tooltip.
  const invalidInputs = Object.keys(FIELD_RULES)
    .map((id) => form.querySelector(`#${id}`))
    .filter((input) => input && !validateField(input));

  if (invalidInputs.length) {
    invalidInputs.forEach(shakeField);
    invalidInputs[0].focus();
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  const originalHTML = btn.innerHTML;

  // Button Loading State
  btn.disabled = true;
  btn.innerHTML = `<svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Sending…`;

  // Gather data using the IDs on the inputs
  const payload = {
    first_name: document.getElementById("first_name").value.trim(),
    last_name: document.getElementById("last_name").value.trim(),
    work_email: document.getElementById("work_email").value.trim(),
    company_name: document.getElementById("company_name").value.trim(),
    primary_interest:
      document.getElementById("primary_interest").value || null,
    message: document.getElementById("message").value.trim() || null,
  };

  // Send to Supabase DB — loadSubmitChunk() resolves immediately if the
  // idle-time prefetch already finished; otherwise it fetches the chunk
  // right now, so submission still works, just with one extra network
  // round trip on the (uncommon) case of a very fast submit.
  let error;
  try {
    await loadSubmitChunk();
    ({ error } = await window.__axSubmitContact(payload));
  } catch (chunkError) {
    error = chunkError;
  }

  // Restore button state
  btn.disabled = false;
  btn.innerHTML = originalHTML;

  // If something fails on the database side
  if (error) {
    console.error("Supabase error:", error);
    showErrorModal();
    return;
  }

  // If it succeeds, trigger the popup animations
  e.target.reset();
  clearAllErrors(form);
  showModal();
}

// One controller per dialog, created once at module load — see
// makeDialogController()'s own comment for what each one owns.
const successDialog = makeDialogController("success-modal");
const errorDialog = makeDialogController("error-modal");

// GSAP Animations
function showModal() {
  const modal = document.getElementById("success-modal");
  const backdrop = modal.querySelector(".modal-backdrop");
  const content = modal.querySelector(".modal-content");

  modal.classList.remove("invisible");
  modal.setAttribute("aria-hidden", "false");
  gsap.to(backdrop, { opacity: 1, duration: 0.3 });
  gsap.to(content, {
    opacity: 1,
    scale: 1,
    y: 0,
    duration: 0.5,
    ease: "back.out(1.2)",
    delay: 0.1,
  });
  if (successDialog) successDialog.open(closeModal);
}

function closeModal() {
  const modal = document.getElementById("success-modal");
  const backdrop = modal.querySelector(".modal-backdrop");
  const content = modal.querySelector(".modal-content");

  gsap.to(content, {
    opacity: 0,
    scale: 0.95,
    y: 10,
    duration: 0.3,
    ease: "power2.in",
  });
  gsap.to(backdrop, {
    opacity: 0,
    duration: 0.3,
    delay: 0.1,
    onComplete: () => {
      modal.classList.add("invisible");
      modal.setAttribute("aria-hidden", "true");
    },
  });
  if (successDialog) successDialog.restoreFocus();
}

function showErrorModal() {
  const modal = document.getElementById("error-modal");
  const backdrop = modal.querySelector(".modal-backdrop");
  const content = modal.querySelector(".modal-content");

  modal.classList.remove("invisible");
  modal.setAttribute("aria-hidden", "false");
  gsap.to(backdrop, { opacity: 1, duration: 0.3 });
  gsap.to(content, {
    opacity: 1,
    scale: 1,
    y: 0,
    duration: 0.5,
    ease: "back.out(1.2)",
    delay: 0.1,
  });
  if (errorDialog) errorDialog.open(closeErrorModal);
}

function closeErrorModal() {
  const modal = document.getElementById("error-modal");
  const backdrop = modal.querySelector(".modal-backdrop");
  const content = modal.querySelector(".modal-content");

  gsap.to(content, {
    opacity: 0,
    scale: 0.95,
    y: 10,
    duration: 0.3,
    ease: "power2.in",
  });
  gsap.to(backdrop, {
    opacity: 0,
    duration: 0.3,
    delay: 0.1,
    onComplete: () => {
      modal.classList.add("invisible");
      modal.setAttribute("aria-hidden", "true");
    },
  });
  if (errorDialog) errorDialog.restoreFocus();
}

function wireUp() {
  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
    wireFieldValidation(form);
    prefetchSubmitChunk();
  }

  const successClose = document.querySelector("#success-modal button");
  if (successClose) successClose.addEventListener("click", closeModal);

  const errorClose = document.querySelector("#error-modal button");
  if (errorClose) errorClose.addEventListener("click", closeErrorModal);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireUp);
} else {
  wireUp();
}
