import { gsap, ease, state, Draggable } from "../motion/core.js";

/* ─────────────────────────────────────────────────────────
   MOBILE NAV
   ------------------------------------------------------------
   Session 9 (mobile experience redesign) additions on top of the
   original open/close + services-accordion logic: a real focus trap
   while the dialog is open (previously Tab could escape into the page
   content sitting behind it — a real keyboard-trap failure for a
   `role="dialog" aria-modal="true"` element), focus restored to the
   hamburger on close (previously focus was dropped to <body>), and a
   swipe-down-to-dismiss gesture on a dedicated drag handle so the menu
   has a native, tactile mobile interaction instead of only a tap
   target for closing.
───────────────────────────────────────────────────────── */
export function initMobileNav() {
  const hamburger = document.getElementById("ax-hamburger");
  const mobileMenu = document.getElementById("ax-mobile-menu");
  const closeBtn = document.getElementById("ax-mobile-close");
  const dragHandle = document.getElementById("ax-mobile-drag-handle");

  // Accordion elements
  const servicesBtn = document.getElementById("ax-mobile-services-btn");
  const submenu = document.getElementById("ax-mobile-submenu");
  const servicesIcon = document.getElementById("ax-services-icon");

  if (!hamburger || !mobileMenu) return;
  let isOpen = false;

  /* ── Focus trap ─────────────────────────────────────────────
     Standard roving-boundary trap: on Tab, if focus would leave the
     dialog's first/last focusable element, wrap it back around instead.
     Recomputed on every keydown (not cached once) since the services
     accordion opening/closing changes which elements are actually
     visible/focusable inside the panel. */
  function getFocusable() {
    return Array.from(
      mobileMenu.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter((el) => el.offsetParent !== null);
  }

  function trapFocus(e) {
    if (e.key !== "Tab" || !isOpen) return;
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

  function openMenu() {
    isOpen = true;
    mobileMenu.classList.add("ax-menu--open");
    mobileMenu.setAttribute("aria-hidden", "false");
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.classList.add("ax-ham--open");
    if (state.lenis) state.lenis.stop(); else document.body.style.overflow = "hidden";

    // Reset opacity before animating
    document.querySelectorAll(".ax-mobile-navlink, .ax-mobile-sublink").forEach(el => {
      el.style.opacity = "0";
      el.style.transform = "translateX(40px)";
    });

    gsap.fromTo(".ax-mobile-navlink, .ax-mobile-sublink",
      { opacity: 0, x: 40 },
      { opacity: 1, x: 0, duration: 0.4, stagger: 0.04, ease: ease.enter, delay: 0.18 }
    );

    // Move focus into the dialog once its open transition has had a
    // moment to start — the close button reads as the natural first
    // stop (mirrors where a thumb already is, top-right, right after
    // tapping the hamburger in the same corner).
    window.setTimeout(() => { if (closeBtn) closeBtn.focus(); }, 60);
  }

  function closeMenu() {
    isOpen = false;
    mobileMenu.classList.remove("ax-menu--open");
    mobileMenu.setAttribute("aria-hidden", "true");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.classList.remove("ax-ham--open");
    if (state.lenis) state.lenis.start(); else document.body.style.overflow = "";

    // Optionally close accordion when menu closes
    if (submenu && submenu.classList.contains("open")) {
      submenu.classList.remove("open");
      if (servicesIcon) servicesIcon.style.transform = "rotate(0deg)";
      if (servicesBtn) servicesBtn.setAttribute("aria-expanded", "false");
    }

    // Return focus to the control that opened the dialog — without this,
    // focus silently drops to <body> and a keyboard/screen-reader user
    // loses their place in the page entirely.
    hamburger.focus();
  }

  hamburger.addEventListener("click", () => (isOpen ? closeMenu() : openMenu()));
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  // Close menu when a link is clicked (but ignore the accordion toggle button itself)
  document.querySelectorAll(".ax-mobile-navlink, .ax-mobile-sublink").forEach((el) => {
    if (el.id !== "ax-mobile-services-btn") {
      el.addEventListener("click", closeMenu);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closeMenu();
    else trapFocus(e);
  });

  // Mobile Services Accordion Logic
  if (servicesBtn && submenu) {
    servicesBtn.addEventListener("click", (e) => {
      e.preventDefault();
      submenu.classList.toggle("open");
      if (submenu.classList.contains("open")) {
        if (servicesIcon) servicesIcon.style.transform = "rotate(180deg)";
        servicesBtn.setAttribute("aria-expanded", "true");
      } else {
        if (servicesIcon) servicesIcon.style.transform = "rotate(0deg)";
        servicesBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ── Swipe-down-to-dismiss ────────────────────────────────────
     A dedicated handle (not the whole panel — see markup, navbar.html)
     so an ordinary vertical scroll/tap inside the menu's link list is
     never mistaken for a dismiss gesture; only a drag that starts on
     the handle itself moves the panel. Reuses the same GSAP Draggable
     already bundled for the marquee (motion/drag.js) rather than
     hand-rolling touch listeners — one drag engine for the whole site.
     The panel's *open/close* transform is owned declaratively by
     navbar.css's `.ax-menu--open` class; this only ever writes a
     temporary inline transform while a drag is physically in progress,
     and always clears it afterwards (either by finishing the close via
     closeMenu(), which the CSS class fully re-owns, or by tweening back
     to y:0 and stripping the inline style with clearProps) so the two
     systems never fight over which one is authoritative at rest. */
  if (dragHandle) {
    Draggable.create(mobileMenu, {
      type: "y",
      trigger: dragHandle,
      allowNativeTouchScrolling: false,
      onPress() {
        // Draggable caches its own internal x/y baseline once, at
        // Draggable.create() time — which happens on page load, while
        // this panel is still in its closed (translateY(-100%)) state.
        // Every open/close after that is driven by navbar.css's
        // .ax-menu--open class, entirely outside Draggable's knowledge,
        // so its internal tracking goes stale the first time the menu
        // is opened normally (via the hamburger, not a drag). Setting
        // y:0 alone only fixes the *visual* position; update(true)
        // is what tells Draggable to re-read that as its new baseline,
        // so this session's math (dismissThreshold comparisons, the
        // upward-pull clamp below) is measured against where the panel
        // actually is rather than a stale creation-time reference.
        gsap.set(mobileMenu, { y: 0 });
        this.update(true);
      },
      onDrag() {
        if (this.y < 0) gsap.set(mobileMenu, { y: 0 }); // no pulling upward past the top
      },
      onRelease() {
        const dismissThreshold = Math.min(160, window.innerHeight * 0.22);
        if (this.y > dismissThreshold) {
          gsap.to(mobileMenu, {
            y: window.innerHeight,
            duration: 0.32,
            ease: ease.glide,
            onComplete: () => {
              closeMenu();
              gsap.set(mobileMenu, { clearProps: "transform" });
            },
          });
        } else {
          gsap.to(mobileMenu, {
            y: 0,
            duration: 0.4,
            ease: ease.snap,
            onComplete: () => gsap.set(mobileMenu, { clearProps: "transform" }),
          });
        }
      },
    });
  }
}
