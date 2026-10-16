import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { initPostHog, trackEvent } from '@/lib/analytics/posthog';

describe('Google Ads & Legal Compliance — Privacy Policy', () => {
  const privacyPath = path.resolve(process.cwd(), 'src/pages/privacy.astro');
  const privacyContent = fs.readFileSync(privacyPath, 'utf-8');

  it('contains mandatory Third-Party Vendor Disclosure for Google Ads', () => {
    // Explicit disclosure: Third-party vendors, including Google, use cookies to serve ads based on prior visits
    expect(privacyContent).toContain('Third-Party Vendor Disclosure');
    expect(privacyContent).toMatch(/third-party vendors, including google, use cookies to serve ads/i);
  });

  it("contains mandatory Google's Use of Advertising Cookies disclosure", () => {
    // Explicit disclosure: Google's use of advertising cookies enables it and its partners to serve ads
    expect(privacyContent).toContain("Google's Use of Advertising Cookies");
    expect(privacyContent).toMatch(/google's use of advertising cookies enables it and its partners to serve ads/i);
  });

  it('provides explicit personalized advertising opt-out links', () => {
    // Google Ads Settings
    expect(privacyContent).toContain('https://adssettings.google.com');
    // Digital Advertising Alliance (www.aboutads.info)
    expect(privacyContent).toMatch(/aboutads\.info/i);
    // Network Advertising Initiative
    expect(privacyContent).toContain('https://optout.networkadvertising.org');
    // European Interactive Digital Advertising Alliance
    expect(privacyContent).toContain('https://www.youronlinechoices.eu');
  });

  it('details what user data is collected and why it is collected', () => {
    expect(privacyContent).toContain('Usage Data');
    expect(privacyContent).toContain('Device & Technical Data');
    expect(privacyContent).toMatch(/IP.*address/i);
    expect(privacyContent).toContain('Contact & Communication Details');
    expect(privacyContent).toContain('Purposes & Legal Bases');
    expect(privacyContent).toContain('Advertising Measurement & Conversion Attribution');
  });

  it('discloses PostHog product analytics integration and telemetry', () => {
    expect(privacyContent).toContain('PostHog');
    expect(privacyContent).toContain('posthog-js');
    expect(privacyContent).toMatch(/first-party cookies or browser localstorage/i);
  });

  it('affirms 100% local-first code security and zero server storage of user code', () => {
    expect(privacyContent).toContain('File System Access API');
    expect(privacyContent).toMatch(/never uploaded, stored, or transmitted to our servers/i);
    expect(privacyContent).toContain('Your Source Code Never Leaves Your Computer');
  });

  it('details data sharing with third-party service providers and security safeguards', () => {
    expect(privacyContent).toContain('Google LLC');
    expect(privacyContent).toContain('PostHog Inc.');
    expect(privacyContent).toContain('TLS 1.3');
    expect(privacyContent).toMatch(/do not sell/i);
  });
});

describe('Legal Protection & Contractual Rigor — Terms of Service', () => {
  const termsPath = path.resolve(process.cwd(), 'src/pages/terms.astro');
  const termsContent = fs.readFileSync(termsPath, 'utf-8');

  it('contains unambiguous Acceptance of Terms binding clause', () => {
    expect(termsContent).toContain('Acceptance of Terms');
    expect(termsContent).toMatch(/agree to be bound by these terms of service/i);
  });

  it('defines User Accounts and credential safeguarding responsibilities', () => {
    expect(termsContent).toContain('User Accounts, Sessions & Security Responsibilities');
    expect(termsContent).toMatch(/safeguarding/i);
    expect(termsContent).toMatch(/responsible for all activities/i);
  });

  it('contains comprehensive Acceptable Use Policy prohibiting scraping, reverse engineering, and harmful code', () => {
    expect(termsContent).toContain('Acceptable Use Policy');
    expect(termsContent).toMatch(/automated scraping/i);
    expect(termsContent).toMatch(/reverse engineering/i);
    expect(termsContent).toMatch(/malware/i);
    expect(termsContent).toMatch(/unlawful/i);
  });

  it('protects Visual Style Editor exclusive intellectual property while preserving 100% user code ownership', () => {
    expect(termsContent).toContain('Exclusive Property of Visual Style Editor');
    expect(termsContent).toContain('100% User Code & Content Ownership');
    expect(termsContent).toMatch(/exclusive intellectual property/i);
  });

  it("includes robust 'As-Is' warranty exclusion and liability limitations", () => {
    expect(termsContent).toMatch(/as is/i);
    expect(termsContent).toMatch(/as available/i);
    expect(termsContent).toContain('Limitation of Liability & Disclaimers');
    expect(termsContent).toMatch(/loss of profits/i);
  });

  it('discloses third-party services and Google Ads in Terms', () => {
    expect(termsContent).toContain('Google Ads');
    expect(termsContent).toContain('PostHog');
  });

  it('reserves the right to terminate or suspend access immediately', () => {
    expect(termsContent).toContain('Termination & Suspension of Access');
    expect(termsContent).toMatch(/immediately suspend, restrict, or terminate/i);
  });

  it('specifies Governing Law and Dispute Resolution', () => {
    expect(termsContent).toContain('Governing Law & Dispute Resolution');
    expect(termsContent).toMatch(/jurisdiction/i);
  });
});

describe('PostHog Analytics Integration Module', () => {
  it('handles initialization gracefully when no API key is set', () => {
    const result = initPostHog({ apiKey: '' });
    expect(result).toBeNull();
  });

  it('trackEvent does not throw even if uninitialized', () => {
    expect(() => {
      trackEvent('test_event', { property: 'value' });
    }).not.toThrow();
  });
});
