/* ============================================================
   Besty's | Premium Craft Burgers — Behavior
   Extracted from inline <script> for maintainability.
   Depends on: GSAP 3.12.2 + ScrollTrigger (loaded before this file).
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    // ---------- Lenis Smooth Scroll Setup ----------
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing for premium feel
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    // Keep Lenis and GSAP ScrollTrigger perfectly synced
    lenis.on('scroll', ScrollTrigger.update);

    // Recalculate trigger positions once everything that can shift layout has
    // settled (webfonts swapping in, images finishing decode) — viewport resize
    // is already auto-refreshed by ScrollTrigger, but load-time layout shifts aren't.
    window.addEventListener('load', () => ScrollTrigger.refresh());
    
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Lock scroll during preloader
    lenis.stop();


    // ---------- Custom GSAP Preloader ----------
    const preloaderTl = gsap.timeline({
        onComplete: () => {
            // Unlock scroll and allow hero animations to play
            lenis.start();
            document.body.classList.remove('overflow-hidden');
        }
    });

    // Prevent scrolling native fallback just in case
    document.body.classList.add('overflow-hidden');

    preloaderTl
        // Reveal the logo mark: fade + rise + gentle scale settle (single cohesive tween
        // now that the brand mark is one image instead of separate text + dot elements)
        .to('#preloader-text', {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power4.out',
            delay: 0.2
        })
        // Hold for a beat, then slide the whole preloader up and away
        .to('#preloader', {
            yPercent: -100,
            duration: 1,
            ease: 'power3.inOut',
            delay: 0.5
        });

    // Respect the OS-level "reduce motion" preference for everything below
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ---------- Scroll progress bar (scrub, 1:1 with the user's own scroll input) ----------
    gsap.to('#scroll-progress', {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: true }
    });

    // ---------- Nav: ticket-strip state on scroll ----------
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('nav-scrolled', window.scrollY > 50);
    });

    // ---------- Mobile / Tablet Hamburger Menu ----------
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const hamburgerLines = menuToggle.querySelectorAll('.hamburger-line');
    const mobileLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
    let menuOpen = false;

    function openMobileMenu() {
        menuOpen = true;
        mobileMenu.setAttribute('aria-hidden', 'false');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', 'Close menu');
        document.body.style.overflow = 'hidden';

        const d = prefersReducedMotion ? 0 : 0.5;
        gsap.timeline()
            .to(hamburgerLines[0], { rotate: 45, y: 7, duration: d * 0.6, ease: 'power2.inOut' }, 0)
            .to(hamburgerLines[1], { opacity: 0, duration: d * 0.4 }, 0)
            .to(hamburgerLines[2], { rotate: -45, y: -7, duration: d * 0.6, ease: 'power2.inOut' }, 0)
            .to(mobileMenu, { autoAlpha: 1, duration: d * 0.4 }, 0)
            .from(mobileLinks, { y: 30, opacity: 0, duration: d * 0.6, stagger: prefersReducedMotion ? 0 : 0.08, ease: 'power3.out' }, d * 0.15);

        mobileLinks[0].focus({ preventScroll: true });
    }

    function closeMobileMenu() {
        menuOpen = false;
        mobileMenu.setAttribute('aria-hidden', 'true');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';

        const d = prefersReducedMotion ? 0 : 0.35;
        gsap.timeline()
            .to(hamburgerLines[0], { rotate: 0, y: 0, duration: d, ease: 'power2.inOut' }, 0)
            .to(hamburgerLines[1], { opacity: 1, duration: d }, 0)
            .to(hamburgerLines[2], { rotate: 0, y: 0, duration: d, ease: 'power2.inOut' }, 0)
            .to(mobileMenu, { autoAlpha: 0, duration: d }, 0);

        menuToggle.focus({ preventScroll: true });
    }

    menuToggle.addEventListener('click', () => (menuOpen ? closeMobileMenu() : openMobileMenu()));
    mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuOpen) closeMobileMenu();
    });

    // Lightweight focus trap while the mobile menu is open
    mobileMenu.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab' || !menuOpen) return;
        const first = mobileLinks[0];
        const last = mobileLinks[mobileLinks.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
        }
    });

    window.addEventListener('resize', () => {
        if (menuOpen && window.innerWidth >= 1024) closeMobileMenu();
    });

    // ---------- Hero: cinematic image scale + line-mask headline reveal + staggered supporting elements ----------
    // Three hero markups exist (mobile/tablet/desktop), gated by breakpoint visibility
    // via CSS. gsap.matchMedia() animates only the one actually on screen instead of
    // running all three entrance timelines (each scaling a <video>) on every load —
    // less simultaneous work, and it re-targets automatically if the breakpoint
    // changes (e.g. rotating a tablet) since matchMedia re-evaluates on resize.
    if (!prefersReducedMotion) {
        const heroVariants = gsap.utils.toArray('.hero-variant');
        const heroMM = gsap.matchMedia();
        heroMM.add({
            isMobile: '(max-width: 767px)',
            isTablet: '(min-width: 768px) and (max-width: 1023px)',
            isDesktop: '(min-width: 1024px)'
        }, (context) => {
            const { isMobile, isTablet } = context.conditions;
            const activeHero = isMobile ? heroVariants[0] : isTablet ? heroVariants[1] : heroVariants[2];
            if (!activeHero) return;
            const tl = gsap.timeline();
            tl.from(activeHero.querySelectorAll('.hero-img'), { scale: 1.15, duration: 2.2, ease: 'power3.out' })
              .from(activeHero.querySelectorAll('.line-inner'), { yPercent: 110, duration: 1, stagger: 0.12, ease: 'power4.out' }, '-=1.75')
              .from(activeHero.querySelectorAll('.hero-anim'), { y: 26, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, '-=0.65');
        });
    }

    // ---------- Parallax backgrounds ----------
    if (!prefersReducedMotion) {
        gsap.utils.toArray('.parallax-bg').forEach(bg => {
            gsap.to(bg, {
                yPercent: 18, ease: 'none',
                scrollTrigger: { trigger: bg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
            });
        });
    }

    // ---------- Scroll Reveals (single elements) ----------
    // ScrollTrigger.batch() instead of ~29 individual ScrollTriggers: one batched
    // instance handles all of them, coalescing callbacks that fire close together
    // (e.g. two gs-reveal elements entering the viewport in the same frame) instead
    // of running 29 separate trigger + tween pairs. onEnter/onLeaveBack reproduces
    // the original toggleActions: 'play none none reverse' behavior exactly.
    gsap.set('.gs-reveal', { y: 28, opacity: 0 });
    ScrollTrigger.batch('.gs-reveal', {
        start: 'top 85%',
        onEnter: (elements) => gsap.to(elements, {
            y: 0, opacity: 1, duration: prefersReducedMotion ? 0.01 : 0.8,
            stagger: 0.08, ease: 'power2.out', overwrite: true
        }),
        onLeaveBack: (elements) => gsap.to(elements, {
            y: 28, opacity: 0, duration: prefersReducedMotion ? 0.01 : 0.4,
            stagger: 0.08, ease: 'power2.in', overwrite: true
        })
    });

    // ---------- Scroll Reveals, staggered per list/grid (mobile menu cards, wings bento, combos) ----------
    gsap.utils.toArray('.stagger-grid').forEach(grid => {
        gsap.from(grid.children, {
            scrollTrigger: { trigger: grid, start: 'top 85%', toggleActions: 'play none none reverse' },
            y: 28, opacity: 0, duration: prefersReducedMotion ? 0.01 : 0.7,
            stagger: prefersReducedMotion ? 0 : 0.1, ease: 'power2.out'
        });
    });

    // ---------- Our Story: scroll-scrubbed word-by-word reveal ----------
    gsap.utils.toArray('.story-scrub-text').forEach(el => {
        const words = el.textContent.trim().split(/\s+/);
        el.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
        const wordEls = el.querySelectorAll('.word');
        if (prefersReducedMotion) {
            gsap.set(wordEls, { opacity: 1 });
        } else {
            gsap.to(wordEls, {
                opacity: 1, stagger: 0.05, ease: 'none',
                scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 55%', scrub: 0.6 }
            });
        }
    });

    // ---------- Stat count-up (rating + review count) ----------
    if (!prefersReducedMotion) {
        document.querySelectorAll('.stat-num').forEach(el => {
            const target = parseFloat(el.dataset.target);
            const decimals = parseInt(el.dataset.decimals || '0', 10);
            const counter = { val: 0 };
            ScrollTrigger.create({
                trigger: el, start: 'top 90%', once: true,
                onEnter: () => {
                    el.textContent = (0).toFixed(decimals);
                    gsap.to(counter, {
                        val: target, duration: 1.3, ease: 'power2.out',
                        onUpdate: () => { el.textContent = counter.val.toFixed(decimals); }
                    });
                }
            });
        });
    }

    // ---------- Smooth Scrolling ----------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                if (typeof lenis !== 'undefined') {
                    lenis.scrollTo(targetElement, { offset: -80 });
                } else {
                    window.scrollTo({ top: targetElement.offsetTop - 80, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
                }
            }
        });
    });

    // ---------- Custom Date Picker Logic ----------
    const dateInput = document.getElementById('event-date');
    const calendarUI = document.getElementById('calendar-ui');
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearText = document.getElementById('month-year');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    let currentDate = new Date();
    let selectedDate = null;

    function renderCalendar(date) {
        calendarGrid.innerHTML = '';
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // Set Header
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthYearText.textContent = `${monthNames[month]} ${year}`;
        
        // Get first day of month and total days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Inject empty slots for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('calendar-day', 'empty');
            calendarGrid.appendChild(emptyDiv);
        }
        
        // Inject days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day');
            dayDiv.textContent = i;
            
            // Highlight if it's the selected date
            if (selectedDate && selectedDate.getDate() === i && selectedDate.getMonth() === month && selectedDate.getFullYear() === year) {
                dayDiv.classList.add('selected');
            }
            
            dayDiv.addEventListener('click', () => {
                selectedDate = new Date(year, month, i);
                // Format: DD/MM/YYYY
                dateInput.value = `${String(i).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
                calendarUI.classList.remove('active');
                renderCalendar(currentDate); // Re-render to show selection
            });
            
            calendarGrid.appendChild(dayDiv);
        }
    }

    // Open calendar on input click
    if (dateInput && calendarUI) {
        dateInput.addEventListener('click', (e) => {
            e.stopPropagation();
            calendarUI.classList.toggle('active');
            renderCalendar(currentDate);
        });
    }

    // Close calendar when clicking outside
    if (calendarUI) {
        document.addEventListener('click', (e) => {
            if (!calendarUI.contains(e.target) && e.target !== dateInput) {
                calendarUI.classList.remove('active');
            }
        });
    }

    // Month navigation
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
        });
    }

    // ---------- Form Submission & GSAP Modal ----------
    const cateringForm = document.getElementById('catering-form');
    const successModal = document.getElementById('success-modal');
    const closeModalBtn = document.getElementById('close-modal');

    // Create the GSAP timeline for the modal (paused by default)
    let modalTl;
    if (successModal) {
        modalTl = gsap.timeline({ paused: true })
            .set(successModal, { autoAlpha: 1 }) // autoAlpha handles visibility and opacity
            .fromTo('.modal-backdrop', { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' })
            .fromTo('.modal-box', 
                { y: 40, opacity: 0, scale: 0.95 }, 
                { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }, 
                '-=0.2'
            );
    }

    if (cateringForm) {
        cateringForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            
            // Play the modal animation
            if (modalTl) modalTl.timeScale(1).play();
            
            // Lock background scrolling while modal is open
            document.body.classList.add('overflow-hidden');
            if(typeof lenis !== 'undefined') lenis.stop();
        });
    }

    // Close modal function
    function closeModal() {
        // Reverse the animation timeline
        if (modalTl) modalTl.timeScale(1.5).reverse();
        
        // Restore scrolling
        document.body.classList.remove('overflow-hidden');
        if(typeof lenis !== 'undefined') lenis.start();
        
        // Reset the form
        if (cateringForm) cateringForm.reset();
        selectedDate = null;
        if (dateInput) dateInput.value = '';
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // ---------- Section-Scoped Interactive Menu Image Swapper (clip-path wipe) ----------
    const menuSections = document.querySelectorAll('.menu-section');
    menuSections.forEach(section => {
        const menuItems = section.querySelectorAll('.menu-item');
        const showcaseImg = section.querySelector('.showcase-img');

        const swapShowcaseImage = (newSrc) => {
            if (!showcaseImg || showcaseImg.src === newSrc) return;
            if (prefersReducedMotion) { showcaseImg.src = newSrc; return; }
            gsap.to(showcaseImg, {
                clipPath: 'inset(0 0 0 100%)', duration: 0.32, ease: 'power2.in',
                onComplete: () => {
                    showcaseImg.src = newSrc;
                    gsap.fromTo(showcaseImg,
                        { clipPath: 'inset(0 100% 0 0)' },
                        { clipPath: 'inset(0 0% 0 0)', duration: 0.55, ease: 'power3.out' }
                    );
                }
            });
        };

        if (showcaseImg && menuItems.length > 0) {
            menuItems.forEach(item => {
                item.addEventListener('mouseenter', () => swapShowcaseImage(item.getAttribute('data-img')));
            });
        }

        // ---------- Desktop menu accordion: shared open/close logic ----------
        // Used by both direct clicks and the scroll-pinned auto-advance below, so the
        // two interaction modes can never disagree about what "open" means.
        const accordionItems = section.querySelectorAll('.accordion-item');
        const openAccordionItem = (targetItem) => {
            const alreadyOpen = targetItem.classList.contains('is-open');
            accordionItems.forEach(sibling => {
                if (sibling !== targetItem) {
                    sibling.classList.remove('is-open');
                    sibling.querySelector('.accordion-trigger')?.setAttribute('aria-expanded', 'false');
                }
            });
            targetItem.classList.add('is-open');
            targetItem.querySelector('.accordion-trigger')?.setAttribute('aria-expanded', 'true');
            if (!alreadyOpen) swapShowcaseImage(targetItem.getAttribute('data-img'));
        };

        accordionItems.forEach(item => {
            const trigger = item.querySelector('.accordion-trigger');
            trigger?.addEventListener('click', () => {
                // A manual click while pinned should still feel responsive: toggle closed
                // if it was already the open one (matching the pre-existing behavior),
                // otherwise hand off to the shared open function.
                if (item.classList.contains('is-open')) {
                    item.classList.remove('is-open');
                    trigger.setAttribute('aria-expanded', 'false');
                } else {
                    openAccordionItem(item);
                }
            });
        });

        // ---------- Menu accordion rows: reveal on normal scroll (no pin/hijack) ----------
        // Each row wipes down into place via clip-path as it scrolls into view — like a
        // blind unrolling — tied continuously to ordinary scroll position (scrub), the
        // same way connected-grid.html reveals its grid items relative to their own
        // position rather than pinning the page. The price settles with its own slight
        // kinetic overshoot a beat behind, echoing the type-transition reference in
        // miniature instead of a full-screen kinetic-type takeover.
        if (!prefersReducedMotion) {
            accordionItems.forEach((row) => {
                gsap.fromTo(row,
                    { clipPath: 'inset(0% 0% 100% 0%)', scale: 0.97, transformOrigin: '50% 0%' },
                    {
                        clipPath: 'inset(0% 0% 0% 0%)', scale: 1, ease: 'power2.out',
                        scrollTrigger: { trigger: row, start: 'top 90%', end: 'top 55%', scrub: 0.5 }
                    }
                );
                const price = row.querySelector('.accordion-trigger .font-ticket');
                if (price) {
                    gsap.fromTo(price,
                        { y: -12, rotate: -8, opacity: 0.3 },
                        {
                            y: 0, rotate: 0, opacity: 1, ease: 'back.out(2.2)',
                            scrollTrigger: { trigger: row, start: 'top 88%', end: 'top 58%', scrub: 0.5 }
                        }
                    );
                }
            });
        }
    });

    // ---------- Reviews: 3-column parallax on desktop (mobile uses the pure-CSS marquee above) ----------
    let mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
        if (prefersReducedMotion) return;
        gsap.to('.review-col-up', {
            yPercent: -40, ease: 'none',
            scrollTrigger: { trigger: '#reviews', start: 'top bottom', end: 'bottom top', scrub: 1 }
        });
        gsap.to('.review-col-down', {
            yPercent: 40, ease: 'none',
            scrollTrigger: { trigger: '#reviews', start: 'top bottom', end: 'bottom top', scrub: 1 }
        });
    });

    // ---------- Micro-interactions: magnetic CTAs, tilting combo cards, cursor ring ----------
    if (canHover && !prefersReducedMotion) {
        document.querySelectorAll('.magnetic').forEach(el => {
            const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
            const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                xTo((e.clientX - r.left - r.width / 2) * 0.35);
                yTo((e.clientY - r.top - r.height / 2) * 0.35);
            });
            el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
        });

        document.querySelectorAll('.tilt-card').forEach(el => {
            gsap.set(el, { transformPerspective: 900 });
            const rxTo = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
            const ryTo = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                rxTo(-py * 9);
                ryTo(px * 9);
            });
            el.addEventListener('mouseleave', () => { rxTo(0); ryTo(0); });
        });

        const ring = document.getElementById('cursor-ring');
        if (ring) {
            gsap.set(ring, { xPercent: -50, yPercent: -50 });
            const rxTo = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' });
            const ryTo = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });
            window.addEventListener('mousemove', (e) => {
                document.body.classList.add('cursor-active');
                rxTo(e.clientX); ryTo(e.clientY);
            });
            document.querySelectorAll('a, button').forEach(el => {
                el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
                el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
            });
        }
    }
});