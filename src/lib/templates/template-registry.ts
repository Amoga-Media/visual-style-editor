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
    name: "Dark Studio Hero",
    description: "Full-screen gradient studio hero with kinetic eyebrow badge, modern typography, and dual CTAs.",
    category: "landing",
    tags: ["hero", "dark", "gradient", "tailwind", "stats"],
  },
  {
    id: "landing-light",
    name: "Clean Light Editorial Landing",
    description: "Airy Swiss-inspired light landing page with crisp contrast, bold display typography, and 3-column principles.",
    category: "landing",
    tags: ["light", "clean", "minimal", "modern", "swiss"],
  },
  {
    id: "ai-startup-hero",
    name: "Next-Gen AI Startup Hero",
    description: "Modern AI product hero with live neural model pill, interactive command prompt bar, and proof tags.",
    category: "landing",
    tags: ["ai", "startup", "command-bar", "hero", "gradient"],
  },
  {
    id: "mobile-app-showcase",
    name: "Mobile App Showcase & Mockup",
    description: "Sleek mobile app landing section with realistic phone mockup frame, feature pills, and App Store CTAs.",
    category: "landing",
    tags: ["mobile", "app", "mockup", "ios", "showcase"],
  },
  {
    id: "saas-pricing",
    name: "SaaS 3-Tier Pricing Grid",
    description: "Responsive 3-tier pricing comparison with featured gradient card, monthly billing pills, and checklists.",
    category: "saas",
    tags: ["pricing", "saas", "cards", "billing", "popular"],
  },
  {
    id: "analytics-dashboard",
    name: "SaaS Analytics Studio Dashboard",
    description: "Production telemetry dashboard with key performance metric cards, status pills, and throughput bar charts.",
    category: "saas",
    tags: ["analytics", "dashboard", "metrics", "chart", "telemetry"],
  },
  {
    id: "portfolio",
    name: "Creative Studio Portfolio Grid",
    description: "Awwwards-grade creative portfolio with numbered case study cards, tech tags, and hover depth.",
    category: "portfolio",
    tags: ["portfolio", "grid", "minimal", "cards", "agency"],
  },
  {
    id: "creative-agency-case-study",
    name: "Creative Agency Case Study",
    description: "Editorial agency case study featuring oversized display typography, challenge vs solution, and client quote.",
    category: "portfolio",
    tags: ["case-study", "editorial", "agency", "quote", "portfolio"],
  },
  {
    id: "blog-article",
    name: "Technical Article Layout",
    description: "High-readability technical editorial layout with author bio card, code snippets, and key principle callout.",
    category: "blog",
    tags: ["blog", "article", "typography", "editorial", "code"],
  },
  {
    id: "developer-docs",
    name: "Developer API & Documentation",
    description: "Clean developer documentation interface with sticky endpoint sidebar, TypeScript snippet, and parameters table.",
    category: "blog",
    tags: ["docs", "api", "developer", "typescript", "table"],
  },
  {
    id: "feature-grid",
    name: "4-Column Feature Grid",
    description: "Modern product feature showcase with custom glowing icon badges and subtle glassmorphic borders.",
    category: "component",
    tags: ["component", "features", "grid", "icons", "bento"],
  },
  {
    id: "newsletter-capture",
    name: "Editorial Newsletter Capture",
    description: "Focused lead capture card with email input form, glowing ambient backdrop, and social proof avatars.",
    category: "component",
    tags: ["component", "newsletter", "form", "lead-capture", "social-proof"],
  },
];
