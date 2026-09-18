/**
 * main.js
 * Everything that isn't GSAP motion: mobile nav, forms, the accordion /
 * hover-swap menu lists, the Menu page's category tabs, and the
 * Reservations multi-step wizard. Loaded on every page — each section
 * checks that its elements exist before wiring anything up, so this one
 * file is safe to include site-wide.
 */

/* ------------------------------------------------------------------ */
/* Mobile nav (hamburger -> full-screen menu)                           */
/* ------------------------------------------------------------------ */
(function setupMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (!menuToggle || !mobileMenu) return;

    let menuOpen = false;

    function setMenu(open) {
        menuOpen = open;
        menuToggle.setAttribute('aria-expanded', open);
        menuToggle.classList.toggle('menu-open', open);
        mobileMenu.classList.toggle('opacity-0', !open);
        mobileMenu.classList.toggle('-translate-y-full', !open);
        mobileMenu.classList.toggle('pointer-events-none', !open);
        document.body.style.overflow = open ? 'hidden' : '';
        if (window.lenis) { open ? window.lenis.stop() : window.lenis.start(); }
    }

    menuToggle.addEventListener('click', () => setMenu(!menuOpen));
    mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
})();

/* ------------------------------------------------------------------ */
/* Newsletter signup (front-end only — no backend wired up yet)        */
/* ------------------------------------------------------------------ */
(function setupNewsletter() {
    const form = document.getElementById('newsletter-form');
    const msg = document.getElementById('newsletter-msg');
    if (!form || !msg) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        msg.classList.remove('hidden');
        form.reset();
    });
})();

/* ------------------------------------------------------------------ */
/* Interactive menu lists: hover swaps the photo, click opens the       */
/* accordion. Used on the homepage (category/dessert/drink previews)    */
/* and the Menu page (starters/mains/desserts/drinks, full lists).      */
/* ------------------------------------------------------------------ */
function setupInteractiveList(listId, imgId) {
    const list = document.getElementById(listId);
    const displayImg = document.getElementById(imgId);
    if (!list || !displayImg) return;

    const items = list.querySelectorAll('.menu-row');

    items.forEach((item) => {
        const trigger = item.querySelector('.trigger-btn');
        const content = item.querySelector('.accordion-content');

        item.addEventListener('mouseenter', () => {
            const newSrc = item.getAttribute('data-img');
            if (newSrc && displayImg.src !== newSrc) {
                displayImg.style.opacity = 0.5;
                setTimeout(() => {
                    displayImg.src = newSrc;
                    displayImg.style.opacity = 1;
                }, 200);
            }
        });

        trigger.addEventListener('click', () => {
            items.forEach((otherItem) => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    const otherContent = otherItem.querySelector('.accordion-content');
                    otherContent.style.maxHeight = null;
                    otherContent.style.opacity = 0;
                }
            });

            item.classList.toggle('active');
            if (item.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.opacity = 1;
            } else {
                content.style.maxHeight = null;
                content.style.opacity = 0;
            }
        });
    });
}

// Homepage previews
setupInteractiveList('category-list', 'category-display-img');
setupInteractiveList('dessert-list', 'dessert-display-img');
setupInteractiveList('drink-list', 'drink-display-img');

