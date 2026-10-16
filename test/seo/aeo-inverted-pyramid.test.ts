import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Answer Engine Optimization (AEO) Verification', () => {
  it('contains declarative answer-first definitions on core pages', () => {
    const home = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/index.astro'), 'utf-8');
    const features = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/features.astro'), 'utf-8');
    const howItWorks = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/how-it-works.astro'), 'utf-8');

    expect(home).toContain('data-aeo-answer');
    expect(features).toContain('data-aeo-answer');
    expect(howItWorks).toContain('data-aeo-answer');
  });

  it('contains accessible semantic comparison tables with Webflow, Framer, and DevTools', () => {
    const home = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/index.astro'), 'utf-8');
    expect(home).toContain('<table');
    expect(home).toContain('scope="col"');
    expect(home).toContain('Webflow');
    expect(home).toContain('Framer');
    expect(home).toContain('DevTools');
  });

  it('has zero mojibake UTF-8 corruption across all pages', () => {
    const pagesDir = path.resolve(process.cwd(), 'src/pages');
    const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.astro'));

    for (const file of files) {
      const content = fs.readFileSync(path.join(pagesDir, file), 'utf-8');
      expect(content).not.toContain('â€”');
      expect(content).not.toContain('â€¢');
    }
  });
});
