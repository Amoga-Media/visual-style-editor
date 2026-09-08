import {
  Plus,
  LayoutTemplate,
  CreditCard,
  MessageSquareQuote,
  Mail,
  Sparkles,
  Tag,
  User,
  Columns2,
  Columns3,
  Split,
} from "lucide-react";

export interface ComponentBlock {
  id: string;
  title: string;
  category: "sections" | "cards" | "elements" | "layout";
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  snippet: string;
}

export const COMPONENT_BLOCKS: ComponentBlock[] = [
  {
    id: "hero-section",
    title: "Modern Hero Section",
    category: "sections",
    icon: LayoutTemplate,
    description: "Catchy heading, badge, subtitle, and dual CTA buttons",
    snippet: `<section class="py-16 px-6 text-center max-w-4xl mx-auto space-y-6">
  <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
    ✨ New Feature Release
  </div>
  <h1 class="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
    Transform your workflow with <span class="text-indigo-400">intelligent automation</span>
  </h1>
  <p class="text-base text-gray-400 max-w-2xl mx-auto">
    Streamline your projects effortlessly. Start visually tweaking designs and generating clean code in seconds.
  </p>
  <div class="flex flex-wrap justify-center gap-3 pt-2">
    <button class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/25">
      Get Started Now
    </button>
    <button class="px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 font-semibold transition-all">
      Explore Features
    </button>
  </div>
</section>`,
  },
  {
    id: "bento-card",
    title: "Feature Bento Card",
    category: "cards",
    icon: Sparkles,
    description: "Modern dark bento box card with glowing accent border",
    snippet: `<div class="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 hover:border-indigo-500/30 transition-all space-y-4 shadow-xl">
  <div class="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
    ⚡
  </div>
  <h3 class="text-lg font-bold text-white">Ultra-Fast Performance</h3>
  <p class="text-sm text-gray-400 leading-relaxed">
    Engineered with zero-server-cost AST parsing for 60fps real-time updates and instant responsive previews.
  </p>
</div>`,
  },
  {
    id: "pricing-card",
    title: "SaaS Pricing Tier",
    category: "cards",
    icon: CreditCard,
    description: "Highlighted pricing card with feature checks and CTA",
    snippet: `<div class="p-6 rounded-2xl bg-gray-900 border border-indigo-500/40 shadow-2xl space-y-6 max-w-sm">
  <div class="flex justify-between items-center">
    <span class="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Pro Edition</span>
    <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Popular</span>
  </div>
  <div>
    <span class="text-3xl font-extrabold text-white">$49</span>
    <span class="text-xs text-gray-400"> / month</span>
  </div>
  <ul class="space-y-2.5 text-xs text-gray-300">
    <li class="flex items-center gap-2">✓ Unlimited visual edits</li>
    <li class="flex items-center gap-2">✓ Direct File System sync</li>
    <li class="flex items-center gap-2">✓ Custom theme tokens</li>
  </ul>
  <button class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors">
    Upgrade to Pro
  </button>
</div>`,
  },
  {
    id: "testimonial-quote",
    title: "Testimonial Card",
    category: "cards",
    icon: MessageSquareQuote,
    description: "Customer quote card with avatar and rating stars",
    snippet: `<div class="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
  <div class="text-amber-400 text-sm">★★★★★</div>
  <p class="text-sm text-gray-300 italic">
    "This tool completely changed how our team tweaks frontend templates. No more waiting on code reviews for basic copy or margin changes!"
  </p>
  <div class="flex items-center gap-3 pt-2">
    <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
      JD
    </div>
    <div>
      <div class="text-xs font-bold text-white">Jane Doe</div>
      <div class="text-[10px] text-gray-500">Head of Design at Acme Inc</div>
    </div>
  </div>
</div>`,
  },
  {
    id: "newsletter-form",
    title: "Newsletter Signup",
    category: "sections",
    icon: Mail,
    description: "Compact email capture input with submit button",
    snippet: `<div class="p-6 rounded-2xl bg-gradient-to-r from-gray-900 to-indigo-950/40 border border-gray-800 text-center space-y-4 max-w-lg mx-auto">
  <h3 class="text-lg font-bold text-white">Stay in the loop</h3>
  <p class="text-xs text-gray-400">Get weekly curated templates and design tips directly to your inbox.</p>
  <form class="flex flex-col sm:flex-row gap-2 max-w-md mx-auto" onsubmit="return false;">
    <input type="email" placeholder="Enter your email" class="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
    <button type="submit" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shrink-0">
      Subscribe
    </button>
  </form>
</div>`,
  },
  {
    id: "gradient-button",
    title: "Gradient CTA Button",
    category: "elements",
    icon: Sparkles,
    description: "High-contrast glowing button",
    snippet: `<button class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-500/20">
  Get Started Free →
</button>`,
  },
  {
    id: "pill-badge",
    title: "Pill Tag / Badge",
    category: "elements",
    icon: Tag,
    description: "Subtle indicator badge",
    snippet: `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
  <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
  Live Preview
</span>`,
  },
  {
    id: "avatar-item",
    title: "User Avatar with Status",
    category: "elements",
    icon: User,
    description: "Avatar with active status dot",
    snippet: `<div class="relative inline-block">
  <img class="w-10 h-10 rounded-full border-2 border-gray-800 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop" alt="User avatar" />
  <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-gray-900"></span>
</div>`,
  },
  {
    id: "grid-2-col",
    title: "2-Column Grid Container",
    category: "layout",
    icon: Columns2,
    description: "Responsive 2-column flex/grid container",
    snippet: `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800 text-gray-200">
    <h4 class="font-bold mb-1 text-white">Left Column</h4>
    <p class="text-xs text-gray-400">Add any content or components here.</p>
  </div>
  <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800 text-gray-200">
    <h4 class="font-bold mb-1 text-white">Right Column</h4>
    <p class="text-xs text-gray-400">Add any content or components here.</p>
  </div>
</div>`,
  },
  {
    id: "grid-3-col",
    title: "3-Column Grid Container",
    category: "layout",
    icon: Columns3,
    description: "Responsive 3-column flex/grid container",
    snippet: `<div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
  <div class="p-4 rounded-xl bg-gray-900 border border-gray-800 text-gray-200">
    <div class="font-bold text-sm text-white">Card 1</div>
    <p class="text-xs text-gray-400 mt-1">First column description.</p>
  </div>
  <div class="p-4 rounded-xl bg-gray-900 border border-gray-800 text-gray-200">
    <div class="font-bold text-sm text-white">Card 2</div>
    <p class="text-xs text-gray-400 mt-1">Second column description.</p>
  </div>
  <div class="p-4 rounded-xl bg-gray-900 border border-gray-800 text-gray-200">
    <div class="font-bold text-sm text-white">Card 3</div>
    <p class="text-xs text-gray-400 mt-1">Third column description.</p>
  </div>
</div>`,
  },
  {
    id: "divider",
    title: "Section Divider",
    category: "layout",
    icon: Split,
    description: "Clean subtle horizontal line divider",
    snippet: `<hr class="border-t border-gray-800 my-8 max-w-5xl mx-auto" />`,
  },
];

