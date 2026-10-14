import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Clock,
  Sparkles,
  Split,
  Zap,
  Lock,
  Unlock,
  Check,
  X,
} from 'lucide-react';

interface Milestone {
  id: string;
  year: string;
  title: string;
  subtitle: string;
  badgeColor: string;
  icon: React.ReactNode;
  narrative: string;
  takeaway: string;
  codeSnippet: string;
}

const MILESTONES: Milestone[] = [
  {
    id: 'broken-loop',
    year: '2021',
    title: 'The Broken Loop',
    subtitle: 'DevTools ephemeral wipes & proprietary cloud lock-in',
    badgeColor: 'violet',
    icon: <Clock className="w-5 h-5 text-purple-400" />,
    narrative:
      'We spent years building production web apps with Tailwind. Every day was an exercise in frustration: you would tune styles for 20 minutes in Chrome DevTools, accidentally trigger an automatic page reload, and lose all your work. Or you would import markup into proprietary cloud visual builders, only to watch them strip comments, mangle indentation, and hostage your code behind recurring monthly subscriptions.',
    takeaway: 'Why does editing a local HTML file require a remote server at all?',
    codeSnippet: `// 2021 DevTools Tragedy:
// Tweak 40 CSS classes...
window.location.reload(); 
// -> ALL EDITS LOST TO THE VOID.`,
  },
  {
    id: 'parse5-epiphany',
    year: '2023',
    title: 'The Parse5 Epiphany',
    subtitle: 'Byte-offset location indexing for surgical AST edits',
    badgeColor: 'cyan',
    icon: <Cpu className="w-5 h-5 text-sky-400" />,
    narrative:
      'The turning point came when we discovered Parse5\'s source-code location tracking. Parse5 doesn\'t merely construct an abstract tree — it documents the exact start and end character offsets of every attribute and tag. Instead of serializing the entire DOM document, we could slice the original HTML string at exact coordinates, substitute the modified class, and rejoin the parts.',
    takeaway: 'Adjacent template logic, PHP tags, and comments remain 100% untouched.',
    codeSnippet: `const ast = parse5.parse(html, { sourceCodeLocationInfo: true });
const loc = node.sourceCodeLocation.attrs.class;
// Slice at exact byte coordinates:
const clean = html.slice(0, loc.startOffset) + newClass + html.slice(loc.endOffset);`,
  },
  {
    id: 'local-first',
    year: 'Today',
    title: 'The Local-First Revolution',
    subtitle: 'Direct File System Access API with 0 server dependencies',
    badgeColor: 'lime',
    icon: <Zap className="w-5 h-5 text-emerald-400" />,
    narrative:
      'The final piece arrived with the browser\'s File System Access API. With one click, users grant permission to edit their actual local project folder. Visual Style Editor writes straight to disk via native writable streams in <2ms. No backend. No logins. No telemetry. Free, open source, and sovereign.',
    takeaway: 'Your code lives on your disk. Where it belongs.',
    codeSnippet: `const writable = await fileHandle.createWritable();
await writable.write(surgicallySplicedHtml);
await writable.close();
// Stream commits directly to your local Git branch in 1.4ms.`,
  },
];

