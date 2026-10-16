import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Technical Crawl Architecture & Security Headers', () => {
  const robotsPath = path.resolve(process.cwd(), 'public/robots.txt');
  const headersPath = path.resolve(process.cwd(), 'public/_headers');

  it('permits all required standard and AI search bots in robots.txt', () => {
    const robots = fs.readFileSync(robotsPath, 'utf-8');

    const expectedBots = [
      'Googlebot',
      'Bingbot',
      'DuckDuckBot',
      'GPTBot',
      'ChatGPT-User',
      'OAI-SearchBot',
      'PerplexityBot',
      'ClaudeBot',
      'Claude-SearchBot',
      'anthropic-ai',
      'Google-Extended',
      'Meta-ExternalAgent',
      'Applebot',
      'Applebot-Extended'
    ];

    for (const bot of expectedBots) {
      expect(robots).toContain(`User-agent: ${bot}`);
    }

    expect(robots).toContain('Content-Signal: ai-train=yes, search=yes, ai-input=yes');
    expect(robots).toContain('Sitemap: https://visualstyleeditor.com/sitemap-index.xml');
  });

  it('declares security headers and agent discovery Link headers in _headers', () => {
    const headers = fs.readFileSync(headersPath, 'utf-8');

    expect(headers).toContain('X-Content-Type-Options: nosniff');
    expect(headers).toContain('X-Frame-Options: SAMEORIGIN');
    expect(headers).toContain('Referrer-Policy: strict-origin-when-cross-origin');
    expect(headers).toContain('/llms.txt');
    expect(headers).toContain('/llms-full.txt');
    expect(headers).toContain('sitemap-index.xml');
  });
});
