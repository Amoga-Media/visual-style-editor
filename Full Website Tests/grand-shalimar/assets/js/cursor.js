/**
 * cursor.js
 * Custom cursor: a small dot inside a larger ring (concentric circles).
 * Over anything clickable, the ring grows, turns solid brand-yellow, and
 * animates through soft "morphed" blob shapes while the dot disappears.
 *
 * Fine-pointer devices only — touch devices keep the OS default and never
 * see this run, same gate used for the magnetic buttons in animations.js.
 */
(function setupCustomCursor() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.append(ring, dot);
    document.body.classList.add('has-custom-cursor');

    const HOVER_SELECTOR = [
        'a', 'button', 'input', 'select', 'textarea', 'label',
        '[role="button"]', '.cursor-hover',
        '.ui-select-option', '.ui-datepicker-day:not(.is-disabled)',
    ].join(', ');

    // Any element with this class (the footer, the reservations page's
    // "Hours" card, etc.) is a dark surface — the cursor switches to
    // yellow while over it so it stays visible against the dark bg.
    const DARK_SURFACE_SELECTOR = '.bg-brand-dark';

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let dotX = mouseX, dotY = mouseY;
    let ringX = mouseX, ringY = mouseY;
    let started = false;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!started) {
            // Snap in on first movement instead of animating in from center
            dotX = ringX = mouseX;
            dotY = ringY = mouseY;
            started = true;
        }
        ring.classList.add('is-visible');
        dot.classList.add('is-visible');

        const onDark = !!(e.target && e.target.closest && e.target.closest(DARK_SURFACE_SELECTOR));
        ring.classList.toggle('on-dark', onDark);
        dot.classList.toggle('on-dark', onDark);
    });

    window.addEventListener('mouseleave', () => {
        ring.classList.remove('is-visible');
        dot.classList.remove('is-visible');
    });

    window.addEventListener('mousedown', () => ring.classList.add('is-active'));
    window.addEventListener('mouseup', () => ring.classList.remove('is-active'));

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest && e.target.closest(HOVER_SELECTOR)) {
            ring.classList.add('is-hovering');
            dot.classList.add('is-hovering');
        }
    });
    document.addEventListener('mouseout', (e) => {
        const goingTo = e.relatedTarget;
        if (goingTo && goingTo.closest && goingTo.closest(HOVER_SELECTOR)) return;
        ring.classList.remove('is-hovering');
        dot.classList.remove('is-hovering');
    });

    function raf() {
        // The ring trails a little; the dot follows more tightly.
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        dotX += (mouseX - dotX) * 0.5;
        dotY += (mouseY - dotY) * 0.5;

        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';
        dot.style.left = dotX + 'px';
        dot.style.top = dotY + 'px';

        requestAnimationFrame(raf);
    }
    raf();
})();