interface ComponentBlocksProps {
  onInsertBlock: (snippet: string) => void;
}

export default function ComponentBlocks({ onInsertBlock }: ComponentBlocksProps) {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 select-none custom-scrollbar">
      <div className="text-[10px] text-zinc-400 px-1 font-medium">
        Drag any block into a container, or click + to insert.
      </div>

      <div className="space-y-2">
        {COMPONENT_BLOCKS.map((block) => {
          const Icon = block.icon;
          return (
            <div
              key={block.id}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData("application/x-visual-editor-snippet", block.snippet);
                e.dataTransfer.setData("text/plain", block.snippet);
                e.dataTransfer.effectAllowed = "copy";
                (window as any).__draggedComponentSnippet = block.snippet;
                (window as any).__draggedComponentName = block.title;
              }}
              onDragEnd={() => {
                (window as any).__draggedComponentSnippet = null;
                (window as any).__draggedComponentName = null;
              }}
              className="p-3 rounded-xl bg-[#141414] hover:bg-[#1a1a1a] border border-[#242424] hover:border-[#0099ff]/50 active:scale-[0.98] transition-all group cursor-grab active:cursor-grabbing flex items-center justify-between select-none"
              onClick={() => onInsertBlock(block.snippet)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#202020] flex items-center justify-center text-zinc-300 group-hover:text-[#0099ff] group-hover:bg-[#0099ff]/10 transition-colors shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                    {block.title}
                  </div>
                  <div className="text-[10px] text-zinc-500 leading-tight mt-0.5 line-clamp-1">
                    {block.description}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInsertBlock(block.snippet);
                }}
                className="w-6 h-6 rounded-lg bg-[#222] group-hover:bg-[#0099ff] flex items-center justify-center text-zinc-400 group-hover:text-white transition-all shadow-sm shrink-0 cursor-pointer ml-2"
                title="Insert into page"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
