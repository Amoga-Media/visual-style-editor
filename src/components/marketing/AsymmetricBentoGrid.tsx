import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Cpu,
  Palette,
  HardDrive,
  Activity,
  ShieldCheck,
  Zap,
  Code2,
  Check,
  Copy,
  Sliders,
} from 'lucide-react';

export default function AsymmetricBentoGrid() {
  // Diff toggle state: 'spliced' vs 'traditional'
  const [diffMode, setDiffMode] = useState<'spliced' | 'traditional'>('spliced');
  // OKLCH Hue State
  const [hue, setHue] = useState<number>(285); // Purple/Violet base
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Generate 9 tonal steps based on current hue
  const tonalSteps = [
    { step: 50, l: 0.97, c: 0.03 },
    { step: 100, l: 0.92, c: 0.07 },
    { step: 200, l: 0.84, c: 0.12 },
    { step: 300, l: 0.74, c: 0.18 },
    { step: 400, l: 0.65, c: 0.24 },
    { step: 500, l: 0.56, c: 0.28 },
    { step: 600, l: 0.47, c: 0.25 },
    { step: 700, l: 0.38, c: 0.21 },
    { step: 800, l: 0.29, c: 0.16 },
    { step: 900, l: 0.20, c: 0.10 },
  ];

  const currentToken = `oklch(0.56 0.28 ${hue})`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    toast.success(`Copied ${label}`, {
      description: text,
      duration: 3000,
    });
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 1. LARGE FEATURE CELL: AST Surgical Splicer (Cols 1-7) */}
        <motion.div
          className="lg:col-span-7 rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between border"
          style={{
            background: 'radial-gradient(100% 100% at 0% 0%, rgba(168, 85, 247, 0.07) 0%, var(--surface-1) 100%)',
            borderColor: 'var(--border)',
          }}
          whileHover={{ borderColor: 'rgba(168, 85, 247, 0.4)' }}
          transition={{ duration: 0.3 }}
        >
          {/* Ambient Glow */}
          <div
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ background: '#a855f7' }}
          />

          <div className="space-y-5 relative z-10">
            {/* Header with Frosted Icon Capsule */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3.5">
                <div className="frosted-icon-capsule violet">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                      Core Architecture
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-ink-1">
                    AST Surgical Splicer
                  </h3>
                </div>
              </div>

              {/* Interactive Diff Mode Switcher */}
              <div className="flex items-center p-1 rounded-xl border bg-black/5 dark:bg-black/20 text-xs font-mono select-none" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setDiffMode('spliced')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    diffMode === 'spliced'
                      ? 'bg-purple-600 text-white font-bold shadow-md'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  VSE Surgical (Byte Offset)
                </button>
                <button
                  type="button"
                  onClick={() => setDiffMode('traditional')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    diffMode === 'traditional'
                      ? 'bg-red-600 text-white font-bold shadow-md'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  Legacy DOM Serializer
                </button>
              </div>
            </div>

            <p className="text-sm leading-relaxed max-w-xl" style={{ color: 'var(--ink-2)' }}>
              Traditional site builders parse the entire DOM and serialize it back, stripping comments, destroying PHP/Blade tags, and altering whitespace. Visual Style Editor indexes exact byte start/end positions with Parse5 and slices only the modified attribute.
            </p>

            {/* Live Interactive Code Diff Showcase */}
            <div className="rounded-2xl border overflow-hidden font-mono text-xs shadow-inner" style={{ background: 'var(--code-bg)', borderColor: 'var(--border)' }}>
              {/* Diff Header Bar */}
              <div className="px-4 py-2.5 border-b flex items-center justify-between text-[11px]" style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Code2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>components/PricingCard.html</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-purple-700 dark:text-purple-400 font-bold">
                    {diffMode === 'spliced' ? 'Offset: [142, 189] • 0 collateral delta' : 'Whole Document Overwritten'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        diffMode === 'spliced'
                          ? '<div class="px-6 py-4 bg-zinc-950 rounded-2xl shadow-xl"> <!-- keep-comment -->'
                          : '<div>\n  <!-- COMMENT REMOVED BY SERIALIZER -->\n</div>',
                        'Code Sample'
                      )
                    }
                    className="p-1 hover:text-white text-zinc-400 transition-colors"
                    title="Copy snippet"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Code Content */}
              <div className="p-4 space-y-1.5 overflow-x-auto leading-relaxed">
                <AnimatePresence mode="wait">
                  {diffMode === 'spliced' ? (
                    <motion.div
                      key="spliced"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1"
                    >
                      <div className="text-zinc-500 select-none">
                        &nbsp;&nbsp;&lt;!-- Surgical preservation demo --&gt;
                      </div>
                      <div className="text-red-400/90 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                        &minus; &lt;div class="px-4 py-2 bg-slate-100"&gt; &lt;!-- developer review note --&gt;
                      </div>
                      <div className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                        + &lt;div class="px-6 py-4 bg-zinc-950 rounded-2xl shadow-xl"&gt; &lt;!-- developer review note --&gt;
                      </div>
                      <div className="text-zinc-500 select-none pl-4">
                        &nbsp;&nbsp;&#123;&#123; $bladeVar ?? 'unmolested' &#125;&#125;
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="traditional"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1"
                    >
                      <div className="text-red-400/90 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                        &minus; &lt;!-- developer review note stripped away --&gt;
                      </div>
                      <div className="text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        ! &lt;div class="generated-div-c831f2 custom-style-912"&gt;
                      </div>
                      <div className="text-red-400/90 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                        &minus; SyntaxError: Blade & PHP templates destroyed by DOM parser
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Footer Highlights */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono border-t mt-4" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
              <Check className="w-4 h-4" />
              <span>Preserves DOCTYPE, conditionals & custom tags</span>
            </div>
            <span className="text-purple-700 dark:text-purple-400 font-bold">100% Deterministic Byte Splice</span>
          </div>
        </motion.div>


        {/* 2. INTERACTIVE WIDGET CELL: Live OKLCH Color Spectrum (Cols 8-12) */}
        <motion.div
          className="lg:col-span-5 rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between border"
          style={{
            background: 'radial-gradient(100% 100% at 100% 0%, rgba(56, 189, 248, 0.08) 0%, var(--surface-1) 100%)',
            borderColor: 'var(--border)',
          }}
          whileHover={{ borderColor: 'rgba(56, 189, 248, 0.4)' }}
          transition={{ duration: 0.3 }}
        >
          {/* Ambient Glow */}
          <div
            className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ background: '#38bdf8' }}
          />

          <div className="space-y-5 relative z-10">
            {/* Header with Frosted Icon Capsule */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="frosted-icon-capsule cyan">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                    Perceptual Science
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-ink-1">
                    OKLCH Spectrum Lab
                  </h3>
                </div>
              </div>

              <span className="neon-callout-tag cyan text-[11px]">
                WCAG AAA 7.8:1
              </span>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              sRGB curves produce muddy middle grays and uneven lightness jumps. OKLCH guarantees consistent perceptual luminance across all 360° hues.
            </p>

            {/* Interactive Hue Slider */}
            <div className="space-y-2 p-3.5 rounded-2xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Hue Angle
                </span>
                <span className="font-bold text-sky-700 dark:text-sky-400">{hue}°</span>
              </div>

              {/* Rainbow Spectrum Bar */}
              <input
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={(e) => setHue(parseInt(e.target.value, 10))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background:
                    'linear-gradient(to right, oklch(0.6 0.25 0), oklch(0.6 0.25 60), oklch(0.6 0.25 120), oklch(0.6 0.25 180), oklch(0.6 0.25 240), oklch(0.6 0.25 300), oklch(0.6 0.25 360))',
                }}
              />
            </div>

            {/* Generated 9-Step Tonal Scale Swatches */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400 font-medium">
                <span>9-Step Harmonic Tonal Palette</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Uniform Chroma Ramp</span>
              </div>
              <div className="grid grid-cols-10 gap-1.5">
                {tonalSteps.map((s) => {
                  const oklchVal = `oklch(${s.l} ${s.c} ${hue})`;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => handleCopy(oklchVal, `Step ${s.step}`)}
                      title={`Step ${s.step}: ${oklchVal} (Click to copy)`}
                      className="group/swatch relative h-10 rounded-lg transition-transform hover:scale-110 focus:outline-none flex flex-col justify-end p-0.5"
                      style={{ backgroundColor: oklchVal }}
                    >
                      <span className="text-[8px] font-mono font-bold opacity-0 group-hover/swatch:opacity-100 transition-opacity text-black bg-white/80 rounded px-0.5 text-center">
                        {s.step}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Token Copy Box */}
            <div
              className="p-3 rounded-xl border flex items-center justify-between text-xs font-mono cursor-pointer transition-colors hover:border-sky-400"
              style={{ background: 'var(--code-bg)', borderColor: 'var(--border)' }}
              onClick={() => handleCopy(currentToken, 'OKLCH Token')}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: currentToken }}
                />
                <span className="text-ink-1 font-bold">{currentToken}</span>
              </div>
              <span className="text-sky-700 dark:text-sky-400 font-medium flex items-center gap-1">
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Token</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>


      {/* 3. FOUR STAT CELLS WITH AMBIENT FROSTED BADGES & KINETIC METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Stat 1: 0 Server Roundtrips */}
        <motion.div
          className="rounded-3xl p-6 border relative overflow-hidden flex flex-col justify-between"
          style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
          whileHover={{ y: -3, borderColor: 'rgba(74, 222, 128, 0.4)' }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="frosted-icon-capsule lime">
              <HardDrive className="w-5 h-5" />
            </div>
            <span className="neon-callout-tag lime text-[10px]">
              Local First
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-ink-1 mb-1">
              0 <span className="text-emerald-700 dark:text-emerald-400 text-lg font-sans font-bold">reqs</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
              Server Roundtrips
            </p>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              Air-gapped in browser RAM. Edits, previews, and saves require zero network connectivity.
            </p>
          </div>
        </motion.div>

        {/* Stat 2: 60 FPS Engine */}
        <motion.div
          className="rounded-3xl p-6 border relative overflow-hidden flex flex-col justify-between"
          style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
          whileHover={{ y: -3, borderColor: 'rgba(56, 189, 248, 0.4)' }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="frosted-icon-capsule cyan">
              <Activity className="w-5 h-5" />
            </div>
            <span className="neon-callout-tag cyan text-[10px]">
              60 Hz Sync
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-ink-1 mb-1">
              60 <span className="text-sky-700 dark:text-sky-400 text-lg font-sans font-bold">FPS</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
              Canvas Engine
            </p>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              GPU-accelerated overlay bounding boxes and tactile spring sliders with zero frame drop.
            </p>
          </div>
        </motion.div>

        {/* Stat 3: 0% Telemetry */}
        <motion.div
          className="rounded-3xl p-6 border relative overflow-hidden flex flex-col justify-between"
          style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
          whileHover={{ y: -3, borderColor: 'rgba(168, 85, 247, 0.4)' }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="frosted-icon-capsule violet">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="neon-callout-tag violet text-[10px]">
              Privacy Sovereign
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-ink-1 mb-1">
              0% <span className="text-purple-700 dark:text-purple-400 text-lg font-sans font-bold">Telemetry</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
              Tracking / Analytics
            </p>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              Zero tracking cookies, zero analytics beacons. MIT licensed with total source transparency.
            </p>
          </div>
        </motion.div>

        {/* Stat 4: <2ms Disk IO */}
        <motion.div
          className="rounded-3xl p-6 border relative overflow-hidden flex flex-col justify-between"
          style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
          whileHover={{ y: -3, borderColor: 'rgba(251, 191, 36, 0.4)' }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="frosted-icon-capsule amber">
              <Zap className="w-5 h-5" />
            </div>
            <span className="neon-callout-tag amber text-[10px]">
              Direct Writable
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-ink-1 mb-1">
              &lt;2 <span className="text-amber-700 dark:text-amber-400 text-lg font-sans font-bold">ms</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
              Disk Write Latency
            </p>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              Native File System Access API streams updates directly into your local Git working tree.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
