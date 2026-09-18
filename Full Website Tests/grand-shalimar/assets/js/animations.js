/**
 * animations.js
 * All GSAP / ScrollTrigger / Lenis powered motion for the site.
 * Loaded on every page — each block checks that its target elements exist
 * before doing anything, so this one file works site-wide with no errors
 * on pages that don't use a given animation.
 *
 * Each block below is wrapped in its own try/catch and logs a console
 * warning rather than throwing. Without this, one failing block (e.g. a
 * CDN script blocked by an ad-blocker, or a flaky network load) would
 * silently stop every animation defined after it in this file — including
 * the hero reveal at the very bottom, since browsers abort the rest of a
 * <script> the moment it throws an uncaught error.
 */

/* ------------------------------------------------------------------ */
/* Smooth scroll (Lenis) — shared by every page, exposed on window     */
/* so main.js can pause/resume it (e.g. while the mobile menu is open) */
/* ------------------------------------------------------------------ */
try {
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
    });
    window.lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
} catch (err) {
    console.warn('[animations.js] Lenis smooth-scroll failed to start, falling back to native scroll:', err);
}

/* ------------------------------------------------------------------ */
/* Magnetic buttons (hero "Explore Dishes", "View Best") — desktop      */
/* pointer devices only, so touch never gets a stuck offset            */
/* ------------------------------------------------------------------ */
try {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.querySelectorAll('.magnetic').forEach((el) => {
            const wrap = el.closest('.magnetic-wrap') || el.parentElement;
            wrap.addEventListener('mousemove', (e) => {
                const position = wrap.getBoundingClientRect();
                const x = e.clientX - position.left - position.width / 2;
                const y = e.clientY - position.top - position.height / 2;
                gsap.to(el, { x: x * 0.4, y: y * 0.4, duration: 1, ease: 'power3.out' });
            });
            wrap.addEventListener('mouseleave', () => {
                gsap.to(el, { x: 0, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.3)' });
            });
        });
    }
} catch (err) {
    console.warn('[animations.js] Magnetic button setup failed:', err);
}

/* ------------------------------------------------------------------ */
/* Homepage "View All Latest" zoom section: pinned zoom on desktop/     */
/* tablet, a calmer fade-in on phones (no scroll-jacking on touch)      */
/* ------------------------------------------------------------------ */
try {
    if (document.getElementById('zoom-section')) {
        const mm = gsap.matchMedia();

        mm.add('(min-width: 768px)', () => {
            const zoomTl = gsap.timeline({
                scrollTrigger: {
                    trigger: '#zoom-section',
                    start: 'top top',
                    end: '+=1200',
                    scrub: 1,
                    pin: true,
                },
            });

            zoomTl.to('.zoom-text', { opacity: 0, duration: 0.3 }, 0);
            zoomTl.to('#zoom-wrapper', {
                width: '100vw',
                height: '100vh',
                borderRadius: '0%',
                duration: 1,
                ease: 'power2.inOut',
            }, 0);
            zoomTl.to('#zoom-image', { borderWidth: '0px', duration: 1 }, 0);
        });

        mm.add('(max-width: 767px)', () => {
            gsap.from('#zoom-wrapper', {
                scale: 0.85,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: { trigger: '#zoom-section', start: 'top 70%', toggleActions: 'play none none reverse' },
            });
        });
    }
} catch (err) {
    console.warn('[animations.js] Zoom section animation failed:', err);
}

/* ------------------------------------------------------------------ */
/* Parallax float on the hero plates (desktop/tablet only)             */
/* ------------------------------------------------------------------ */
try {
    const floatMm = gsap.matchMedia();
    floatMm.add('(min-width: 768px)', () => {
        gsap.utils.toArray('.gsap-float-1').forEach((el) => {
            gsap.to(el, { y: -30, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 } });
        });
        gsap.utils.toArray('.gsap-float-2').forEach((el) => {
            gsap.to(el, { y: 40, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.5 } });
        });
        gsap.utils.toArray('.gsap-float-3').forEach((el) => {
            gsap.to(el, { y: -50, x: 20, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 2 } });
        });
    });
} catch (err) {
    console.warn('[animations.js] Parallax float setup failed:', err);
}

/* ------------------------------------------------------------------ */
/* Floating "Magic Pot" ingredient cutouts (ambient, looping)           */
/* ------------------------------------------------------------------ */
try {
    gsap.utils.toArray('.gsap-cutout').forEach((cutout, i) => {
        gsap.to(cutout, {
            y: 'random(-14, 14)',
            x: 'random(-8, 8)',
            rotation: 'random(-10, 10)',
            duration: 'random(2, 4)',
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
            delay: i * 0.2,
        });
    });
} catch (err) {
    console.warn('[animations.js] Floating cutout animation failed:', err);
}

