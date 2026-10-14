import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  SlidersHorizontal,
  Palette,
  Users2,
  WifiOff,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface UseCase {
  id: string;
  tabLabel: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tags: string[];
  interactiveDemo: {
    type: 'landing' | 'tokens' | 'handoff' | 'offline';
    sampleCode: string;
    classResult: string;
  };
}

const USE_CASES: UseCase[] = [
  {
    id: 'landing',
    tabLabel: 'Landing Page Tuning',
    badge: '0s Build Step',
    badgeColor: '#a855f7',
    title: 'Instant Landing Page Tuning Without Rebuilding',
    description:
      'Open client HTML in seconds. Tweak padding, typography scales, letter spacing, and elevation shadows live on the canvas. No Vite bundle restarts, no Webpack watching, no DevTools refresh loss.',
    icon: <SlidersHorizontal className="w-4 h-4" />,
    tags: ['Spacing Scale', 'Fluid Typography', 'Drop Shadows', 'Direct Disk Save'],
    interactiveDemo: {
      type: 'landing',
      sampleCode: '<section class="p-8 md:p-12 bg-zinc-900 rounded-3xl shadow-2xl">\n  <h1 class="text-3xl font-extrabold tracking-tight text-white">\n    Ship faster with VSE\n  </h1>\n</section>',
      classResult: 'p-8 md:p-12 rounded-3xl shadow-2xl tracking-tight',
    },
  },
  {
    id: 'tokens',
    tabLabel: 'Token Sync',
    badge: 'Tailwind v3 & v4',
    badgeColor: '#38bdf8',
    title: 'Design System Token Sync & @theme Bridge',
    description:
      'Map custom corporate palettes, OKLCH scales, and radius variables directly to Tailwind classes or v4 @theme declarations. When you pick a color or radius, the editor resolves it into your project\'s established token names.',
    icon: <Palette className="w-4 h-4" />,
    tags: ['Tailwind v4 @theme', 'OKLCH Spectrum', 'Custom Spacing', 'Semantic Tokens'],
    interactiveDemo: {
      type: 'tokens',
      sampleCode: '@theme {\n  --color-brand-primary: oklch(0.65 0.28 290);\n  --radius-studio: 1.25rem;\n  --shadow-glow: 0 0 30px oklch(0.65 0.28 290 / 0.35);\n}',
      classResult: 'bg-brand-primary rounded-studio shadow-glow',
    },
  },
  {
    id: 'handoff',
    tabLabel: 'Client Handoff',
    badge: 'Real-time Review',
    badgeColor: '#4ade80',
    title: 'Client Screen-Share & Live Polish Sessions',
    description:
      'No more tedious "make the logo 2px bigger" review tickets. Share your screen on Zoom or Google Meet, adjust spacing and colors with live visual handles, and hit Save to write straight into your local Git repo.',
    icon: <Users2 className="w-4 h-4" />,
    tags: ['Zero Back-and-Forth', 'Live Approvals', 'Direct Git Write', 'Instant Feedback'],
    interactiveDemo: {
      type: 'handoff',
      sampleCode: '<!-- Live Client Adjustment: Padding increased from 16px to 28px -->\n<button class="px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl shadow-lg transition-all">\n  Book Strategy Call\n</button>',
      classResult: 'px-7 py-3.5 bg-emerald-500 rounded-xl hover:scale-105',
    },
  },
  {
    id: 'offline',
    tabLabel: 'Offline Capable',
    badge: '100% Air-Gapped',
    badgeColor: '#fbbf24',
    title: 'Offline Emergency Tweaks with Zero Dependencies',
    description:
      'Working on a flight, at a remote retreat, or during an ISP outage? Visual Style Editor is 100% client-side with zero cloud endpoints, zero database locks, and zero external CDNs needed. It runs completely offline.',
    icon: <WifiOff className="w-4 h-4" />,
    tags: ['Air-Gapped Privacy', 'No Cloud Lock-in', 'Local Parse5 Engine', 'Offline PWA'],
    interactiveDemo: {
      type: 'offline',
      sampleCode: '// AST parse & character-offset splice in memory\nconst ast = parse5.parse(rawLocalHtml);\nconst patched = spliceByteRange(ast, startOffset, endOffset, newTokens);\nawait localFileHandle.write(patched);',
      classResult: '100% Local · 0 Bytes Sent Over Network',
    },
  },
];

