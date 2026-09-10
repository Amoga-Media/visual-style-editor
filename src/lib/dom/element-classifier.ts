export type ElementCategory =
  | "text"
  | "image"
  | "button"
  | "link"
  | "container"
  | "svg"
  | "input";

export interface VisiblePanels {
  contentCopy: boolean;
  imageMedia: boolean;
  linkNav: boolean;
  typography: boolean;
  layoutSizing: boolean;
  positionLayering: boolean;
  flexGrid: boolean;
  border: boolean;
  effects: boolean;
  textColor: boolean;
  backgroundColor: boolean;
  actions: boolean;
}

export interface ElementClassification {
  category: ElementCategory;
  typeLabel: string;
  badgeColor: string;
  isLeafText: boolean;
  visiblePanels: VisiblePanels;
}

const TEXT_TAGS = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "b",
  "strong",
  "i",
  "em",
  "small",
  "sub",
  "sup",
  "blockquote",
  "label",
  "code",
  "pre",
  "cite",
  "time",
  "mark",
]);

const IMAGE_TAGS = new Set(["img", "picture", "video", "iframe", "source", "audio", "canvas", "figure"]);

const SVG_TAGS = new Set([
  "svg",
  "path",
  "g",
  "circle",
  "rect",
  "polygon",
  "polyline",
  "line",
  "ellipse",
]);

const INPUT_TAGS = new Set(["input", "textarea", "select", "option"]);

const CONTAINER_TAGS = new Set([
  "div",
  "section",
  "main",
  "article",
  "aside",
  "nav",
  "header",
  "footer",
  "ul",
  "ol",
  "li",
  "form",
  "body",
  "figure",
  "fieldset",
]);

