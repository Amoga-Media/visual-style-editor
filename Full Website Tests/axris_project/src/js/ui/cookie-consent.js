/* ─────────────────────────────────────────────────────────
   COOKIE CONSENT
───────────────────────────────────────────────────────── */
export function initCookieConsent() {
  if (localStorage.getItem("ax-cookie-consent")) return;
  const banner = document.createElement("div");
  banner.id = "ax-cookie-banner";
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "Cookie consent");
  banner.innerHTML = `
    <div class="ax-cookie-inner">
      <div class="ax-cookie-icon" aria-hidden="true">🍪</div>
      <div class="ax-cookie-text">
        <h4>We use cookies &amp; tracking</h4>
        <p>We use cookies and analytics to improve your experience on axrissolutions.com. We comply with <strong>GDPR</strong> and <strong>CASL</strong>. <a href="/pages/privacy-policy.html">Privacy Policy</a> · <a href="/pages/casl.html">CASL</a></p>
      </div>
      <div class="ax-cookie-actions">
        <button id="ax-cookie-decline">Decline</button>
        <button id="ax-cookie-accept" class="ax-cookie-primary">Accept All</button>
      </div>
    </div>`;
  document.body.appendChild(banner);
  setTimeout(() => banner.classList.add("ax-cookie--visible"), 900);

  function dismiss(choice) {
    localStorage.setItem("ax-cookie-consent", choice);
    banner.classList.remove("ax-cookie--visible");
    setTimeout(() => banner.remove(), 400);
  }

  document.getElementById("ax-cookie-accept").addEventListener("click", () => dismiss("accepted"));
  document.getElementById("ax-cookie-decline").addEventListener("click", () => dismiss("declined"));
}