export default function PossibilitiesShowcase() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [copied, setCopied] = useState<boolean>(false);

  // Dynamic interactive playground state inside the carousel
  const [paddingScale, setPaddingScale] = useState<number>(3); // index 0-4
  const [accentPalette, setAccentPalette] = useState<'violet' | 'lime' | 'cyan' | 'amber'>('violet');
  const [radiusPreset, setRadiusPreset] = useState<string>('rounded-2xl');

  const paddingClasses = ['p-4', 'p-6', 'p-8', 'p-10', 'p-14'];
  const paddingLabels = ['Compact (16px)', 'Cozy (24px)', 'Standard (32px)', 'Generous (40px)', 'Spacious (56px)'];

  const paletteStyles = {
    violet: {
      bg: 'rgba(168, 85, 247, 0.12)',
      border: 'rgba(168, 85, 247, 0.4)',
      glow: '0 0 25px rgba(168, 85, 247, 0.25)',
      text: 'var(--ink-1)',
      class: 'bg-violet-600/20 text-violet-400 border-violet-500/40',
    },
    lime: {
      bg: 'rgba(74, 222, 128, 0.12)',
      border: 'rgba(74, 222, 128, 0.4)',
      glow: '0 0 25px rgba(74, 222, 128, 0.25)',
      text: 'var(--ink-1)',
      class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    },
    cyan: {
      bg: 'rgba(56, 189, 248, 0.12)',
      border: 'rgba(56, 189, 248, 0.4)',
      glow: '0 0 25px rgba(56, 189, 248, 0.25)',
      text: 'var(--ink-1)',
      class: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
    },
    amber: {
      bg: 'rgba(251, 191, 36, 0.12)',
      border: 'rgba(251, 191, 36, 0.4)',
      glow: '0 0 25px rgba(251, 191, 36, 0.25)',
      text: 'var(--ink-1)',
      class: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    },
  };

  const currentUseCase = USE_CASES.find((u) => u.id === activeTab) || USE_CASES[0];

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Tailwind class string copied!', {
      description: 'Ready to paste into your HTML or JSX template.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="section py-20 relative overflow-hidden" style={{ background: 'var(--canvas)' }}>
      {/* Ambient background studio glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, #a855f7 0%, #38bdf8 50%, #4ade80 100%)',
        }}
        aria-hidden="true"
      />

      <div className="section-inner relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border select-none bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-500/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
            Unlimited Creative Workflows
          </div>

          <h2 className="text-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight" style={{ color: 'var(--ink-1)' }}>
            What you can build in minutes
          </h2>

          <p className="text-body text-base sm:text-lg max-w-2xl mx-auto" style={{ color: 'var(--ink-2)' }}>
            From split-second client landing page tweaks to enterprise token synchronization — see how creators supercharge their design loops.
          </p>
        </div>

        {/* Playful Pill Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          {USE_CASES.map((useCase) => {
            const isActive = activeTab === useCase.id;
            return (
              <button
                key={useCase.id}
                type="button"
                onClick={() => {
                  setActiveTab(useCase.id);
                  toast.info(`Switched to: ${useCase.tabLabel}`, {
                    duration: 1500,
                  });
                }}
                className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none border ${
                  isActive
                    ? 'shadow-lg scale-105'
                    : 'hover:scale-102 hover:border-zinc-500/30'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--surface-raised)' : 'var(--surface-1)',
                  borderColor: isActive ? useCase.badgeColor : 'var(--border)',
                  color: isActive ? 'var(--ink-1)' : 'var(--ink-3)',
                  boxShadow: isActive ? `0 8px 20px -4px ${useCase.badgeColor}40` : 'none',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full transition-transform group-hover:scale-125"
                  style={{ backgroundColor: useCase.badgeColor }}
                />
                <span className="flex items-center gap-1.5">{useCase.tabLabel}</span>
                <span
                  className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isActive ? `${useCase.badgeColor}20` : 'var(--surface-2)',
                    color: isActive ? useCase.badgeColor : 'var(--ink-4)',
                  }}
                >
                  {useCase.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Carousel Content Body */}
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="card-raised rounded-3xl p-6 sm:p-8 lg:p-10 border overflow-hidden backdrop-blur-xl"
              style={{
                backgroundColor: 'var(--surface-1)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left Column: Narrative & Tags */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-mono font-semibold"
                      style={{
                        backgroundColor: `${currentUseCase.badgeColor}18`,
                        color: currentUseCase.badgeColor,
                        border: `1px solid ${currentUseCase.badgeColor}40`,
                      }}
                    >
                      {currentUseCase.badge}
                    </span>
                    <span className="text-xs font-mono" style={{ color: 'var(--ink-3)' }}>
                      Interactive Studio Simulation
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--ink-1)' }}>
                    {currentUseCase.title}
                  </h3>

                  <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                    {currentUseCase.description}
                  </p>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {currentUseCase.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-xl text-xs font-medium border"
                        style={{
                          backgroundColor: 'var(--surface-2)',
                          borderColor: 'var(--border)',
                          color: 'var(--ink-2)',
                        }}
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Link & Playground CTA */}
                  <div className="pt-4 flex flex-wrap items-center gap-3">
                    <a
                      href="/editor"
                      className="btn btn-primary px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-2"
                    >
                      Test in live editor
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        toast.success('Simulated File System Sync!', {
                          description: '14 DOM nodes updated with zero server ping.',
                        });
                      }}
                      className="btn btn-secondary px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Test AST Roundtrip
                    </button>
                  </div>
                </div>

                {/* Right Column: Interactive Studio Sandbox Simulator */}
                <div className="lg:col-span-6">
                  <div
                    className="rounded-2xl border p-5 shadow-2xl space-y-4"
                    style={{
                      backgroundColor: 'var(--canvas-subtle)',
                      borderColor: 'var(--border-strong)',
                    }}
                  >
                    {/* Simulated Window Chrome */}
                    <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400/80" />
                        <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                        <span className="text-xs font-mono ml-2 font-medium" style={{ color: 'var(--ink-3)' }}>
                          studio_workspace.html
                        </span>
                      </div>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${currentUseCase.badgeColor}20`,
                          color: currentUseCase.badgeColor,
                        }}
                      >
                        AST Live
                      </span>
                    </div>

                    {/* Interactive Controls Bar */}
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span style={{ color: 'var(--ink-3)' }}>Padding Scale:</span>
                        <span className="font-semibold" style={{ color: 'var(--ink-1)' }}>
                          {paddingLabels[paddingScale]} ({paddingClasses[paddingScale]})
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="4"
                        value={paddingScale}
                        onChange={(e) => setPaddingScale(parseInt(e.target.value, 10))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />

                      {/* Accent Palette Selector */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-mono" style={{ color: 'var(--ink-3)' }}>
                          Theme Accent:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {(['violet', 'lime', 'cyan', 'amber'] as const).map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => {
                                setAccentPalette(color);
                                toast.info(`Accent tuned to ${color}`, { duration: 1200 });
                              }}
                              className={`w-5 h-5 rounded-md border-2 transition-transform ${
                                accentPalette === color ? 'scale-125 border-white shadow-md' : 'border-transparent'
                              }`}
                              style={{
                                backgroundColor: paletteStyles[color].border,
                              }}
                              aria-label={`Select ${color} color`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Live Preview Element */}
                    <motion.div
                      layout
                      className={`transition-all duration-300 border rounded-2xl flex flex-col justify-between ${paddingClasses[paddingScale]}`}
                      style={{
                        backgroundColor: paletteStyles[accentPalette].bg,
                        borderColor: paletteStyles[accentPalette].border,
                        boxShadow: paletteStyles[accentPalette].glow,
                      }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[11px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-lg border"
                            style={{
                              borderColor: paletteStyles[accentPalette].border,
                              color: paletteStyles[accentPalette].text,
                            }}
                          >
                            Live Component
                          </span>
                          <span className="text-[10px] font-mono" style={{ color: 'var(--ink-3)' }}>
                            60 FPS
                          </span>
                        </div>
                        <h4 className="text-sm font-bold mt-2" style={{ color: 'var(--ink-1)' }}>
                          Visual Style Editor Preview
                        </h4>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                          Drag sliders or select accent swatches above to watch Tailwind AST recompute in real-time.
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)' }}>
                        <span className="font-mono text-[10px]" style={{ color: 'var(--ink-3)' }}>
                          {paddingClasses[paddingScale]} {radiusPreset} {accentPalette}
                        </span>
                        <span className="text-[11px] font-semibold" style={{ color: paletteStyles[accentPalette].text }}>
                          Direct Save Ready
                        </span>
                      </div>
                    </motion.div>

                    {/* Code Snippet Box with Copy Action */}
                    <div
                      className="p-3 rounded-xl border flex items-center justify-between font-mono text-xs overflow-x-auto"
                      style={{
                        backgroundColor: 'var(--surface-1)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate mr-2">
                        class="{paddingClasses[paddingScale]} {radiusPreset} {paletteStyles[accentPalette].class}"
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyCode(
                            `${paddingClasses[paddingScale]} ${radiusPreset} ${paletteStyles[accentPalette].class}`
                          )
                        }
                        className="btn btn-ghost !p-1.5 rounded-lg text-ink-3 hover:text-ink-1 shrink-0 cursor-pointer"
                        title="Copy classes to clipboard"
                        aria-label="Copy class string"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