export function classifyElement(element: Element | null): ElementClassification {
  if (!element) {
    return {
      category: "container",
      typeLabel: "ELEMENT",
      badgeColor: "text-zinc-400 bg-zinc-800/60 border-zinc-700",
      isLeafText: false,
      visiblePanels: {
        contentCopy: false,
        imageMedia: false,
        linkNav: false,
        typography: false,
        layoutSizing: false,
        positionLayering: false,
        flexGrid: false,
        border: false,
        effects: false,
        textColor: false,
        backgroundColor: false,
        actions: false,
      },
    };
  }

  const tagName = element.tagName.toLowerCase();
  const classList = Array.from(element.classList);
  const role = element.getAttribute("role")?.toLowerCase() || "";
  const hasChildElements = element.children.length > 0;
  const directText = (element.textContent || "").trim();
  const isLeafText = !hasChildElements && directText.length > 0;

  let result: ElementClassification;

  // 1. Image & Media
  if (IMAGE_TAGS.has(tagName)) {
    result = {
      category: "image",
      typeLabel: tagName.toUpperCase(),
      badgeColor: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      isLeafText: false,
      visiblePanels: {
        contentCopy: false,
        imageMedia: true,
        linkNav: false,
        typography: false,
        layoutSizing: true,
        positionLayering: true,
        flexGrid: false,
        border: true,
        effects: true,
        textColor: false,
        backgroundColor: false,
        actions: true,
      },
    };
  }

  // 2. SVG & Icons
  else if (SVG_TAGS.has(tagName)) {
    result = {
      category: "svg",
      typeLabel: tagName === "svg" ? "SVG ICON" : `SVG ${tagName.toUpperCase()}`,
      badgeColor: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30",
      isLeafText: false,
      visiblePanels: {
        contentCopy: false,
        imageMedia: false,
        linkNav: false,
        typography: false,
        layoutSizing: true,
        positionLayering: true,
        flexGrid: false,
        border: false,
        effects: true,
        textColor: true, // Used for stroke/fill in SVG
        backgroundColor: false,
        actions: true,
      },
    };
  }

  // 3. Buttons & Action Triggers
  else if (tagName === "button" || role === "button" || (tagName === "a" && classList.some((c) => /btn|button|cta/i.test(c)))) {
    result = {
      category: "button",
      typeLabel: "BUTTON",
      badgeColor: "text-blue-400 bg-blue-500/15 border-blue-500/30",
      isLeafText: true,
      visiblePanels: {
        contentCopy: isLeafText || !hasChildElements,
        imageMedia: false,
        linkNav: tagName === "a" || element.closest("a") !== null,
        typography: true,
        layoutSizing: true,
        positionLayering: true,
        flexGrid: false,
        border: true,
        effects: true,
        textColor: true,
        backgroundColor: true,
        actions: true,
      },
    };
  }

  // 4. Hyperlinks
  else if (tagName === "a" || element.closest("a") !== null) {
    result = {
      category: "link",
      typeLabel: "LINK",
      badgeColor: "text-sky-400 bg-sky-500/15 border-sky-500/30",
      isLeafText,
      visiblePanels: {
        contentCopy: isLeafText || !hasChildElements,
        imageMedia: false,
        linkNav: true,
        typography: true,
        layoutSizing: true,
        positionLayering: true,
        flexGrid: false,
        border: true,
        effects: true,
        textColor: true,
        backgroundColor: true,
        actions: true,
      },
    };
  }

  // 5. Form Inputs
  else if (INPUT_TAGS.has(tagName)) {
    result = {
      category: "input",
      typeLabel: tagName.toUpperCase(),
      badgeColor: "text-amber-400 bg-amber-500/15 border-amber-500/30",
      isLeafText: false,
      visiblePanels: {
        contentCopy: false,
        imageMedia: false,
        linkNav: false,
        typography: true,
        layoutSizing: true,
        positionLayering: true,
        flexGrid: false,
        border: true,
        effects: true,
        textColor: true,
        backgroundColor: true,
        actions: true,
      },
    };
  }

  // 6. Text Elements (Headings, Paragraphs, Spans, Labels, etc.)
  // Never classify structural containers as pure leaf text
  else if (TEXT_TAGS.has(tagName) || (isLeafText && !CONTAINER_TAGS.has(tagName))) {
    let typeLabel = "TEXT";
    if (tagName.startsWith("h") && tagName.length === 2) {
      typeLabel = `HEADING ${tagName[1]}`;
    } else if (tagName === "p") {
      typeLabel = "PARAGRAPH";
    } else if (tagName === "blockquote") {
      typeLabel = "QUOTE";
    } else if (tagName === "label") {
      typeLabel = "LABEL";
    }

    result = {
      category: "text",
      typeLabel,
      badgeColor: "text-purple-400 bg-purple-500/15 border-purple-500/30",
      isLeafText: true,
      visiblePanels: {
        contentCopy: true,
        imageMedia: false,
        linkNav: false,
        typography: true,
        layoutSizing: true,
        positionLayering: true,
        flexGrid: false,
        border: true,
        effects: true,
        textColor: true,
        backgroundColor: true,
        actions: true,
      },
    };
  }

  // 7. Containers & Layout Boxes (div, section, main, article, nav, header, footer, etc.)
  else {
    let containerLabel = "CONTAINER";
    if (tagName === "section") containerLabel = "SECTION";
    else if (tagName === "nav") containerLabel = "NAV";
    else if (tagName === "header") containerLabel = "HEADER";
    else if (tagName === "footer") containerLabel = "FOOTER";
    else if (tagName === "main") containerLabel = "MAIN";
    else if (tagName === "article") containerLabel = "ARTICLE";
    else if (tagName === "aside") containerLabel = "ASIDE";
    else if (tagName === "ul" || tagName === "ol") containerLabel = "LIST";
    else if (tagName === "li") containerLabel = "LIST ITEM";
    else if (classList.some((c) => /card|wrapper|box|container|grid|flex/i.test(c))) containerLabel = "CARD / BOX";

    result = {
      category: "container",
      typeLabel: containerLabel,
      badgeColor: "text-zinc-400 bg-zinc-800/80 border-zinc-700",
      isLeafText: false,
      visiblePanels: {
        contentCopy: !hasChildElements && directText.length > 0,
        imageMedia: false,
        linkNav: false,
        typography: !hasChildElements && directText.length > 0,
        layoutSizing: true,
        positionLayering: true,
        flexGrid: true, // Always prominent for containers
        border: true,
        effects: true,
        textColor: !hasChildElements && directText.length > 0,
        backgroundColor: true,
        actions: true,
      },
    };
  }

  // Dynamic override: If an element is styled as flex or grid, always make flexGrid panel accessible
  const inlineDisplay = (element as HTMLElement).style?.display;
  const isFlexOrGrid =
    classList.includes("flex") ||
    classList.includes("inline-flex") ||
    classList.includes("grid") ||
    classList.includes("inline-grid") ||
    inlineDisplay === "flex" ||
    inlineDisplay === "grid" ||
    inlineDisplay === "inline-flex" ||
    inlineDisplay === "inline-grid";

  if (isFlexOrGrid) {
    result.visiblePanels.flexGrid = true;
  }

  return result;
}
