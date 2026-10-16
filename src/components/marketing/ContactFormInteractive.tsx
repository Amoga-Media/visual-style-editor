import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Send,
  Bug,
  Lightbulb,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  Sparkles,
} from 'lucide-react';

type CategoryType = 'inquiry' | 'feature' | 'bug' | 'feedback';

interface CategoryOption {
  id: CategoryType;
  label: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
  placeholder: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'inquiry',
    label: 'General Inquiry / Partnership',
    icon: <HelpCircle className="w-4 h-4 text-purple-400" />,
    badge: 'Partnership',
    badgeColor: 'violet',
    placeholder: 'Tell us about your team, partnership proposal, or questions regarding Visual Style Editor...',
  },
  {
    id: 'feature',
    label: 'Ask for a Feature',
    icon: <Lightbulb className="w-4 h-4 text-sky-400" />,
    badge: 'Roadmap',
    badgeColor: 'cyan',
    placeholder: 'Describe the feature you need, your exact workflow, and how it would improve your styling loop...',
  },
  {
    id: 'bug',
    label: 'Report a Bug',
    icon: <Bug className="w-4 h-4 text-rose-400" />,
    badge: 'Bug Track',
    badgeColor: 'rose',
    placeholder: 'Describe what happened, steps to reproduce, your browser (Chrome/Edge/Brave), and any console errors...',
  },
  {
    id: 'feedback',
    label: 'Feedback & Thoughts',
    icon: <MessageSquare className="w-4 h-4 text-emerald-400" />,
    badge: 'Community',
    badgeColor: 'lime',
    placeholder: 'What do you love? What felt confusing? How can we make Visual Style Editor even better for you?',
  },
];

