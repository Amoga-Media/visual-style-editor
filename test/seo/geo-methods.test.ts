import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Princeton GEO 9-Method Verification', () => {
  it('incorporates verified statistical anchors across marketing pages', () => {
    const home = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/index.astro'), 'utf-8');
    const features = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/features.astro'), 'utf-8');

    // Statistical anchors (+37% visibility)
    expect(home + features).toContain('0ms');
    expect(home + features).toContain('100%');
    expect(home + features).toContain('700+');
  });

  it('incorporates authoritative W3C and parser citations', () => {
    const howItWorks = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/how-it-works.astro'), 'utf-8');
    const features = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/features.astro'), 'utf-8');

    // Authoritative citations (+40% visibility)
    expect(howItWorks + features).toContain('W3C File System Access API');
    expect(howItWorks + features).toContain('Parse5');
    expect(howItWorks + features).toContain('OKLCH');
  });
});