/* ------------------------------------------------------------------ */
/* Standard scroll reveal used across every page                       */
/* ------------------------------------------------------------------ */
try {
    gsap.utils.toArray('.gsap-fade-up').forEach((el) => {
        gsap.from(el, {
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
        });
    });
} catch (err) {
    console.warn('[animations.js] Scroll-reveal (.gsap-fade-up) setup failed:', err);
}

/* ------------------------------------------------------------------ */
/* Homepage hero load-in                                                */
/* Runs the fade/rise-in intro only the FIRST time a visitor lands on   */
/* the homepage in a given browser session (sessionStorage flag below), */
/* so navigating Home -> another page -> back to Home shows the hero    */
/* instantly instead of replaying the intro.                            */
/*                                                                       */
/* The intro itself is intentionally quick (title starts immediately,   */
/* settles by ~0.6s; the divider/paragraph start at 0.1s and settle by   */
/* ~0.65s) — it previously didn't start the divider/paragraph until      */
/* 0.8s in and didn't fully settle until ~2s, which is long enough that  */
/* a normal glance at the page (or a quick screenshot) catches it        */
/* mid-animation and reads as broken. A first visit should never look    */
/* incomplete, so "fast" matters more here than the animation being      */
/* dramatic.                                                             */
/* ------------------------------------------------------------------ */
try {
    if (document.querySelector('.gsap-hero-title')) {
        let alreadyPlayed = false;
        try { alreadyPlayed = sessionStorage.getItem('heroIntroPlayed') === '1'; } catch (err) { /* private-mode storage access can throw; fall back to always animating */ }

        if (alreadyPlayed) {
            gsap.set('.gsap-hero-title, .gsap-fade', { clearProps: 'all' });
        } else {
            gsap.from('.gsap-hero-title', { y: 30, opacity: 0, duration: 0.6, ease: 'power2.out' });
            gsap.from('.gsap-fade', { y: 15, opacity: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out', delay: 0.1 });
            try { sessionStorage.setItem('heroIntroPlayed', '1'); } catch (err) { /* ignore — worst case the intro replays */ }
        }
    }
} catch (err) {
    console.warn('[animations.js] Hero load-in animation failed:', err);
}

/* ------------------------------------------------------------------ */
/* Back/forward cache (bfcache) recovery                               */
/* When the browser restores this page from bfcache — e.g. hitting the */
/* Back button after visiting Menu, Reservations, etc. — the JS never   */
/* re-runs, so anything that was mid-animation (or mid-interaction) at  */
/* the moment the user navigated away gets frozen into the snapshot and */
/* restored exactly like that. Four things can end up stuck this way:   */
/*   1. The one-time hero entrance tween, if the user clicked away      */
/*      before it finished (`.gsap-hero-title` / `.gsap-fade` left at   */
/*      a partial opacity/offset).                                      */
/*   2. The "Explore Dishes" magnetic button, if the cursor happened to */
/*      be hovering it — its x/y offset tween has no unload trigger.    */
/*   3. The mobile menu's open/scroll-locked state, if Back was used    */
/*      instead of tapping a menu link.                                 */
/*   4. Lenis/ScrollTrigger's cached measurements, which can be stale   */
/*      if the viewport changed size while this page was cached.        */
/* We don't want to replay the intro on a Back navigation anyway — it's */
/* a first-impression effect — so we just snap everything back to its   */
/* normal resting state and resync scroll-driven positions against      */
/* wherever the user actually is now.                                   */
/* ------------------------------------------------------------------ */
window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    try {
        gsap.set('.gsap-hero-title, .gsap-fade', { clearProps: 'all' });
        gsap.killTweensOf('.magnetic');
        gsap.set('.magnetic', { clearProps: 'x,y' });

        const mobileMenu = document.getElementById('mobile-menu');
        const menuToggle = document.getElementById('menu-toggle');
        if (mobileMenu && !mobileMenu.classList.contains('opacity-0')) {
            mobileMenu.classList.add('opacity-0', '-translate-y-full', 'pointer-events-none');
            if (menuToggle) {
                menuToggle.classList.remove('menu-open');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
            document.body.style.overflow = '';
        }

        if (window.lenis) {
            window.lenis.start();
            if (typeof window.lenis.resize === 'function') window.lenis.resize();
        }
        if (window.ScrollTrigger) ScrollTrigger.refresh(true);
    } catch (err) {
        console.warn('[animations.js] bfcache pageshow recovery failed:', err);
    }
});