export default function ContactFormInteractive() {
  const [category, setCategory] = useState<CategoryType>('inquiry');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [browser, setBrowser] = useState('Chrome / Chromium');
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeCategory = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  const handleCategorySelect = (catId: CategoryType) => {
    setCategory(catId);
    toast.info(`Switched category: ${CATEGORIES.find((c) => c.id === catId)?.label}`);
  };

  const getMailtoUrl = () => {
    const categoryTag = `[${activeCategory.badge.toUpperCase()}]`;
    const fullSubject = encodeURIComponent(`${categoryTag} ${subject || 'New Contact Submission'}`);
    const bodyContent = encodeURIComponent(
      `From: ${name} (${email})\nCategory: ${activeCategory.label}\n${category === 'bug' ? `Browser: ${browser}\n` : ''}\nMessage:\n${message}\n\n---\nSent from Visual Style Editor Contact Hub`
    );
    return `mailto:support@visualstyleeditor.com?subject=${fullSubject}&body=${bodyContent}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please complete all required fields', {
        description: 'Name, email, and message are required so we can follow up.',
      });
      return;
    }

    setSubmitted(true);
    toast.success('Your message is ready to send!', {
      description: 'Click below to launch your default email client, or copy the formatted text.',
      duration: 5000,
    });

    // Attempt to trigger mailto client automatically
    try {
      window.location.href = getMailtoUrl();
    } catch (_) {}
  };

  const handleCopyFormatted = () => {
    const formatted = `To: support@visualstyleeditor.com\nSubject: [${activeCategory.badge.toUpperCase()}] ${subject}\nFrom: ${name} <${email}>\n\n${message}`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    toast.success('Copied formatted message to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full space-y-12">
      {/* Category Tabs */}
      <div className="space-y-3">
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Step 1: Select What You Want To Share
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const isSelected = cat.id === category;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-purple-100 border-purple-500 text-purple-950 font-bold dark:bg-purple-600/25 dark:text-purple-100 dark:border-purple-400 shadow-lg shadow-purple-500/10'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-950 hover:border-zinc-400 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/10">
                    {cat.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    {cat.badge}
                  </span>
                </div>
                <div className="text-sm font-bold leading-snug">
                  {cat.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form & Success Panel */}
      <div className="rounded-3xl border p-6 sm:p-10 shadow-2xl relative overflow-hidden" style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}>
        {/* Glow orb */}
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ background: '#a855f7' }}
        />

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 relative z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b flex-wrap gap-2" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                  <h3 className="text-lg sm:text-xl font-black text-ink-1">
                    Send {activeCategory.label}
                  </h3>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  Target: <strong className="text-purple-600 dark:text-purple-400">support@visualstyleeditor.com</strong>
                </span>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="contact-name" className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Chen"
                    className="w-full px-4 py-3 rounded-xl border text-sm font-sans focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--ink-1)' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-email" className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Your Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full px-4 py-3 rounded-xl border text-sm font-sans focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--ink-1)' }}
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label htmlFor="contact-subject" className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Subject / Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={
                    category === 'bug'
                      ? 'e.g., File System Access write fails on specific .html file'
                      : category === 'feature'
                      ? 'e.g., Add support for CSS grid fraction drag handles'
                      : 'e.g., Question regarding offline usage in enterprise team'
                  }
                  className="w-full px-4 py-3 rounded-xl border text-sm font-sans focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--ink-1)' }}
                />
              </div>

              {/* Conditional Field: Browser (if Bug Report) */}
              {category === 'bug' && (
                <div className="space-y-1.5">
                  <label htmlFor="contact-browser" className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Your Browser & OS Environment
                  </label>
                  <input
                    id="contact-browser"
                    type="text"
                    value={browser}
                    onChange={(e) => setBrowser(e.target.value)}
                    placeholder="e.g. Google Chrome 132 on macOS / Windows 11"
                    className="w-full px-4 py-3 rounded-xl border text-sm font-sans focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--ink-1)' }}
                  />
                </div>
              )}

              {/* Message Area */}
              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Details / Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={activeCategory.placeholder}
                  className="w-full px-4 py-3 rounded-xl border text-sm font-sans focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all leading-relaxed"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--ink-1)' }}
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  <span>Send {activeCategory.badge}</span>
                </button>

                <p className="text-xs text-zinc-500 font-mono text-center sm:text-right">
                  100% direct developer response within 24-48 business hours.
                </p>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 space-y-6 text-center max-w-xl mx-auto"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-ink-1">
                  Message Formatted & Ready!
                </h3>
                <p className="text-sm text-zinc-400">
                  Thank you, <strong className="text-ink-1">{name}</strong>! We've prepared your {activeCategory.label.toLowerCase()} for our engineering team.
                </p>
              </div>

              <div className="p-4 rounded-2xl border text-left font-mono text-xs space-y-2" style={{ background: 'var(--code-bg)', borderColor: 'var(--border)' }}>
                <div className="text-zinc-400 flex items-center justify-between">
                  <span>To: support@visualstyleeditor.com</span>
                  <span className="text-emerald-400 font-bold">READY</span>
                </div>
                <div className="text-ink-1 font-bold">
                  Subject: [{activeCategory.badge.toUpperCase()}] {subject}
                </div>
                <div className="text-zinc-300 whitespace-pre-wrap line-clamp-3">
                  {message}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={getMailtoUrl()}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Open in Mail App</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyFormatted}
                  className="px-6 py-3 rounded-xl border text-zinc-300 hover:text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Copied!' : 'Copy Formatted Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-3 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-all cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alternative Direct Channels Grid */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h4 className="text-base font-bold text-ink-1">
            Prefer Direct Public Channels?
          </h4>
          <p className="text-xs text-zinc-500">
            We are 100% open-source and active every single day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: GitHub Issues */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-2xl border transition-all hover:-translate-y-1 group flex flex-col justify-between"
            style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Bug className="w-5 h-5" />
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors" />
              </div>
              <h5 className="text-base font-bold text-ink-1">GitHub Issues</h5>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Found a rendering bug, parser mismatch, or broken button? Submit an issue on our GitHub tracker with sample markup.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400 pt-4 block">
              Open issue on GitHub &rarr;
            </span>
          </a>

          {/* Card 2: GitHub Discussions */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-2xl border transition-all hover:-translate-y-1 group flex flex-col justify-between"
            style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors" />
              </div>
              <h5 className="text-base font-bold text-ink-1">GitHub Discussions</h5>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Propose a new feature, talk about Tailwind v4 tokens, or showcase templates you built with the community.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-sky-400 pt-4 block">
              Join GitHub discussions &rarr;
            </span>
          </a>

          {/* Card 3: Direct Email */}
          <a
            href="mailto:support@visualstyleeditor.com"
            className="p-6 rounded-2xl border transition-all hover:-translate-y-1 group flex flex-col justify-between"
            style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors" />
              </div>
              <h5 className="text-base font-bold text-ink-1">Direct Developer Email</h5>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Direct channel to the maintainers at Amoga Media for partnerships, media inquiries, or confidential questions.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 pt-4 block">
              support@visualstyleeditor.com &rarr;
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
