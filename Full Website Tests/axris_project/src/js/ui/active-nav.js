/* ─────────────────────────────────────────────────────────
   ACTIVE NAV HIGHLIGHTER
───────────────────────────────────────────────────────── */
export function initActiveNav() {
  const currentPath = window.location.pathname;
  // Select both desktop and mobile links
  const navLinks = document.querySelectorAll(".ax-nav-link, .ax-mobile-navlink");
  // BUG-09 fix: surface a signal instead of failing silently if the navbar
  // component didn't inject (fetch error/404) before this ran.
  if (!navLinks.length) { console.warn("initActiveNav: no nav links found — navbar component may not have loaded."); return; }

  // Strip any pre-existing active classes first
  navLinks.forEach(link => link.classList.remove("active"));

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    // Strict match for Home, loose match for subpages
    if (href === "/" && (currentPath === "/" || currentPath === "/index.html")) {
      link.classList.add("active");
    } else if (href !== "/" && currentPath.includes(href.replace('.html', ''))) {
      link.classList.add("active");
    }
  });
}
