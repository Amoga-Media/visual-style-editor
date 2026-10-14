import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/settings-store";

export interface DropTargetInfo {
  targetElement: Element;
  position: "inside" | "before" | "after";
}

interface PreviewFrameProps {
  html: string;
  customCss?: string;
  onIframeReady: (iframe: HTMLIFrameElement | null) => void;
  onHoverElement: (el: Element | null) => void;
  onSelectElement: (el: Element) => void;
  onDragOverTarget?: (info: DropTargetInfo | null) => void;
  onDropOnTarget?: (snippet: string, targetEl: Element, position: "inside" | "before" | "after") => void;
  onMoveLayerOnTarget?: (sourceEl: Element, targetEl: Element, position: "inside" | "before" | "after") => void;
  onTextEdit?: (el: Element, oldText: string, newText: string) => void;
}

const CONTAINER_TAGS = new Set([
  "body",
  "div",
  "section",
  "main",
  "article",
  "header",
  "footer",
  "nav",
  "aside",
  "form",
  "ul",
  "ol",
  "fieldset",
  "figure",
]);

function isContainerElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (CONTAINER_TAGS.has(tag)) return true;
  if (el.children.length > 0) return true;
  return false;
}

function computeDropPosition(el: Element, clientY: number): "inside" | "before" | "after" {
  const tag = el.tagName.toLowerCase();
  if (tag === "body" || tag === "html") return "inside";

  const rect = el.getBoundingClientRect();
  const offsetY = clientY - rect.top;
  const height = Math.max(rect.height, 1);

  if (isContainerElement(el)) {
    if (offsetY < height * 0.18) return "before";
    if (offsetY > height * 0.82) return "after";
    return "inside";
  }

  // Leaf elements (headings, text, buttons, inputs, images)
  return offsetY < height * 0.5 ? "before" : "after";
}

function injectEditorHelperStyles(doc: Document) {
  if (doc.getElementById("vse-editor-helper-styles")) return;
  const styleEl = doc.createElement("style");
  styleEl.id = "vse-editor-helper-styles";
  styleEl.textContent = `
    /* ============================================================
       VSE Editor Canvas Rendering & Visibility Bridge
       Active ONLY inside editor iframe canvas during design sessions.
       Stripped automatically on save, export, and production download.
       ============================================================ */

    /* 1. Ensure scrollability and natural document layout */
    html, body {
      overflow-y: auto !important;
      overflow-x: hidden !important;
      height: auto !important;
      min-height: 100% !important;
    }

    /* 2. Force reveal for all scroll-driven animation frameworks (AOS, WOW, GSAP, Sal, ScrollReveal, Locomotive) */
    [data-aos],
    [data-sal],
    [data-scroll],
    [data-sr-id],
    .wow,
    .animated,
    .gs-reveal,
    .gsap-fade-up,
    .gsap-fade,
    .gsap-hero-title,
    .reveal,
    .scroll-reveal,
    .fade-up,
    .fade-in-section,
    .animate-on-scroll,
    .hidden-until-scroll,
    .scroll-hidden,
    .reveal-on-scroll,
    .story-scrub-text .word,
    .line-mask .line-inner,
    .stagger-grid > * {
      opacity: 1 !important;
      visibility: visible !important;
      transform: none !important;
      transition: none !important;
      animation: none !important;
      pointer-events: auto !important;
    }

    /* 3. Neutralize initial opacity: 0 and visibility: hidden on content elements in editor */
    [style*="opacity: 0"]:not(#mobile-menu):not(.modal):not([role="dialog"]),
    [style*="opacity:0"]:not(#mobile-menu):not(.modal):not([role="dialog"]),
    [style*="opacity: 0."]:not(#mobile-menu):not(.modal):not([role="dialog"]),
    [style*="opacity:0."]:not(#mobile-menu):not(.modal):not([role="dialog"]) {
      opacity: 1 !important;
    }

    [style*="visibility: hidden"]:not(#mobile-menu):not(.modal):not([role="dialog"]),
    [style*="visibility:hidden"]:not(#mobile-menu):not(.modal):not([role="dialog"]) {
      visibility: visible !important;
    }

    /* 4. Neutralize full-screen blocking preloaders and splash overlays */
    #preloader,
    .preloader,
    #preloader-text,
    #preloader-dot,
    .page-loader,
    .loader-wrapper,
    .site-loader,
    .loading-screen,
    #loading,
    .loading-overlay,
    .splash-screen,
    #splash,
    #cursor-ring,
    .cursor-ring,
    .cursor-dot {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
      visibility: hidden !important;
      z-index: -9999 !important;
    }

    /* 5. Ensure decorative background overlays and noise layers never block clicks */
    .noise-bg,
    [class*="noise"],
    [class*="grain"],
    .pointer-events-none,
    [class*="pointer-events-none"] {
      pointer-events: none !important;
    }

    /* 6. Figma-style Deep Selection cursor */
    body.vse-deep-select-active,
    body.vse-deep-select-active * {
      cursor: crosshair !important;
    }
  `;
  if (doc.head) {
    doc.head.appendChild(styleEl);
  } else if (doc.body) {
    doc.body.appendChild(styleEl);
  }
}

