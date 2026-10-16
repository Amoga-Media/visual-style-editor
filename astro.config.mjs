import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://visualstyleeditor.com',
  devToolbar: {
    enabled: false,
  },
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'lenis',
        'gsap',
        'gsap/ScrollTrigger',
        'parse5',
        'acorn',
        'culori',
        'clsx',
        'tailwind-merge',
        'framer-motion',
        'zustand',
        'lucide-react',
        'sonner',
        'posthog-js',
      ],
      holdUntilCrawlEnd: true,
    },
  },
});
