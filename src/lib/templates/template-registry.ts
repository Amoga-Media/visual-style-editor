export interface TemplateEntry {
  id: string;
  name: string;
  description: string;
  category: "landing" | "portfolio" | "saas" | "blog" | "component";
  tags: string[];
}

export const TEMPLATE_REGISTRY: TemplateEntry[] = [
  {
    id: "hero-dark",
    name: "Dark Hero Section",
    description: "Full-screen gradient hero with animated badge, modern typography, and dual CTAs.",
    category: "landing",
    tags: ["hero", "dark", "gradient", "tailwind"],
  },
  {
    id: "saas-pricing",
    name: "SaaS 3-Tier Pricing",
    description: "Responsive 3-tier pricing card comparison with monthly/annual badges and feature checklist.",
    category: "saas",
    tags: ["pricing", "saas", "cards", "billing"],
  },
  {
    id: "portfolio",
    name: "Creative Portfolio Grid",
    description: "Minimalist project portfolio with responsive card layout, badges, and project hover effects.",
    category: "portfolio",
    tags: ["portfolio", "grid", "minimal", "cards"],
  },
  {
    id: "landing-light",
    name: "Clean Light Landing",
    description: "Airy light-mode landing page section with high-contrast accents and social proof badges.",
    category: "landing",
    tags: ["light", "clean", "minimal", "modern"],
  },
  {
    id: "blog-article",
    name: "Technical Article Layout",
    description: "Readable long-form editorial layout with author bio, sticky table of contents, and clean typography.",
    category: "blog",
    tags: ["blog", "article", "typography", "editorial"],
  },
  {
    id: "feature-grid",
    name: "4-Column Feature Grid",
    description: "Modern product feature showcase with custom icon containers and subtle glassmorphic borders.",
    category: "component",
    tags: ["component", "features", "grid", "icons"],
  },
];