export default function StoryManifestoInteractive() {
  const [activeMilestone, setActiveMilestone] = useState<string>('broken-loop');
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 to 100
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  const updatePosition = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = clientX - rect.left;
    const clampedX = Math.max(0, Math.min(x, rect.width));
    const percent = Math.round((clampedX / rect.width) * 100);
    setSliderPos(percent);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    updatePosition(e.clientX);
  };

  const active = MILESTONES.find((m) => m.id === activeMilestone) || MILESTONES[0];

  return (
    <div className="w-full space-y-24">

      {/* ============================================================
           1. INTERACTIVE CODE DIFFERENCE SHOWCASE (BEFORE / AFTER SLIDER)
           ============================================================ */}
      <div className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="badge text-xs font-mono uppercase tracking-wider px-3 py-1 text-purple-400 border border-purple-500/30 bg-purple-500/10">
            Interactive Code Comparison Slider
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-ink-1">
            Stripped Cloud Builders vs. Surgically Preserved VSE Markup
          </h2>
          <p className="text-sm text-zinc-400">
            Drag the center divider to inspect how Visual Style Editor protects your real codebase.
          </p>
        </div>

        {/* Drag Slider Comparison Box */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerCancel={handlePointerUp}
          className="relative w-full max-w-5xl mx-auto h-[440px] sm:h-[380px] rounded-3xl overflow-hidden border shadow-2xl select-none cursor-ew-resize font-mono text-xs touch-none"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--code-bg)',
            touchAction: 'none',
          }}
        >
          {/* RIGHT BASE LAYER (VSE Surgically Preserved Markup - 100% width base) */}
          <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between bg-zinc-950 text-emerald-300 pointer-events-none select-none">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>VSE SURGICAL AST OUTPUT (LOCAL SOVEREIGNTY)</span>
                </div>
                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  100% Comments & Blade Intact
                </span>
              </div>
              <pre className="pt-4 leading-6 overflow-x-auto text-[11px] sm:text-xs text-zinc-300">
{`<!-- Production Component: Pricing Card -->
<div class="px-8 py-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
  <!-- Critical developer rationale: DO NOT REMOVE -->
  <h2 class="text-2xl font-bold tracking-tight text-white">
    {{ $plan->title }}
  </h2>
  @if($plan->isFeatured)
    <span class="badge bg-emerald-500/10 text-emerald-400 font-mono">POPULAR</span>
  @endif
  <p class="text-sm text-zinc-400 mt-2">{{ $plan->description }}</p>
</div>`}
              </pre>
            </div>
            <div className="text-[10px] text-emerald-400/80 flex items-center justify-between">
              <span>✓ Byte offset [142, 198] updated</span>
              <span>✓ Zero server telemetry</span>
            </div>
          </div>

          {/* LEFT OVERLAY LAYER (Stripped Cloud HTML - full width with clip-path so text never reflows or crushes) */}
          <div
            className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between bg-zinc-900 text-red-300 shadow-2xl pointer-events-none select-none"
            style={{
              clipPath: `inset(0 calc(100% - ${sliderPos}%) 0 0)`,
              WebkitClipPath: `inset(0 calc(100% - ${sliderPos}%) 0 0)`,
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-red-500/20 text-[11px]">
                <div className="flex items-center gap-2 text-red-400 font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>PROPRIETARY CLOUD BUILDER EXPORT</span>
                </div>
                <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                  Comments & Logic Stripped
                </span>
              </div>
              <pre className="pt-4 leading-6 overflow-x-auto text-[11px] sm:text-xs text-red-200/80">
{`<!-- (ALL COMMENTS STRIPPED BY SERIALIZER) -->
<div class="w-layout-grid wf-card-wrapper-c8129 custom-css-block-9">
  
  <div class="heading-style-2 text-white">
    <!-- BLADE LOGIC DESTROYED: $plan->title missing -->
  </div>
  
  
  <p class="paragraph-small mt-2"></p>
</div>`}
              </pre>
            </div>
            <div className="text-[10px] text-red-400/80 flex items-center justify-between">
              <span>✕ Mangled CSS selectors</span>
              <span>✕ Locked in proprietary cloud</span>
            </div>
          </div>

          {/* DRAGGABLE HANDLE DIVIDER */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{
              left: `${sliderPos}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Center glowing line */}
            <div className="w-0.5 h-full mx-auto bg-gradient-to-b from-purple-400 via-sky-400 to-emerald-400 shadow-[0_0_12px_rgba(168,85,247,0.7)]" />

            {/* Circular grab pill with bounded margin so it stays inside rounded-3xl container */}
            <div
              role="slider"
              aria-label="Code comparison slider"
              aria-valuenow={sliderPos}
              aria-valuemin={0}
              aria-valuemax={100}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') setSliderPos((p) => Math.max(0, p - 5));
                if (e.key === 'ArrowRight') setSliderPos((p) => Math.min(100, p + 5));
                if (e.key === 'Home') setSliderPos(0);
                if (e.key === 'End') setSliderPos(100);
              }}
              style={{
                transform: `translate(calc(-50% + ${sliderPos < 3 ? '16px' : sliderPos > 97 ? '-16px' : '0px'}), -50%)`,
              }}
              className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full bg-white text-zinc-950 shadow-2xl flex items-center justify-center font-bold text-xs ring-4 ring-purple-500/30 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-400 cursor-ew-resize pointer-events-auto"
            >
              <Split className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Slider Indicator Bar with Interactive Quick Jumps */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs font-mono text-zinc-400 select-none">
          <button
            type="button"
            onClick={() => setSliderPos(0)}
            className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer transition-colors px-2.5 py-1 rounded-lg hover:bg-emerald-500/10 border border-emerald-500/20"
          >
            ← 100% VSE Output
          </button>
          <button
            type="button"
            onClick={() => setSliderPos(50)}
            className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 font-bold cursor-pointer transition-colors border border-purple-500/30"
          >
            {sliderPos}% · Reset 50/50
          </button>
          <button
            type="button"
            onClick={() => setSliderPos(100)}
            className="text-red-400 hover:text-red-300 font-semibold cursor-pointer transition-colors px-2.5 py-1 rounded-lg hover:bg-red-500/10 border border-red-500/20"
          >
            100% Cloud Export →
          </button>
        </div>
      </div>


      {/* ============================================================
           2. INTERACTIVE FOUNDER MILESTONES (2021 -> 2023 -> TODAY)
           ============================================================ */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="badge text-xs font-mono uppercase tracking-wider px-3 py-1 text-sky-400 border border-sky-500/30 bg-sky-500/10">
            Interactive Journey
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-ink-1">
            Three Turning Points
          </h2>
          <p className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>
            Click any milestone to inspect how our architecture evolved.
          </p>
        </div>

        {/* Milestone Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {MILESTONES.map((m) => {
            const isSelected = m.id === activeMilestone;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setActiveMilestone(m.id);
                  toast.info(`${m.year}: ${m.title}`, {
                    description: m.subtitle,
                    duration: 3000,
                  });
                }}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-100 border-purple-500 text-purple-950 font-bold dark:bg-purple-600/25 dark:text-purple-100 dark:border-purple-400 shadow-lg shadow-purple-500/10'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-950 hover:border-zinc-400 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:hover:border-zinc-700'
                }`}
              >
                <span>{m.icon}</span>
                <span className="font-bold">{m.year}</span>
                <span>•</span>
                <span>{m.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Milestone Display Card */}
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl p-6 sm:p-10 border shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              style={{
                background: 'var(--surface-1)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="badge text-xs font-mono font-bold text-purple-700 bg-purple-100 border-purple-300 dark:text-purple-300 dark:bg-purple-500/15 dark:border-purple-500/30 px-3 py-1">
                    {active.year} Milestone
                  </span>
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 font-medium">{active.subtitle}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-ink-1">
                  {active.title}
                </h3>

                <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                  {active.narrative}
                </p>

                <div className="p-4 rounded-2xl border bg-black/10 dark:bg-black/20 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold flex items-start gap-2.5" style={{ borderColor: 'var(--border)' }}>
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <span>Takeaway: {active.takeaway}</span>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="code-block rounded-2xl shadow-xl border overflow-hidden p-0" style={{ background: 'var(--code-bg)', borderColor: 'var(--border)' }}>
                  <div className="px-4 py-2.5 border-b flex items-center justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400" style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.06)' }}>
                    <span>history/{active.id}.ts</span>
                    <span className="text-purple-700 dark:text-purple-400 font-bold">{active.year}</span>
                  </div>
                  <pre className="p-4 text-xs font-mono leading-relaxed text-zinc-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap">{active.codeSnippet}</pre>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>


      {/* ============================================================
           3. THEN VS. NOW PHILOSOPHY GRID (Cloud Lock-in vs. Local Sovereignty)
           ============================================================ */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="badge text-xs font-mono uppercase tracking-wider px-3 py-1 text-emerald-700 bg-emerald-100 border-emerald-300 dark:text-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/30">
            Uncompromising Values
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-ink-1">
            Then vs. Now: Philosophy Grid
          </h2>
          <p className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>
            Why we refused to compromise on developer sovereignty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Cloud Lock-in Paradigm (Red/Gray Tone) */}
          <div
            className="rounded-3xl p-6 sm:p-8 border relative overflow-hidden space-y-6"
            style={{
              background: 'radial-gradient(100% 100% at 0% 0%, rgba(239, 68, 68, 0.05) 0%, var(--surface-1) 100%)',
              borderColor: 'rgba(239, 68, 68, 0.25)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="frosted-icon-capsule text-red-600 dark:text-red-400" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold text-red-700 dark:text-red-300 uppercase tracking-wider bg-red-100 dark:bg-red-500/15 px-3 py-1 rounded-full border border-red-300 dark:border-red-500/30">
                The Cloud Trap
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-ink-1 mb-2">Cloud Builder Paradigm</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                Your templates reside in remote database silos. Every adjustment is uploaded, processed, and tracked by third-party telemetry. You pay monthly rents to access your own work.
              </p>
            </div>

            <ul className="space-y-3 pt-2 text-xs font-mono">
              {[
                'Monthly recurring subscription paywalls',
                'Proprietary CSS classes & lock-in exports',
                'Strips developer comments & template directives',
                'Files hosted on external cloud databases',
                'Requires constant high-speed internet',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-red-700 dark:text-red-400 font-medium">
                  <X className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2: Local Sovereignty Paradigm (Emerald/Violet Tone) */}
          <div
            className="rounded-3xl p-6 sm:p-8 border relative overflow-hidden space-y-6"
            style={{
              background: 'radial-gradient(100% 100% at 100% 0%, rgba(74, 222, 128, 0.08) 0%, var(--surface-1) 100%)',
              borderColor: 'rgba(74, 222, 128, 0.35)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="frosted-icon-capsule lime">
                <Unlock className="w-5 h-5" />
              </div>
              <span className="neon-callout-tag lime text-xs font-bold">
                Local Sovereignty
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-ink-1 mb-2">Visual Style Editor</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                Runs 100% inside your browser RAM. Edits stream directly into your local Git working tree with zero server hops. MIT licensed, permanently free, and private.
              </p>
            </div>

            <ul className="space-y-3 pt-2 text-xs font-mono">
              {[
                'MIT Licensed — genuinely free forever',
                'Idiomatic Tailwind CSS v3 & v4 tokens',
                'Preserves comments, DOCTYPE, and Blade tags bit-for-bit',
                'Writes directly to your local Git disk in <2ms',
                'Air-gapped by design: works 100% offline',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