function unblockPreviewDocument(doc: Document, iframe: HTMLIFrameElement): () => void {
  // 1. Remove scroll-lock classes from body and html
  doc.body?.classList.remove("overflow-hidden", "no-scroll", "loading", "lenis-stopped");
  doc.documentElement?.classList.remove("overflow-hidden", "no-scroll", "loading", "lenis-stopped");

  // 2. Add .aos-animate to all [data-aos] elements
  doc.querySelectorAll("[data-aos]").forEach((el) => {
    el.classList.add("aos-animate");
  });

  // 3. Clear any stuck inline opacity/transforms on scroll reveal elements
  const revealSelectors = [
    ".gs-reveal",
    ".gsap-fade-up",
    ".gsap-fade",
    ".gsap-hero-title",
    ".reveal",
    ".scroll-reveal",
    ".fade-up",
    ".story-scrub-text",
    "[data-aos]",
    "[data-sal]",
  ];

  const clearRevealInlineStyles = () => {
    try {
      revealSelectors.forEach((sel) => {
        doc.querySelectorAll(sel).forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style) {
            if (htmlEl.style.opacity === "0" || htmlEl.style.opacity.startsWith("0.")) {
              htmlEl.style.removeProperty("opacity");
            }
            if (htmlEl.style.visibility === "hidden") {
              htmlEl.style.removeProperty("visibility");
            }
          }
        });
      });
    } catch {}
  };

  clearRevealInlineStyles();

  // 4. Try unlocking Lenis / GSAP if available on iframe window
  try {
    const win = iframe.contentWindow as any;
    if (win) {
      if (win.lenis && typeof win.lenis.start === "function") {
        win.lenis.start();
      }
      if (win.ScrollTrigger && typeof win.ScrollTrigger.refresh === "function") {
        win.ScrollTrigger.refresh(true);
      }
      win.dispatchEvent(new Event("scroll"));
      win.dispatchEvent(new Event("resize"));
    }
  } catch {}

  // 5. Active MutationObserver to catch late JS animations setting opacity: 0
  let observer: MutationObserver | null = null;
  try {
    observer = new MutationObserver(() => {
      doc.querySelectorAll("[data-aos]:not(.aos-animate)").forEach((el) => {
        el.classList.add("aos-animate");
      });
    });

    observer.observe(doc.body || doc.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-aos", "class"],
    });
  } catch {}

  return () => {
    if (observer) observer.disconnect();
  };
}

export function ensureTailwindRuntime(doc: Document) {
  if (doc.getElementById("vse-tailwind-runtime")) return;

  const scripts = Array.from(doc.querySelectorAll("script"));
  const hasTailwindScript = scripts.some(
    (s) => s.src && (s.src.includes("tailwindcss") || s.src.includes("@tailwindcss"))
  );
  const links = Array.from(doc.querySelectorAll("link[rel='stylesheet']"));
  const hasTailwindLink = links.some(
    (l) => (l as HTMLLinkElement).href && (l as HTMLLinkElement).href.includes("tailwind")
  );

  if (!hasTailwindScript && !hasTailwindLink) {
    const scriptEl = doc.createElement("script");
    scriptEl.id = "vse-tailwind-runtime";
    scriptEl.src = "https://unpkg.com/@tailwindcss/browser@4";
    if (doc.head) {
      doc.head.appendChild(scriptEl);
    } else if (doc.body) {
      doc.body.appendChild(scriptEl);
    }
  }
}