/* ------------------------------------------------------------------ */
/* Homepage: "Explore Dishes" button scrolls to Our Categories           */
/* ------------------------------------------------------------------ */
(function setupExploreButton() {
    const btn = document.getElementById('explore-dishes-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const target = document.getElementById('categories');
        if (target && window.lenis) window.lenis.scrollTo(target, { offset: -80 });
        else if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
})();

/* ------------------------------------------------------------------ */
/* Menu page: left-rail category selector (+ mobile pill strip)         */
/* Handles: the All/Veg/Non-Veg diet filter, click-to-scroll category    */
/* navigation, and highlighting the active category as the page scrolls. */
/* ------------------------------------------------------------------ */
(function setupMenuBrowser() {
    const catSections = Array.from(document.querySelectorAll('.menu-cat'));
    const navLinks = Array.from(document.querySelectorAll('[data-cat-link]'));
    const dietButtons = Array.from(document.querySelectorAll('[data-diet-filter]'));
    const menuTop = document.getElementById('menu-content-top');
    if (!catSections.length || !navLinks.length) return;

    const HEADER_OFFSET = 160; // keep in sync with the .scroll-mt-40 sections

    function setActiveLink(target) {
        navLinks.forEach((link) => {
            const match = link.getAttribute('data-target') === target;
            link.classList.toggle('active', match);
            link.setAttribute('aria-current', match ? 'true' : 'false');
        });
    }

    function visibleSections() {
        return catSections.filter((s) => !s.hidden);
    }

    function updateActiveFromScroll() {
        const sections = visibleSections();
        if (!sections.length) return;
        let current = 'all';
        sections.forEach((section) => {
            if (section.getBoundingClientRect().top - HEADER_OFFSET <= 0) {
                current = section.id.replace('cat-', '');
            }
        });
        setActiveLink(current);
    }

    let ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            updateActiveFromScroll();
            ticking = false;
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    if (window.lenis) window.lenis.on('scroll', onScroll);

    function scrollToTarget(target) {
        const el = target === 'all' ? (menuTop || catSections[0]) : document.getElementById('cat-' + target);
        if (!el) return;
        if (window.lenis) window.lenis.scrollTo(el, { offset: -(HEADER_OFFSET - 10) });
        else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveLink(target);
    }

    navLinks.forEach((link) => {
        link.addEventListener('click', () => scrollToTarget(link.getAttribute('data-target')));
    });

    function applyDietFilter(diet) {
        document.querySelectorAll('.menu-item').forEach((item) => {
            item.hidden = !(diet === 'all' || item.getAttribute('data-diet') === diet);
        });

        catSections.forEach((section) => {
            const anyVisible = section.querySelector('.menu-item:not([hidden])') !== null;
            section.hidden = !anyVisible;
            const target = section.id.replace('cat-', '');
            navLinks.forEach((link) => {
                if (link.getAttribute('data-target') === target) link.classList.toggle('is-empty', !anyVisible);
            });
        });

        dietButtons.forEach((btn) => {
            const match = btn.getAttribute('data-diet-filter') === diet;
            btn.classList.toggle('active', match);
            btn.setAttribute('aria-pressed', match ? 'true' : 'false');
        });

        requestAnimationFrame(() => {
            if (window.ScrollTrigger) ScrollTrigger.refresh();
            updateActiveFromScroll();
        });
    }

    dietButtons.forEach((btn) => {
        btn.addEventListener('click', () => applyDietFilter(btn.getAttribute('data-diet-filter')));
    });

    // Initial state: All categories, All diets, highlight "All"
    applyDietFilter('all');
    setActiveLink('all');

    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && document.getElementById('cat-' + initialHash)) {
        setTimeout(() => scrollToTarget(initialHash), 150);
    }
})();

/* ------------------------------------------------------------------ */
/* Legal pages (Privacy/Terms): left-rail section nav + scroll-spy       */
/* This is the same sticky-aside-on-the-left, scroll-the-content-on-the- */
/* right pattern as the Menu page's category browser above, just without */
/* the diet filtering — kept as its own small function (rather than      */
/* reusing setupMenuBrowser) so nothing here can ever affect the Menu    */
/* page's `.menu-item` visibility logic, and vice versa.                 */
/* ------------------------------------------------------------------ */
(function setupSectionBrowser() {
    const sections = Array.from(document.querySelectorAll('[data-legal-section]'));
    const navLinks = Array.from(document.querySelectorAll('[data-section-link]'));
    if (!sections.length || !navLinks.length) return;

    const HEADER_OFFSET = 160; // matches scroll-mt-40 below (same value the Menu page uses)

    function setActiveLink(target) {
        navLinks.forEach((link) => {
            const match = link.getAttribute('data-target') === target;
            link.classList.toggle('active', match);
            link.setAttribute('aria-current', match ? 'true' : 'false');
        });
    }

    function updateActiveFromScroll() {
        let current = sections[0].id;
        sections.forEach((section) => {
            if (section.getBoundingClientRect().top - HEADER_OFFSET <= 0) {
                current = section.id;
            }
        });
        setActiveLink(current);
    }

    let ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            updateActiveFromScroll();
            ticking = false;
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    if (window.lenis) window.lenis.on('scroll', onScroll);

    function scrollToTarget(target) {
        const el = document.getElementById(target);
        if (!el) return;
        if (window.lenis) window.lenis.scrollTo(el, { offset: -(HEADER_OFFSET - 10) });
        else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveLink(target);
    }

    navLinks.forEach((link) => {
        link.addEventListener('click', () => scrollToTarget(link.getAttribute('data-target')));
    });

    updateActiveFromScroll();

    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && document.getElementById(initialHash)) {
        setTimeout(() => scrollToTarget(initialHash), 150);
    }
})();

