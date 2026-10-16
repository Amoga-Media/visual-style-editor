import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Programmatic SEO Blueprint Documentation', () => {
  const docPath = path.resolve(process.cwd(), 'docs/PROGRAMMATIC_SEO_BLUEPRINT.md');

  it('exists and documents keyword clusters, route matrices, and competitor displacement', () => {
    expect(fs.existsSync(docPath)).toBe(true);
    const content = fs.readFileSync(docPath, 'utf-8');

    expect(content).toContain('Keyword Cluster Architecture');
    expect(content).toContain('/vs/');
    expect(content).toContain('/for/');
    expect(content).toContain('Webflow');
    expect(content).toContain('Framer');
    expect(content).toContain('Windframe');
    expect(content).toContain('Cursor');
    expect(content).toContain('v0');
  });
});