function attachBrokenImageFallback(doc: Document): () => void {
  const handleImgError = (e: Event) => {
    const img = e.target as HTMLImageElement;
    if (img && img.tagName === "IMG" && !img.dataset.vseBrokenHandled) {
      img.dataset.vseBrokenHandled = "true";
      const altText = (img.alt || img.getAttribute("src") || "Image").replace(/[<>"&]/g, "");
      const w = img.width || 200;
      const h = img.height || 120;
      img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="%23222226"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23888888" font-family="sans-serif" font-size="11">🖼️ ${altText}</text></svg>`;
    }
  };

  doc.addEventListener("error", handleImgError, true);
  return () => {
    doc.removeEventListener("error", handleImgError, true);
  };
}

export function injectProjectCustomCss(doc: Document, customCss?: string) {
  let styleEl = doc.getElementById("vse-project-custom-css") as HTMLStyleElement | null;
  if (!customCss || !customCss.trim()) {
    if (styleEl) styleEl.remove();
    return;
  }
  if (!styleEl) {
    styleEl = doc.createElement("style");
    styleEl.id = "vse-project-custom-css";
    if (doc.head) {
      doc.head.appendChild(styleEl);
    } else if (doc.body) {
      doc.body.appendChild(styleEl);
    }
  }
  styleEl.textContent = "\n" + customCss.trim() + "\n";
}

export function isOverlayOrIgnored(el: Element, doc: Document): boolean {
  if (!el || el === doc.documentElement || el === doc.head) return true;
  const tag = el.tagName.toLowerCase();
  if (tag === "html" || tag === "head") return true;

  const className = typeof el.className === "string" ? el.className : "";
  if (
    className.includes("noise") ||
    className.includes("grain") ||
    className.includes("preloader") ||
    el.id === "preloader" ||
    el.id === "loading"
  ) {
    return true;
  }

  try {
    const win = doc.defaultView || window;
    const style = win.getComputedStyle(el);
    if (style.pointerEvents === "none") return true;

    if (
      (style.position === "fixed" || style.position === "absolute") &&
      el.children.length === 0 &&
      (!el.textContent || el.textContent.trim().length === 0)
    ) {
      const rect = el.getBoundingClientRect();
      const vw = win.innerWidth || doc.documentElement.clientWidth;
      const vh = win.innerHeight || doc.documentElement.clientHeight;
      if (rect.width >= vw * 0.85 && rect.height >= vh * 0.85) {
        return true;
      }
    }
  } catch {}

  return false;
}

export function findDeepestChildAtPoint(parent: Element, x: number, y: number): Element | null {
  let current: Element = parent;
  let foundDeeper = true;

  while (foundDeeper) {
    foundDeeper = false;
    for (let i = current.children.length - 1; i >= 0; i--) {
      const child = current.children[i];
      try {
        const rect = child.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          current = child;
          foundDeeper = true;
          break;
        }
      } catch {}
    }
  }

  return current !== parent ? current : null;
}

export function resolveTargetElement(
  doc: Document,
  clientX: number,
  clientY: number,
  directTarget: Element | null,
  deepSelect = false
): Element | null {
  if (!doc) return directTarget;

  let elements: Element[] = [];
  try {
    if (typeof doc.elementsFromPoint === "function") {
      elements = doc.elementsFromPoint(clientX, clientY);
    }
  } catch {}

  if (!elements || elements.length === 0) {
    if (directTarget && !isOverlayOrIgnored(directTarget, doc)) {
      return directTarget;
    }
    return directTarget || doc.body;
  }

  const validElements = elements.filter((el) => !isOverlayOrIgnored(el, doc));

  if (validElements.length === 0) {
    return directTarget && !isOverlayOrIgnored(directTarget, doc)
      ? directTarget
      : doc.body;
  }

  if (deepSelect) {
    for (const el of validElements) {
      if (el.tagName.toLowerCase() === "body") continue;
      if (el.children.length === 0) {
        return el;
      }
      const deepestChild = findDeepestChildAtPoint(el, clientX, clientY);
      if (deepestChild) {
        return deepestChild;
      }
      return el;
    }
    return validElements[0];
  }

  if (directTarget && isOverlayOrIgnored(directTarget, doc)) {
    return validElements[0] || doc.body;
  }

  return directTarget || validElements[0] || doc.body;
}

function attachSelectionAndDragListeners(
  iframe: HTMLIFrameElement,
  onHover: (el: Element | null) => void,
  onClick: (el: Element) => void,
  onDragOverTarget?: (info: DropTargetInfo | null) => void,
  onDropOnTarget?: (snippet: string, targetEl: Element, position: "inside" | "before" | "after") => void,
  onMoveLayerOnTarget?: (sourceEl: Element, targetEl: Element, position: "inside" | "before" | "after") => void,
  onTextEdit?: (el: Element, oldText: string, newText: string) => void
) {
  const doc = iframe.contentDocument;
  if (!doc) return () => {};

  injectEditorHelperStyles(doc);

  const handleOver = (e: MouseEvent) => {
    if (useSettingsStore.getState().canvasMode === "interact") {
      onHover(null);
      return;
    }
    const isDeep = e.ctrlKey || e.metaKey;
    const target = resolveTargetElement(doc, e.clientX, e.clientY, e.target as Element, isDeep);
    onHover(target);
  };
  const handleOut = () => onHover(null);

  const handleClick = (e: MouseEvent) => {
    if (useSettingsStore.getState().canvasMode === "interact") {
      return; // allow natural click interactions for accordions, menus, links
    }
    e.preventDefault();
    e.stopPropagation();
    const isDeep = e.ctrlKey || e.metaKey;
    const target = resolveTargetElement(doc, e.clientX, e.clientY, e.target as Element, isDeep);
    if (target) {
      onClick(target);
    }
  };

  const handleDblClick = (e: MouseEvent) => {
    if (useSettingsStore.getState().canvasMode === "interact" || !useSettingsStore.getState().inlineTextEditEnabled) {
      return;
    }
    const isDeep = e.ctrlKey || e.metaKey;
    const resolved = resolveTargetElement(doc, e.clientX, e.clientY, e.target as Element, isDeep);
    let target = (resolved || e.target) as HTMLElement | null;
    if (!target) return;

    const excludedTags = new Set([
      "input", "textarea", "select", "svg", "video",
      "iframe", "img", "canvas", "audio", "body", "html", "head"
    ]);
    if (excludedTags.has(target.tagName.toLowerCase())) return;

    if (target.tagName.toLowerCase() === "button" || target.tagName.toLowerCase() === "a") {
      const innerTextLeaf = target.querySelector("span, strong, em, b, i, p");
      if (innerTextLeaf) {
        target = innerTextLeaf as HTMLElement;
      }
    }
    if (target.isContentEditable) return;

    // Check if element has complex interactive children
    if (target.querySelector("input, textarea, select, video, iframe")) return;

    // Only allow for leaf or simple text containers
    if (
      target.children.length > 0 &&
      Array.from(target.children).some(
        (c) => !["span", "strong", "em", "b", "i", "u", "small", "code", "mark"].includes(c.tagName.toLowerCase())
      )
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const originalText = target.textContent || "";
    target.contentEditable = "true";
    target.focus();

    // Select all text
    const selection = doc.defaultView?.getSelection();
    if (selection) {
      const range = doc.createRange();
      range.selectNodeContents(target);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    let committed = false;

    function finishEdit(save: boolean) {
      if (committed || !target) return;
      committed = true;
      target.contentEditable = "false";
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("blur", onBlur);

      const newText = target.textContent || "";
      if (!save) {
        target.textContent = originalText;
        return;
      }
      if (newText !== originalText) {
        onTextEdit?.(target, originalText, newText);
      }
    }

    function onKeyDown(evt: KeyboardEvent) {
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        finishEdit(true);
      } else if (evt.key === "Escape") {
        evt.preventDefault();
        finishEdit(false);
      }
    }

    function onBlur() {
      finishEdit(true);
    }

    target.addEventListener("keydown", onKeyDown);
    target.addEventListener("blur", onBlur);
  };

  const handleDragStart = (e: DragEvent) => {
    const target = e.target as Element | null;
    if (target && target.nodeType === Node.ELEMENT_NODE) {
      (window as any).__draggedLayerElement = target;
      if (e.dataTransfer) {
        e.dataTransfer.setData("application/x-visual-editor-element", target.tagName);
        e.dataTransfer.setData("text/plain", target.outerHTML || "");
        e.dataTransfer.effectAllowed = "move";
      }
    }
  };

  const handleDragEnd = () => {
    (window as any).__draggedLayerElement = null;
    onDragOverTarget?.(null);
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }

    let target = (doc.elementFromPoint(e.clientX, e.clientY) || e.target) as Element | null;
    if (!target || target.tagName.toLowerCase() === "html" || target.tagName.toLowerCase() === "head") {
      target = doc.body;
    }

    if (!target) {
      onDragOverTarget?.(null);
      return;
    }

    const position = computeDropPosition(target, e.clientY);
    onDragOverTarget?.({ targetElement: target, position });
  };

  const handleDragLeave = (e: DragEvent) => {
    // Only clear if mouse is leaving the document completely
    if (!e.relatedTarget || e.relatedTarget === doc.documentElement) {
      onDragOverTarget?.(null);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOverTarget?.(null);

    let target = (doc.elementFromPoint(e.clientX, e.clientY) || e.target) as Element | null;
    if (!target || target.tagName.toLowerCase() === "html" || target.tagName.toLowerCase() === "head") {
      target = doc.body;
    }
    if (!target) return;

    const position = computeDropPosition(target, e.clientY);

    // 1. Check if dragging an existing layer
    const draggedLayer = (window as any).__draggedLayerElement as Element | undefined;
    if (draggedLayer) {
      if (draggedLayer !== target && !target.contains(draggedLayer)) {
        onMoveLayerOnTarget?.(draggedLayer, target, position);
      }
      (window as any).__draggedLayerElement = null;
      return;
    }

    // 2. Check if dragging a component snippet
    const snippet =
      (window as any).__draggedComponentSnippet ||
      e.dataTransfer?.getData("application/x-visual-editor-snippet") ||
      e.dataTransfer?.getData("text/plain");

    if (snippet && typeof snippet === "string" && snippet.trim().length > 0) {
      onDropOnTarget?.(snippet, target, position);
      (window as any).__draggedComponentSnippet = null;
      (window as any).__draggedComponentName = null;
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Control" || e.key === "Meta" || e.ctrlKey || e.metaKey) {
      doc.body?.classList.add("vse-deep-select-active");
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Control" || e.key === "Meta" || (!e.ctrlKey && !e.metaKey)) {
      doc.body?.classList.remove("vse-deep-select-active");
    }
  };

  const handleBlur = () => {
    doc.body?.classList.remove("vse-deep-select-active");
  };

  doc.addEventListener("mouseover", handleOver, true);
  doc.addEventListener("mouseout", handleOut, true);
  doc.addEventListener("click", handleClick, true);
  doc.addEventListener("dblclick", handleDblClick, true);

  doc.addEventListener("dragstart", handleDragStart, true);
  doc.addEventListener("dragend", handleDragEnd, true);
  doc.addEventListener("dragenter", handleDragEnter, true);
  doc.addEventListener("dragover", handleDragOver, true);
  doc.addEventListener("dragleave", handleDragLeave, true);
  doc.addEventListener("drop", handleDrop, true);

  doc.addEventListener("keydown", handleKeyDown);
  doc.addEventListener("keyup", handleKeyUp);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", handleBlur);

  return () => {
    doc.body?.classList.remove("vse-deep-select-active");
    doc.removeEventListener("mouseover", handleOver, true);
    doc.removeEventListener("mouseout", handleOut, true);
    doc.removeEventListener("click", handleClick, true);
    doc.removeEventListener("dblclick", handleDblClick, true);

    doc.removeEventListener("dragstart", handleDragStart, true);
    doc.removeEventListener("dragend", handleDragEnd, true);
    doc.removeEventListener("dragenter", handleDragEnter, true);
    doc.removeEventListener("dragover", handleDragOver, true);
    doc.removeEventListener("dragleave", handleDragLeave, true);
    doc.removeEventListener("drop", handleDrop, true);

    doc.removeEventListener("keydown", handleKeyDown);
    doc.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("blur", handleBlur);
  };
}

export default function PreviewFrame({
  html,
  customCss,
  onIframeReady,
  onHoverElement,
  onSelectElement,
  onDragOverTarget,
  onDropOnTarget,
  onMoveLayerOnTarget,
  onTextEdit,
}: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const cleanupRef = useRef<() => void>(() => {});

  useEffect(() => {
    onHoverElement(null);
    onIframeReady(null);
    return () => {
      cleanupRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update injected custom CSS whenever customCss changes
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) {
      injectProjectCustomCss(doc, customCss);
    }
  }, [customCss]);

  function handleLoad() {
    cleanupRef.current();
    const iframe = iframeRef.current;
    if (!iframe) return;

    let unbindUnblock = () => {};
    if (iframe.contentDocument) {
      ensureTailwindRuntime(iframe.contentDocument);
      injectProjectCustomCss(iframe.contentDocument, customCss);
      injectEditorHelperStyles(iframe.contentDocument);
      unbindUnblock = unblockPreviewDocument(iframe.contentDocument, iframe);
    }

    const unbindListeners = attachSelectionAndDragListeners(
      iframe,
      onHoverElement,
      onSelectElement,
      onDragOverTarget,
      onDropOnTarget,
      onMoveLayerOnTarget,
      onTextEdit
    );

    const unbindImageFallback = iframe.contentDocument
      ? attachBrokenImageFallback(iframe.contentDocument)
      : () => {};

    cleanupRef.current = () => {
      unbindListeners();
      unbindImageFallback();
      unbindUnblock();
    };

    onIframeReady(iframe);
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      onLoad={handleLoad}
      title="Preview"
      style={{ border: "none", width: "100%", height: "100%", display: "block" }}
    />
  );
}

