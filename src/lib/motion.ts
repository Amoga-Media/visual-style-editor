import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins safely on client
let isInitialized = false;

export function initMotion() {
  if (typeof window === 'undefined' || isInitialized) return;
  
  gsap.registerPlugin(ScrollTrigger);
  isInitialized = true;

  // Respect user preference for reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    gsap.globalTimeline.timeScale(100); // effectively skip
    return;
  }
}

/**
 * Animate elements entering with smooth staggered fade-up and subtle blur clearing
 */
export function animateStaggerFadeUp(selector: string | Element[], parentScope?: Element | Document) {
  if (typeof window === 'undefined') return;
  initMotion();

  const elements = typeof selector === 'string' 
    ? (parentScope || document).querySelectorAll(selector)
    : selector;

  if (!elements || elements.length === 0) return;

  gsap.fromTo(
    elements,
    {
      opacity: 0,
      y: 32,
      filter: 'blur(8px)',
    },
    {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.9,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: elements[0],
        start: 'top 85%',
        once: true,
      },
    }
  );
}

/**
 * Magnetic button interaction tracking cursor proximity
 */
export function setupMagneticElement(element: HTMLElement, intensity: number = 0.3) {
  if (typeof window === 'undefined' || !element) return;

  const onMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * intensity;
    const deltaY = (e.clientY - centerY) * intensity;

    gsap.to(element, {
      x: deltaX,
      y: deltaY,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  const onMouseLeave = () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.4)',
      overwrite: 'auto',
    });
  };

  element.addEventListener('mousemove', onMouseMove);
  element.addEventListener('mouseleave', onMouseLeave);

  return () => {
    element.removeEventListener('mousemove', onMouseMove);
    element.removeEventListener('mouseleave', onMouseLeave);
  };
}

/**
 * Card spotlight illumination moving with cursor
 */
export function setupSpotlightCards(containerSelector: string) {
  if (typeof window === 'undefined') return;

  const containers = document.querySelectorAll(containerSelector);
  containers.forEach((card) => {
    const el = card as HTMLElement;
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--spotlight-x', `${x}px`);
      el.style.setProperty('--spotlight-y', `${y}px`);
    });
  });
}
