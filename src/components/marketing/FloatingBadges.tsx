import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { toast } from 'sonner';
import { HardDrive, Cpu, Sparkles, Zap, Lock } from 'lucide-react';

interface BadgeItem {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  border: string;
  text: string;
  bg: string;
  icon: React.ReactNode;
  toastMsg: string;
  toastDesc: string;
  delay?: number;
}

const BADGES: BadgeItem[] = [
  {
    id: 'local',
    label: '100% Local Disk',
    sublabel: 'File System Access API',
    color: '#15803d',
    border: 'rgba(74, 222, 128, 0.35)',
    text: '#15803d',
    bg: 'rgba(74, 222, 128, 0.12)',
    icon: <HardDrive className="w-3.5 h-3.5" />,
    toastMsg: '⚡ Direct Disk Write Active',
    toastDesc: 'Changes write directly to your local file in <2ms with zero cloud upload.',
    delay: 0.05,
  },
  {
    id: 'cloudless',
    label: '100% Local / Zero Cloud',
    sublabel: 'Local browser sandbox',
    color: '#0284c7',
    border: 'rgba(56, 189, 248, 0.35)',
    text: '#0284c7',
    bg: 'rgba(56, 189, 248, 0.12)',
    icon: <Lock className="w-3.5 h-3.5" />,
    toastMsg: '🛡️ 100% Local & Private',
    toastDesc: 'Zero server uploads. Your code never leaves your computer.',
    delay: 0.1,
  },
  {
    id: 'ast',
    label: 'Parse5 AST Splicer',
    sublabel: 'Byte-offset surgical precision',
    color: '#7e22ce',
    border: 'rgba(168, 85, 247, 0.35)',
    text: '#7e22ce',
    bg: 'rgba(168, 85, 247, 0.12)',
    icon: <Cpu className="w-3.5 h-3.5" />,
    toastMsg: '✨ AST Engine Synchronized',
    toastDesc: 'Comments, templates, and indentation are preserved bit-for-bit.',
    delay: 0.15,
  },
  {
    id: 'mit',
    label: 'MIT Licensed',
    sublabel: 'Free forever for all creators',
    color: '#b45309',
    border: 'rgba(251, 191, 36, 0.35)',
    text: '#b45309',
    bg: 'rgba(251, 191, 36, 0.12)',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    toastMsg: '🎉 Free & Open Source',
    toastDesc: 'No subscription, no watermark, no feature gates.',
    delay: 0.2,
  },
  {
    id: 'fps',
    label: '60 FPS Canvas Viewport',
    sublabel: 'Hardware accelerated',
    color: '#be123c',
    border: 'rgba(244, 63, 94, 0.35)',
    text: '#be123c',
    bg: 'rgba(244, 63, 94, 0.12)',
    icon: <Zap className="w-3.5 h-3.5" />,
    toastMsg: '🚀 Smooth 60 FPS Viewport',
    toastDesc: 'Hardware-accelerated live preview iframe with zero layout stutter.',
    delay: 0.25,
  },
];

function TiltBadge({ badge, index }: { badge: BadgeItem; index: number }) {
  const cardRef = useRef<HTMLButtonElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={cardRef}
      type="button"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        toast.success(badge.toastMsg, {
          description: badge.toastDesc,
          duration: 3500,
        });
      }}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.45,
        delay: badge.delay,
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        backgroundColor: 'var(--surface-1)',
        borderColor: badge.border,
      }}
      whileHover={{
        scale: 1.07,
        boxShadow: `0 14px 28px -6px ${badge.border}, 0 0 20px -4px ${badge.bg}`,
      }}
      whileTap={{ scale: 0.95 }}
      className="group relative cursor-pointer px-3.5 py-2 rounded-2xl border backdrop-blur-md text-left flex items-center gap-2.5 shadow-sm select-none will-change-transform"
    >
      {/* Glowing indicator pill */}
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
        style={{
          backgroundColor: badge.bg,
          color: badge.color,
          border: `1px solid ${badge.border}`,
          transform: 'translateZ(10px)',
        }}
      >
        {badge.icon}
      </div>

      <div style={{ transform: 'translateZ(8px)' }}>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold tracking-tight text-ink-1" style={{ color: 'var(--ink-1)' }}>
            {badge.label}
          </span>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badge.color }} />
        </div>
        <p className="text-[10px] font-mono leading-none mt-0.5 font-medium" style={{ color: 'var(--ink-2)' }}>
          {badge.sublabel}
        </p>
      </div>
    </motion.button>
  );
}

export default function FloatingBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-4 w-full perspective-[1000px]">
      {BADGES.map((badge, idx) => (
        <TiltBadge key={badge.id} badge={badge} index={idx} />
      ))}
    </div>
  );
}
