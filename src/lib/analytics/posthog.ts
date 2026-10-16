import posthog from 'posthog-js';

let isInitialized = false;

export interface PostHogConfig {
  apiKey?: string;
  apiHost?: string;
}

/**
 * Initializes PostHog browser analytics if configured.
 * Safely handles missing keys, development mode, and SSR guard.
 */
export function initPostHog(customConfig?: PostHogConfig): typeof posthog | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (isInitialized) {
    return posthog;
  }

  const globalScope = window as unknown as {
    PUBLIC_POSTHOG_KEY?: string;
    PUBLIC_POSTHOG_HOST?: string;
  };

  const apiKey =
    customConfig?.apiKey ||
    import.meta.env.PUBLIC_POSTHOG_KEY ||
    globalScope.PUBLIC_POSTHOG_KEY ||
    '';

  const apiHost =
    customConfig?.apiHost ||
    import.meta.env.PUBLIC_POSTHOG_HOST ||
    globalScope.PUBLIC_POSTHOG_HOST ||
    'https://us.i.posthog.com';

  if (!apiKey || apiKey === 'YOUR_POSTHOG_API_KEY' || apiKey.trim() === '') {
    if (import.meta.env.DEV) {
      console.info(
        '[PostHog Analytics] posthog-js installed and ready. Provide PUBLIC_POSTHOG_KEY in your .env file to enable live event ingestion.'
      );
    }
    return null;
  }

  try {
    posthog.init(apiKey, {
      api_host: apiHost,
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      persistence: 'localStorage+cookie',
      loaded: () => {
        if (import.meta.env.DEV) {
          console.info('[PostHog Analytics] Initialized successfully with host:', apiHost);
        }
      },
    });

    isInitialized = true;
    return posthog;
  } catch (error) {
    console.error('[PostHog Analytics] Initialization error:', error);
    return null;
  }
}

/**
 * Safely captures a custom analytics event if PostHog is initialized.
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    if (isInitialized) {
      posthog.capture(eventName, properties);
    }
  } catch (err) {
    console.warn('[PostHog Analytics] Error capturing event:', err);
  }
}

export { posthog };
