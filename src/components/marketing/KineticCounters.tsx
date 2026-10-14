import React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ServerOff, Zap, Shield, HardDrive } from 'lucide-react';

interface MetricItem {
  id: string;
  metric: string;
  unit: string;
  label: string;
  sublabel: string;
  color: string;
  icon: React.ReactNode;
  toastTitle: string;
  toastDesc: string;
}

const METRICS: MetricItem[] = [
  {
    id: 'server',
    metric: '0',
    unit: 'ms',
    label: 'Server Roundtrips',
    sublabel: '100% Client-Side Memory',
    color: '#a855f7',
    icon: <ServerOff className="w-5 h-5 text-purple-400" />,
    toastTitle: 'Zero Network Requests',
    toastDesc: 'Your code never leaves your device — all AST surgery happens locally.',
  },
  {
    id: 'fps',
    metric: '60',
    unit: 'FPS',
    label: 'AST Canvas Engine',
    sublabel: 'Hardware Accelerated',
    color: '#38bdf8',
    icon: <Zap className="w-5 h-5 text-sky-400" />,
    toastTitle: 'Smooth 60 FPS Viewport',
    toastDesc: 'Interactive canvas updates in sync with your display refresh rate.',
  },
  {
    id: 'telemetry',
    metric: '0',
    unit: '%',
    label: 'Telemetry Trackers',
    sublabel: 'Air-Gapped Privacy',
    color: '#4ade80',
    icon: <Shield className="w-5 h-5 text-emerald-400" />,
    toastTitle: 'Zero Telemetry & Zero Cookies',
    toastDesc: 'No Google Analytics, no PostHog, no background phone-home calls.',
  },
  {
    id: 'disk',
    metric: '< 2',
    unit: 'ms',
    label: 'Disk Write Latency',
    sublabel: 'File System Access API',
    color: '#fbbf24',
    icon: <HardDrive className="w-5 h-5 text-amber-400" />,
    toastTitle: 'Instant Disk Commit',
    toastDesc: 'Writes byte-for-byte directly to your repository in under 2 milliseconds.',
  },
];

export default function KineticCounters() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {METRICS.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          whileHover={{
            scale: 1.04,
            y: -4,
            boxShadow: `0 12px 30px -10px ${item.color}35`,
          }}
          onClick={() => {
            toast.success(item.toastTitle, {
              description: item.toastDesc,
              duration: 3000,
            });
          }}
          className="card-raised p-5 rounded-2xl border cursor-pointer select-none transition-all duration-200 group relative overflow-hidden backdrop-blur-md"
          style={{
            backgroundColor: 'var(--surface-1)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Subtle colored accent glow in corner */}
          <div
            className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none group-hover:opacity-30 transition-opacity"
            style={{ backgroundColor: item.color }}
          />

          <div className="flex items-center justify-between mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110"
              style={{
                backgroundColor: `${item.color}15`,
                borderColor: `${item.color}35`,
              }}
            >
              {item.icon}
            </div>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--border)',
                color: 'var(--ink-3)',
              }}
            >
              Live Metric
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span
              className="text-3xl sm:text-4xl font-black tracking-tight font-mono group-hover:tracking-normal transition-all"
              style={{ color: item.color }}
            >
              {item.metric}
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: 'var(--ink-2)' }}>
              {item.unit}
            </span>
          </div>

          <p className="text-xs font-bold mt-1 tracking-tight" style={{ color: 'var(--ink-1)' }}>
            {item.label}
          </p>
          <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--ink-3)' }}>
            {item.sublabel}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
