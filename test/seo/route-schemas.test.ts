import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Route-Specific Schema Integration', () => {
  const pages = [
    { file: 'index.astro', expectedTypes: ['WebApplication', 'FAQPage'] },
    { file: 'editor.astro', expectedTypes: ['WebApplication'] },
    { file: 'features.astro', expectedTypes: ['ItemList'] },
    { file: 'how-it-works.astro', expectedTypes: ['HowTo'] },
    { file: 'templates.astro', expectedTypes: ['CollectionPage'] },
    { file: 'support.astro', expectedTypes: ['FAQPage'] },
    { file: 'why-we-do-what-we-do.astro', expectedTypes: ['AboutPage'] },
    { file: 'our-story.astro', expectedTypes: ['AboutPage'] },
    { file: 'contact.astro', expectedTypes: ['ContactPage'] },
    { file: 'privacy.astro', expectedTypes: ['WebPage'] },
    { file: 'terms.astro', expectedTypes: ['WebPage'] },
  ];

  for (const page of pages) {
    it(`defines required schema types in src/pages/${page.file}`, () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), `src/pages/${page.file}`), 'utf-8');
      for (const type of page.expectedTypes) {
        expect(content).toContain(type);
      }
    });
  }
});
