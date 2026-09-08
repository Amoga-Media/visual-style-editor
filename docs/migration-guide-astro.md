# Migration Guide: Moving to Astro 5.x & 100% In-Browser Engine

> **Document Scope:** Actionable, step-by-step engineering plan to transition the existing React client and Node backend into a unified, zero-server-cost Astro 5 web application.

---

## 1. Architectural Migration Map

```text
Current Structure (Monorepo with Node Server):
  ├── client/ (Vite + React)
  ├── server/ (Hono + Node.js parse5 endpoints) ───► (Migrate to Client AST)
  └── shared/ (Types + Classifiers)

Target Structure (Unified Astro 5.x Project):
  ├── src/
  │   ├── components/
  │   │   ├── astro/ (SEO Layout, Header, Hero, Marketing, Footer)
  │   │   └── editor/ (Interactive React Island: DropZone, Canvas, PropertyPanels, Modals)
  │   ├── content/ (Templates, Guides, Docs in MDX)
  │   ├── layouts/ (BaseLayout.astro with JSON-LD & OpenGraph)
  │   ├── lib/
  │   │   ├── ast/ (parse5 in-browser AST parsing & splicing)
  │   │   ├── tailwind/ (Token extraction & forward mapping)
  │   │   └── fs/ (File System Access API & download helpers)
  │   ├── pages/
  │   │   ├── index.astro (Landing page + Embed Editor Island)
  │   │   ├── app.astro (Fullscreen distraction-free Studio)
  │   │   └── templates/ (SEO-rich starter templates gallery)
  │   └── store/ (Zustand state management)
  ├── public/ (Favicons, OpenGraph assets, sample HTML files)
  └── astro.config.mjs
```

---

## 2. Step-by-Step Migration Checklist

### Phase 1: Astro 5 Project Setup & Integrations
1. Initialize Astro with the React and Tailwind integrations:
   ```bash
   npx astro add react tailwind
   ```
2. Configure `astro.config.mjs`:
   ```javascript
   import { defineConfig } from 'astro/config';
   import react from '@astrojs/react';
   import tailwind from '@astrojs/tailwind';
   import sitemap from '@astrojs/sitemap';

   export default defineConfig({
     site: 'https://visualstyleeditor.com',
     integrations: [react(), tailwind(), sitemap()],
     vite: {
       optimizeDeps: {
         include: ['parse5', 'culori', 'zustand', 'lucide-react'],
       },
     },
   });
   ```

### Phase 2: Refactoring Backend `parse5` Splicer into Client Library
1. Move `server/src/html/*` (`build-location-map.ts`, `resolve-path.ts`, `splice.ts`, `style-attr.ts`) into `src/lib/ast/`.
2. Move `server/src/tailwind/*` (`detect-mode.ts`, `theme-v3.ts`, `theme-v4.ts`) into `src/lib/tailwind/`.
3. Consolidate into a single client-side AST controller:
   - `analyzeHtmlInBrowser(html: string): AnalyzeResponse`
   - `applyEditsInBrowser(html: string, edits: SaveRequestEdit[]): SaveResponse`
4. Update `client/src/App.tsx` to call these local TypeScript functions directly instead of making `fetch('/api/analyze')` and `fetch('/api/apply-edits')` network calls.

### Phase 3: Embedding the React Island in Astro
1. Create `src/pages/index.astro` and `src/pages/app.astro`:
   ```astro
   ---
   import BaseLayout from '../layouts/BaseLayout.astro';
   import EditorStudio from '../components/editor/EditorStudio';
   ---
   <BaseLayout title="Free Visual HTML & Tailwind Editor | Zero Code & Instant Preview">
     <main class="w-full h-screen">
       <EditorStudio client:only="react" />
     </main>
   </BaseLayout>
   ```

### Phase 4: SEO, Metadata & OpenGraph Setup
1. Implement the `<SeoHead>` component leveraging structured metadata, canonical URLs, and OpenGraph images.
2. Add Schema.org `WebApplication` structured data.
3. Configure `robots.txt` and automatic sitemap generation.

### Phase 5: Verification & Zero-Cost Deployment
1. Run `npx astro check` and `npm test` to ensure all 263 tests pass against the new client-side AST engine.
2. Build static production bundle with `npx astro build` (`dist/`).
3. Connect repository to **Cloudflare Pages** or **Vercel** with automatic branch deploys on push.