/* ------------------------------------------------------------------ */
/* Reservations page: date guard, large-party note, 3-step wizard       */
/* ------------------------------------------------------------------ */
(function setupReservationForm() {
    const form = document.getElementById('reservation-form');
    if (!form) return;

    const dateInput = document.getElementById('res-date');
    const timeSelect = document.getElementById('res-time');

    // Keep this in sync with the "Hours" card in the sidebar — it's the
    // single source of truth the time dropdown is generated from. Minutes
    // past midnight, so 17*60 = 5:00 PM. `null` = closed all day.
    const HOURS_BY_DAY = {
        0: { open: 16 * 60, close: 21 * 60 }, // Sunday    4:00 – 9:00 PM
        1: null,                               // Monday   Closed
        2: { open: 17 * 60, close: 22 * 60 }, // Tuesday   5:00 – 10:00 PM
        3: { open: 17 * 60, close: 22 * 60 }, // Wednesday
        4: { open: 17 * 60, close: 22 * 60 }, // Thursday
        5: { open: 17 * 60, close: 23 * 60 }, // Friday    5:00 – 11:00 PM
        6: { open: 17 * 60, close: 23 * 60 }, // Saturday
    };
    const LAST_SEATING_BUFFER = 30; // minutes before closing time
    const SAME_DAY_PREP_BUFFER = 30; // minutes from right now, if booking today

    function formatMinutes(total) {
        let h = Math.floor(total / 60);
        const m = total % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${String(m).padStart(2, '0')} ${period}`;
    }

    function rebuildTimeOptions() {
        if (!timeSelect) return;
        timeSelect.innerHTML = '';

        if (!dateInput || !dateInput.value) {
            timeSelect.appendChild(new Option('Select a date first', ''));
            timeSelect.dispatchEvent(new Event('options-changed'));
            return;
        }

        const [y, m, d] = dateInput.value.split('-').map(Number);
        const picked = new Date(y, m - 1, d);
        const dayHours = HOURS_BY_DAY[picked.getDay()];

        if (!dayHours) {
            timeSelect.appendChild(new Option("We're closed that day — pick another", ''));
            timeSelect.dispatchEvent(new Event('options-changed'));
            return;
        }

        const now = new Date();
        const isToday = picked.toDateString() === now.toDateString();
        const earliestAllowed = isToday ? now.getHours() * 60 + now.getMinutes() + SAME_DAY_PREP_BUFFER : -Infinity;

        const slots = [];
        for (let t = dayHours.open; t <= dayHours.close - LAST_SEATING_BUFFER; t += 30) {
            if (t >= earliestAllowed) slots.push(t);
        }

        timeSelect.appendChild(new Option(slots.length ? 'Select a time' : 'No more seatings today — try another day', ''));
        slots.forEach((t) => timeSelect.appendChild(new Option(formatMinutes(t), formatMinutes(t))));

        timeSelect.dispatchEvent(new Event('options-changed'));
    }

    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
        dateInput.dataset.closedDays = '1'; // Monday — matches HOURS_BY_DAY above
        rebuildTimeOptions();
        dateInput.addEventListener('change', rebuildTimeOptions);
    }

    const partySelect = document.getElementById('res-party');
    const partyNote = document.getElementById('party-note');
    const partyExactWrap = document.getElementById('party-exact-wrap');
    const partyExactInput = document.getElementById('res-party-exact');
    const EXACT_MIN_BY_BUCKET = { '5-10': 5, '11-15': 11, '16-25': 16, '30+': 30 };

    function partyDisplayValue() {
        const needsExact = partyExactWrap && !partyExactWrap.classList.contains('hidden');
        if (needsExact && partyExactInput && partyExactInput.value) {
            return `${partyExactInput.value} guests`;
        }
        const opt = partySelect ? partySelect.options[partySelect.selectedIndex] : null;
        return opt && opt.value ? opt.textContent : '';
    }

    if (partySelect) {
        partySelect.addEventListener('change', () => {
            const bucket = partySelect.value;
            if (partyNote) partyNote.classList.toggle('hidden', bucket !== '30+');

            if (partyExactWrap && partyExactInput) {
                const needsExact = bucket && bucket !== '2-4';
                partyExactWrap.classList.toggle('hidden', !needsExact);
                partyExactInput.required = needsExact;
                if (!needsExact) {
                    partyExactInput.value = '';
                    partyExactInput.style.borderColor = '';
                } else {
                    partyExactInput.min = String(EXACT_MIN_BY_BUCKET[bucket] || 2);
                    partyExactInput.placeholder = bucket === '30+' ? 'e.g. 60' : `e.g. ${EXACT_MIN_BY_BUCKET[bucket]}`;
                }
            }
        });
    }

    const steps = Array.from(document.querySelectorAll('.step-panel'));
    const indicators = Array.from(document.querySelectorAll('[data-indicator]'));
    let currentStep = 1;

    function showStep(n) {
        steps.forEach((s) => s.classList.toggle('active', Number(s.dataset.step) === n));
        indicators.forEach((ind) => {
            const dot = ind.querySelector('.step-dot');
            const label = ind.querySelector('span:last-child');
            const num = Number(ind.dataset.indicator);
            if (num <= n) {
                dot.classList.remove('bg-gray-200', 'text-gray-500');
                dot.classList.add('bg-brand-dark', 'text-white');
                if (label) label.classList.remove('text-gray-400');
            } else {
                dot.classList.add('bg-gray-200', 'text-gray-500');
                dot.classList.remove('bg-brand-dark', 'text-white');
                if (label) label.classList.add('text-gray-400');
            }
        });
        currentStep = n;
    }

    function validateStep(n) {
        const panel = steps.find((s) => Number(s.dataset.step) === n);
        const required = panel.querySelectorAll('[required]');
        let valid = true;
        required.forEach((field) => {
            if (!field.value) {
                valid = false;
                field.style.borderColor = '#a6453d';
            } else {
                field.style.borderColor = '';
            }
        });
        return valid;
    }

    function populateReview() {
        document.getElementById('rv-party').textContent = partyDisplayValue() || '—';
        document.getElementById('rv-date').textContent = dateInput.value || '—';
        document.getElementById('rv-time').textContent = document.getElementById('res-time').value || '—';
        document.getElementById('rv-name').textContent = document.getElementById('res-name').value || '—';
        const email = document.getElementById('res-email').value;
        const phone = document.getElementById('res-phone').value;
        document.getElementById('rv-contact').textContent = [email, phone].filter(Boolean).join(' / ') || '—';
        document.getElementById('rv-occasion').textContent = document.getElementById('res-occasion').value || 'Just dinner';
    }

    document.querySelectorAll('.next-step').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (!validateStep(currentStep)) return;
            if (currentStep === 2) populateReview();
            showStep(currentStep + 1);
        });
    });
    document.querySelectorAll('.prev-step').forEach((btn) => {
        btn.addEventListener('click', () => showStep(currentStep - 1));
    });

    // Final submit — front-end only confirmation (no backend wired up yet)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validateStep(2)) { showStep(2); return; }

        document.getElementById('ok-party').textContent = partyDisplayValue();
        document.getElementById('ok-date').textContent = dateInput.value;
        document.getElementById('ok-time').textContent = document.getElementById('res-time').value;
        const email = document.getElementById('res-email').value;
        const phone = document.getElementById('res-phone').value;
        document.getElementById('ok-contact').textContent = email || phone;

        form.classList.add('hidden');
        document.getElementById('step-indicator').classList.add('hidden');
        document.getElementById('success-panel').classList.remove('hidden');
    });
})();
