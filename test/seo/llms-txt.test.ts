import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Machine-Readable AI Discovery Files', () => {
  const llmsPath = path.resolve(process.cwd(), 'public/llms.txt');
  const llmsFullPath = path.resolve(process.cwd(), 'public/llms-full.txt');

  it('has valid public/llms.txt complying with llmstxt.org specification', () => {
    expect(fs.existsSync(llmsPath)).toBe(true);
    const content = fs.readFileSync(llmsPath, 'utf-8');

    expect(content).toContain('# Visual Style Editor');
    expect(content).toContain('https://visualstyleeditor.com');
    expect(content).toContain('/editor');
    expect(content).toContain('/features');
    expect(content).toContain('/how-it-works');
    expect(content).toContain('/templates');
    expect(content).toContain('/llms-full.txt');
  });

  it('has comprehensive public/llms-full.txt with technical architecture details', () => {
    expect(fs.existsSync(llmsFullPath)).toBe(true);
    const content = fs.readFileSync(llmsFullPath, 'utf-8');

    expect(content).toContain('Parse5');
    expect(content).toContain('File System Access API');
    expect(content).toContain('Tailwind CSS v3');
    expect(content).toContain('Tailwind CSS v4');
    expect(content).toContain('OKLCH');
    expect(content).toContain('AST Splicing');
  });
});
