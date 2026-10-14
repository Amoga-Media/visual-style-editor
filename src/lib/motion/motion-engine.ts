import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: 'power3.out', duration: 0.85 });

declare global {
  interface Window {
    __lenisInstance?: Lenis;
    gsap?: typeof gsap;
    ScrollTrigger?: typeof ScrollTrigger;
  }
}

export function initMotionSystem(): () => void {
  if (typeof window === 'undefined') return () => {};

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isEditorPage = window.location.pathname.startsWith('/editor');

  let lenis: Lenis | undefined;

  // Clean up any existing instances from prior page transitions / HMR
  if (window.__lenisInstance) {
    try {
      window.__lenisInstance.destroy();
    } catch (_) {}
    window.__lenisInstance = undefined;
  }

  // 1. Initialize Lenis Smooth Scroll Engine if not reduced-motion and not editor page
  if (!reduceMotion && !isEditorPage) {
    try {
      lenis = new Lenis({
        lerp: 0.08, // Buttery smooth inertial lag (Awwwards 2026 grade)
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
        infinite: false,
        anchors: true,
      });

      window.__lenisInstance = lenis;

      // Sync Lenis scroll ticks with GSAP ScrollTrigger
      lenis.on('scroll', () => {
        ScrollTrigger.update();
      });

      // Drive Lenis RAF loop through GSAP's synchronized ticker
      const tickerCallback = (time: number) => {
        lenis?.raf(time * 1000);
      };

      gsap.ticker.add(tickerCallback);
      gsap.ticker.lagSmoothing(0);
    } catch (e) {
      console.warn('Lenis smooth scroll initialization skipped:', e);
    }
  }

  window.gsap = gsap;
  window.ScrollTrigger = ScrollTrigger;

  document.documentElement.classList.add('has-motion');

  // 2. Kinetic Text & Word Reveals
  function splitWords(element: HTMLElement) {
    if (element.dataset.motionSplit === 'true') return;
    const text = element.textContent || '';
    const parts = text.split(/(\s+)/);

    element.textContent = '';
    element.setAttribute('aria-label', text.trim());

    parts.forEach((part) => {
      if (!part.trim()) {
        element.appendChild(document.createTextNode(part));
        return;
      }

      const mask = document.createElement('span');
      const word = document.createElement('span');

      mask.className = 'motion-word-mask inline-block overflow-hidden align-top';
      mask.setAttribute('aria-hidden', 'true');
      word.className = 'motion-word inline-block will-change-transform';
      word.textContent = part;

      mask.appendChild(word);
      element.appendChild(mask);
    });

    element.dataset.motionSplit = 'true';
  }

  function initTextReveals() {
    if (reduceMotion) {
      document.querySelectorAll('[data-motion-text]').forEach((el) => {
        gsap.set(el, { autoAlpha: 1 });
      });
      return;
    }

    const wordElements = document.querySelectorAll<HTMLElement>('[data-motion-text="words"]');
    wordElements.forEach((el) => {
      splitWords(el);
      const words = el.querySelectorAll('.motion-word');
      gsap.set(el, { autoAlpha: 1 });
      gsap.fromTo(
        words,
        { yPercent: 100, autoAlpha: 0, filter: 'blur(6px)' },
        {
          yPercent: 0,
          autoAlpha: 1,
          filter: 'blur(0px)',
          duration: 0.85,
          ease: 'power4.out',
          stagger: 0.04,
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        }
      );
    });
  }

  // 3. Universal Scroll Reveals for Cards, Images, Text & Sections
  function initScrollReveals() {
    if (reduceMotion) {
      document.querySelectorAll(
        '[data-reveal], [data-reveal-group], .reveal, .card, .tile, .card-raised, .section-header, img, picture, figure'
      ).forEach((el) => {
        gsap.set(el, { autoAlpha: 1, y: 0, scale: 1, clearProps: 'all' });
      });
      return;
    }

    const animatedElements = new Set<HTMLElement>();

    // A. Explicit groups with item staggers (e.g. data-reveal-group)
    const explicitGroups = document.querySelectorAll<HTMLElement>('[data-reveal-group]');
    explicitGroups.forEach((group) => {
      const items = Array.from(group.querySelectorAll<HTMLElement>('[data-reveal-item]'));
      if (!items.length) return;
      items.forEach((item) => animatedElements.add(item));
      gsap.set(group, { autoAlpha: 1 });
      gsap.fromTo(
        items,
        { y: 35, autoAlpha: 0, filter: 'blur(6px)' },
        {
          y: 0,
          autoAlpha: 1,
          filter: 'blur(0px)',
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.08,
          clearProps: 'filter',
          scrollTrigger: {
            trigger: group,
            start: 'top 88%',
            once: true,
          },
        }
      );
    });

    // B. Section Headers (Eyebrow badges, title h2/h3, descriptive subtitles)
    const sectionHeaders = document.querySelectorAll<HTMLElement>('main .section-header, main [data-reveal="header"]');
    sectionHeaders.forEach((header) => {
      if (animatedElements.has(header)) return;
      animatedElements.add(header);

      const children = Array.from(header.children).filter(
        (c): c is HTMLElement => c instanceof HTMLElement
      );

      if (children.length > 1) {
        children.forEach((c) => animatedElements.add(c));
        gsap.fromTo(
          children,
          { y: 30, autoAlpha: 0, filter: 'blur(4px)' },
          {
            y: 0,
            autoAlpha: 1,
            filter: 'blur(0px)',
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.08,
            clearProps: 'filter',
            scrollTrigger: {
              trigger: header,
              start: 'top 88%',
              once: true,
            },
          }
        );
      } else {
        gsap.fromTo(
          header,
          { y: 30, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: header,
              start: 'top 88%',
              once: true,
            },
          }
        );
      }
    });

    // C. Grids of Cards, Tiles, Bento Blocks & Matrix Cells (Staggered reveal)
    const grids = document.querySelectorAll<HTMLElement>('main .grid, main [class*="grid-cols"]');
    grids.forEach((grid) => {
      // Avoid micro-grids nested inside individual cards or React islands
      if (grid.closest('astro-island') || grid.querySelector('astro-island')) return;
      if (grid.closest('.card, .tile, .card-raised, [class*="card"]')) return;
      if (grid.closest('[data-reveal-group]')) return;

      const directCards = Array.from(grid.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement && !child.closest('astro-island') && !animatedElements.has(child)
      );

      if (directCards.length > 0) {
        directCards.forEach((c) => animatedElements.add(c));
        gsap.fromTo(
          directCards,
          { y: 38, autoAlpha: 0, scale: 0.98 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.08,
            clearProps: 'scale',
            scrollTrigger: {
              trigger: grid,
              start: 'top 86%',
              once: true,
            },
          }
        );
      }
    });

    // D. Standalone Cards, Bento Grids, Raised Cards, and Tiles
    const standaloneCards = document.querySelectorAll<HTMLElement>(
      'main .card, main .tile, main .card-raised, main [class*="bento"]'
    );
    standaloneCards.forEach((card) => {
      if (card.closest('astro-island')) return;
      if (animatedElements.has(card)) return;
      animatedElements.add(card);
      gsap.fromTo(
        card,
        { y: 35, autoAlpha: 0, scale: 0.985 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 0.85,
          ease: 'power3.out',
          clearProps: 'scale',
          scrollTrigger: {
            trigger: card,
            start: 'top 87%',
            once: true,
          },
        }
      );
    });

    // E. Images, Mockup Window Frames, Diagrams & Figures
    const mediaElements = document.querySelectorAll<HTMLElement>(
      'main img, main picture, main figure, main .glass-window-frame, main [data-mockup], main [data-image-reveal]'
    );
    mediaElements.forEach((media) => {
      // Exclude small inline icons and buttons
      if (media.closest('astro-island')) return;
      if (media instanceof HTMLImageElement && media.classList.contains('icon')) return;
      if (media.closest('button, nav, .frosted-icon-capsule')) return;
      if (animatedElements.has(media)) return;

      // If parent card/window-frame is already being animated, avoid jittery double animation
      const parentContainer = media.closest('.glass-window-frame, .card-raised, .tile');
      if (parentContainer && parentContainer !== media && animatedElements.has(parentContainer as HTMLElement)) {
        return;
      }

      animatedElements.add(media);
      gsap.fromTo(
        media,
        { y: 38, autoAlpha: 0, scale: 0.97 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          clearProps: 'scale',
          scrollTrigger: {
            trigger: media,
            start: 'top 87%',
            once: true,
          },
        }
      );
    });

    // F. Standalone Headings & Key Paragraphs not already animated
    const standaloneHeadings = document.querySelectorAll<HTMLElement>('main h2, main h3');
    standaloneHeadings.forEach((heading) => {
      if (heading.closest('astro-island')) return;
      if (animatedElements.has(heading)) return;
      if (heading.closest('.section-header, .card, .tile, .card-raised, .grid > div, [data-reveal-group]')) return;
      animatedElements.add(heading);
      gsap.fromTo(
        heading,
        { y: 25, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top 88%',
            once: true,
          },
        }
      );
    });

    // G. Explicit elements with [data-reveal] or .reveal
    const remainingReveals = document.querySelectorAll<HTMLElement>(
      '[data-reveal]:not([data-reveal-item]), .reveal:not([data-reveal-item])'
    );
    remainingReveals.forEach((el) => {
      if (animatedElements.has(el)) return;
      animatedElements.add(el);
      gsap.fromTo(
        el,
        { y: 30, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 87%',
            once: true,
          },
        }
      );
    });
  }

  // 4. Parallax Layers
  function initParallax() {
    if (reduceMotion) return;

    const layers = document.querySelectorAll<HTMLElement>('[data-parallax-layer]');
    layers.forEach((layer) => {
      const speed = parseFloat(layer.dataset.parallaxSpeed || '-0.15');
      const section = layer.closest<HTMLElement>('[data-parallax-section]') || layer;

      gsap.to(layer, {
        y: () => window.innerHeight * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.1,
          invalidateOnRefresh: true,
        },
      });
    });
  }

  // 5. Timeline Conduit Glow Pulse Animation
  function initTimelineConduit() {
    const conduits = document.querySelectorAll<HTMLElement>('[data-timeline-conduit]');
    if (!conduits.length || reduceMotion) return;

    conduits.forEach((conduit) => {
      const pulse = conduit.querySelector<HTMLElement>('.conduit-pulse');
      if (!pulse) return;

      gsap.fromTo(
        pulse,
        { top: '0%', opacity: 0 },
        {
          top: '100%',
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: conduit,
            start: 'top 70%',
            end: 'bottom 40%',
            scrub: 0.8,
          },
        }
      );
    });
  }

  // 6. Magnetic Hover Elements
  function initMagnetic() {
    if (reduceMotion || window.matchMedia('(pointer: coarse)').matches) return;

    const magnetics = document.querySelectorAll<HTMLElement>('[data-magnetic]');
    magnetics.forEach((el) => {
      const strength = parseFloat(el.dataset.magneticStrength || '0.22');
      const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });

      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * strength;
        const y = (event.clientY - rect.top - rect.height / 2) * strength;
        xTo(x);
        yTo(y);
      });

      el.addEventListener('pointerleave', () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  // Run initial sequence
  initTextReveals();
  initScrollReveals();
  initParallax();
  initTimelineConduit();
  initMagnetic();

  ScrollTrigger.refresh();

  // Refresh ScrollTrigger and resize Lenis after images and fonts load
  const onWindowLoad = () => {
    lenis?.resize();
    ScrollTrigger.refresh();
  };
  window.addEventListener('load', onWindowLoad);

  // Return cleanup function
  return () => {
    window.removeEventListener('load', onWindowLoad);
    if (lenis) {
      lenis.destroy();
      window.__lenisInstance = undefined;
    }
    ScrollTrigger.getAll().forEach((t) => t.kill());
  };
}
