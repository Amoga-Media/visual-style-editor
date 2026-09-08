export interface FontOption {
  name: string;
  category: "Sans-Serif" | "Serif" | "Display" | "Monospace" | "Handwriting" | "System";
  cssValue: string;
  isGoogleFont: boolean;
}

export const POPULAR_FONTS: FontOption[] = [
  // Modern Sans-Serif
  { name: "Inter", category: "Sans-Serif", cssValue: "'Inter', sans-serif", isGoogleFont: true },
  { name: "Poppins", category: "Sans-Serif", cssValue: "'Poppins', sans-serif", isGoogleFont: true },
  { name: "Outfit", category: "Sans-Serif", cssValue: "'Outfit', sans-serif", isGoogleFont: true },
  { name: "Plus Jakarta Sans", category: "Sans-Serif", cssValue: "'Plus Jakarta Sans', sans-serif", isGoogleFont: true },
  { name: "Roboto", category: "Sans-Serif", cssValue: "'Roboto', sans-serif", isGoogleFont: true },
  { name: "Montserrat", category: "Sans-Serif", cssValue: "'Montserrat', sans-serif", isGoogleFont: true },
  { name: "DM Sans", category: "Sans-Serif", cssValue: "'DM Sans', sans-serif", isGoogleFont: true },
  { name: "Manrope", category: "Sans-Serif", cssValue: "'Manrope', sans-serif", isGoogleFont: true },
  { name: "Space Grotesk", category: "Sans-Serif", cssValue: "'Space Grotesk', sans-serif", isGoogleFont: true },
  { name: "Syne", category: "Sans-Serif", cssValue: "'Syne', sans-serif", isGoogleFont: true },
  { name: "Raleway", category: "Sans-Serif", cssValue: "'Raleway', sans-serif", isGoogleFont: true },
  { name: "Nunito", category: "Sans-Serif", cssValue: "'Nunito', sans-serif", isGoogleFont: true },
  { name: "Oswald", category: "Sans-Serif", cssValue: "'Oswald', sans-serif", isGoogleFont: true },
  { name: "Work Sans", category: "Sans-Serif", cssValue: "'Work Sans', sans-serif", isGoogleFont: true },

  // Editorial & Luxury Serif
  { name: "Playfair Display", category: "Serif", cssValue: "'Playfair Display', serif", isGoogleFont: true },
  { name: "Merriweather", category: "Serif", cssValue: "'Merriweather', serif", isGoogleFont: true },
  { name: "Lora", category: "Serif", cssValue: "'Lora', serif", isGoogleFont: true },
  { name: "Cinzel", category: "Serif", cssValue: "'Cinzel', serif", isGoogleFont: true },
  { name: "Cormorant Garamond", category: "Serif", cssValue: "'Cormorant Garamond', serif", isGoogleFont: true },
  { name: "Bitter", category: "Serif", cssValue: "'Bitter', serif", isGoogleFont: true },
  { name: "Bodoni Moda", category: "Serif", cssValue: "'Bodoni Moda', serif", isGoogleFont: true },

  // Creative & Display
  { name: "Bebas Neue", category: "Display", cssValue: "'Bebas Neue', sans-serif", isGoogleFont: true },
  { name: "Abril Fatface", category: "Display", cssValue: "'Abril Fatface', serif", isGoogleFont: true },
  { name: "Righteous", category: "Display", cssValue: "'Righteous', sans-serif", isGoogleFont: true },
  { name: "Alfa Slab One", category: "Display", cssValue: "'Alfa Slab One', serif", isGoogleFont: true },
  { name: "Cinzel Decorative", category: "Display", cssValue: "'Cinzel Decorative', serif", isGoogleFont: true },

  // Monospace & Tech
  { name: "JetBrains Mono", category: "Monospace", cssValue: "'JetBrains Mono', monospace", isGoogleFont: true },
  { name: "Fira Code", category: "Monospace", cssValue: "'Fira Code', monospace", isGoogleFont: true },
  { name: "Space Mono", category: "Monospace", cssValue: "'Space Mono', monospace", isGoogleFont: true },
  { name: "Source Code Pro", category: "Monospace", cssValue: "'Source Code Pro', monospace", isGoogleFont: true },
  { name: "Roboto Mono", category: "Monospace", cssValue: "'Roboto Mono', monospace", isGoogleFont: true },

  // Handwriting & Script
  { name: "Dancing Script", category: "Handwriting", cssValue: "'Dancing Script', cursive", isGoogleFont: true },
  { name: "Caveat", category: "Handwriting", cssValue: "'Caveat', cursive", isGoogleFont: true },
  { name: "Pacifico", category: "Handwriting", cssValue: "'Pacifico', cursive", isGoogleFont: true },
  { name: "Great Vibes", category: "Handwriting", cssValue: "'Great Vibes', cursive", isGoogleFont: true },

  // System Defaults
  { name: "System Sans", category: "System", cssValue: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", isGoogleFont: false },
  { name: "System Serif", category: "System", cssValue: "Georgia, Cambria, 'Times New Roman', Times, serif", isGoogleFont: false },
  { name: "System Mono", category: "System", cssValue: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", isGoogleFont: false },
];

/**
 * Generates the Google Fonts CDN stylesheet URL for a given font family.
 */
export function getGoogleFontUrl(fontName: string): string {
  const formattedName = fontName.trim().replace(/ /g, "+");
  return `https://fonts.googleapis.com/css2?family=${formattedName}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap`;
}

/**
 * Injects preconnect and stylesheet link tags into a Document (e.g. preview iframe head)
 * for instant 0ms latency rendering of the selected Google Font.
 */
export function loadFontInDocument(doc: Document | null | undefined, fontName: string): void {
  if (!doc || !doc.head) return;

  const found = POPULAR_FONTS.find((f) => f.name.toLowerCase() === fontName.toLowerCase());
  if (found && !found.isGoogleFont) return; // System font, no webfont link needed

  const href = getGoogleFontUrl(fontName);
  const existing = doc.head.querySelector(`link[href="${href}"]`);
  if (existing) return;

  // Add preconnect if not already present
  if (!doc.head.querySelector('link[href="https://fonts.googleapis.com"]')) {
    const preconnect1 = doc.createElement("link");
    preconnect1.rel = "preconnect";
    preconnect1.href = "https://fonts.googleapis.com";
    doc.head.appendChild(preconnect1);
  }

  if (!doc.head.querySelector('link[href="https://fonts.gstatic.com"]')) {
    const preconnect2 = doc.createElement("link");
    preconnect2.rel = "preconnect";
    preconnect2.href = "https://fonts.gstatic.com";
    preconnect2.crossOrigin = "anonymous";
    doc.head.appendChild(preconnect2);
  }

  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  doc.head.appendChild(link);
}

/**
 * Extracts a clean font family name from computed or raw CSS string (e.g. '"Poppins", sans-serif' -> 'Poppins').
 */
export function cleanFontFamilyName(raw: string): string {
  if (!raw) return "Inter";
  const trimmed = raw.trim();
  if (trimmed === "sans" || trimmed === "font-sans" || trimmed.startsWith("system-ui")) return "System Sans";
  if (trimmed === "serif" || trimmed === "font-serif" || trimmed.startsWith("Georgia")) return "System Serif";
  if (trimmed === "mono" || trimmed === "font-mono" || trimmed.startsWith("ui-monospace")) return "System Mono";
  const first = trimmed.split(",")[0].trim().replace(/^["']|["']$/g, "");
  return first || "Inter";
}

/**
 * Checks if a font name is a Google Font.
 */
export function isGoogleFont(fontName: string): boolean {
  const clean = cleanFontFamilyName(fontName);
  const found = POPULAR_FONTS.find((f) => f.name.toLowerCase() === clean.toLowerCase());
  return found ? found.isGoogleFont : false;
}

/**
 * Returns HTML link tag for a Google Font.
 */
export function getGoogleFontLinkTag(fontName: string): string {
  const clean = cleanFontFamilyName(fontName);
  const url = getGoogleFontUrl(clean);
  return `<link rel="stylesheet" href="${url}">`;
}

/**
 * Formats a font name into its full CSS value.
 */
export function getFontFamilyCssValue(fontName: string): string {
  const match = POPULAR_FONTS.find((f) => f.name.toLowerCase() === fontName.toLowerCase());
  if (match) return match.cssValue;
  return `'${fontName}', sans-serif`;
}
