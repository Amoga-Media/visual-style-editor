import React, { useState, useEffect } from 'react';
import { TEMPLATE_REGISTRY, type TemplateEntry } from '@/lib/templates/template-registry';
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  X,
  ArrowRight,
} from 'lucide-react';

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export default function TemplatePreviewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<TemplateEntry | null>(null);
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [isLoading, setIsLoading] = useState(true);

  // Global listener for preview buttons
  useEffect(() => {
    const handleTriggerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const btn = target.closest('[data-preview-template]');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const templateId = btn.getAttribute('data-preview-template');
        const found = TEMPLATE_REGISTRY.find((t) => t.id === templateId);
        if (found) {
          setActiveTemplate(found);
          setViewport('desktop');
          setIsLoading(true);
          setIsOpen(true);
        }
      }
    };

    document.addEventListener('click', handleTriggerClick);
    return () => document.removeEventListener('click', handleTriggerClick);
  }, []);

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Lock body scroll while modal is active
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !activeTemplate) return null;

  const viewportWidths: Record<ViewportMode, string> = {
    desktop: 'w-full max-w-full',
    tablet: 'w-[768px] max-w-[90vw]',
    mobile: 'w-[375px] max-w-[90vw]',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-preview-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="relative w-full max-w-7xl h-[94vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl transition-all duration-300"
        style={{
          background: 'var(--canvas)',
          borderColor: 'var(--border-strong)',
          color: 'var(--ink-1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b shrink-0"
          style={{
            background: 'var(--surface-1)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Left: Template info */}
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shrink-0 bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-500/40"
            >
              {activeTemplate.category}
            </span>
            <div className="min-w-0">
              <h2
                id="template-preview-title"
                className="text-sm sm:text-base font-bold truncate"
                style={{ color: 'var(--ink-1)' }}
              >
                {activeTemplate.name}
              </h2>
              <p
                className="text-[11px] font-mono truncate hidden sm:block"
                style={{ color: 'var(--ink-3)' }}
              >
                /templates/{activeTemplate.id}.html · 100% Client AST Ready
              </p>
            </div>
          </div>

          {/* Center: Responsive Viewport Switcher */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl border select-none"
            style={{
              background: 'var(--surface-2)',
              borderColor: 'var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                viewport === 'desktop'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Desktop</span>
            </button>

            <button
              type="button"
              onClick={() => setViewport('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                viewport === 'tablet'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tablet</span>
            </button>

            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                viewport === 'mobile'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mobile</span>
            </button>
          </div>

          {/* Right: Actions (Open in Studio + Open tab + Close) */}
          <div className="flex items-center gap-2">
            <a
              href={`/templates/${activeTemplate.id}.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium hover:border-purple-400/50 transition-colors"
              style={{
                background: 'var(--surface-2)',
                borderColor: 'var(--border)',
                color: 'var(--ink-2)',
              }}
              title="Open raw HTML in new browser tab"
            >
              <span>Full Tab</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>

            <a
              href={`/editor?template=${activeTemplate.id}`}
              className="btn btn-primary flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-transform"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                color: '#ffffff',
                borderColor: 'transparent',
              }}
            >
              <span>Open in Visual Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--ink-2)',
              }}
              aria-label="Close template preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas Body */}
        <div
          className="flex-1 overflow-auto p-3 sm:p-6 flex items-center justify-center relative"
          style={{ background: 'var(--canvas-subtle)' }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 shadow-xl border border-purple-500/30 text-xs font-mono font-bold text-purple-600 dark:text-purple-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
                <span>Loading template canvas...</span>
              </div>
            </div>
          )}

          {/* Device Mockup Frame */}
          <div
            className={`h-full flex flex-col rounded-2xl overflow-hidden shadow-2xl border transition-all duration-300 ${viewportWidths[viewport]}`}
            style={{
              borderColor: 'var(--border-strong)',
              background: '#ffffff',
            }}
          >
            {/* Device Bar if tablet or mobile */}
            {viewport !== 'desktop' && (
              <div
                className="px-4 py-2 border-b flex items-center justify-between text-[11px] font-mono select-none"
                style={{
                  background: 'var(--surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--ink-3)',
                }}
              >
                <span>{viewport === 'mobile' ? '375 × 812 (iPhone Frame)' : '768 × 1024 (iPad Frame)'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            )}

            <iframe
              key={`${activeTemplate.id}-${viewport}`}
              src={`/templates/${activeTemplate.id}.html`}
              title={`Preview of ${activeTemplate.name}`}
              className="w-full flex-1 border-0 bg-white"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
