/* ─────────────────────────────────────────────────────────
   HTML COMPONENT INJECTOR
───────────────────────────────────────────────────────── */
export async function loadComponents() {
  try {
    // Fetch both in parallel for speed, but inject sequentially so DOM is
    // fully settled (both innerHTML writes complete) before the function returns.
    const [navRes, footerRes] = await Promise.all([
      fetch("/assets/components/navbar.html"),
      fetch("/assets/components/footer.html"),
    ]);

    const [navHtml, footerHtml] = await Promise.all([
      navRes.text(),
      footerRes.text(),
    ]);

    const navContainer = document.getElementById("global-nav");
    const footerContainer = document.getElementById("global-footer");

    if (navContainer) navContainer.innerHTML = navHtml;
    if (footerContainer) footerContainer.innerHTML = footerHtml;

    // One rAF to let the browser paint the injected HTML before engine starts
    await new Promise((resolve) => requestAnimationFrame(resolve));
  } catch (error) {
    console.warn("Components failed to load.", error);
  }
}
