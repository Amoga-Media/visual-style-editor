import { useState } from "react";
import { Palette, Wand2, Check, Copy } from "lucide-react";
import { generateHarmonizedPalette, type HarmonizedPalette } from "@/lib/color/palette-harmonizer";
import CollapsibleGroup from "./CollapsibleGroup";

interface PaletteHarmonizerGroupProps {
  onApplyColor?: (role: string, hex: string) => void;
  defaultOpen?: boolean;
}

export default function PaletteHarmonizerGroup({
  onApplyColor,
  defaultOpen = true,
}: PaletteHarmonizerGroupProps) {
  const [brandHex, setBrandHex] = useState("#0084FF");
  const [palette, setPalette] = useState<HarmonizedPalette>(() => generateHarmonizedPalette("#0084FF"));
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleGenerate = () => {
    const generated = generateHarmonizedPalette(brandHex);
    setPalette(generated);
  };

  const handleCopy = (color: string, label?: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  return (
    <CollapsibleGroup
      groupId="palette-harmonizer"
      title="Color Palette Harmonizer"
      icon={<Palette className="w-3.5 h-3.5 text-indigo-400" />}
      defaultOpen={defaultOpen}
    >
      <div className="space-y-3 p-1">
        {/* Brand Hex Input & Generator */}
        <div className="flex gap-2 items-center">
          <div className="relative">
            <input
              type="color"
              value={brandHex.startsWith("#") ? brandHex : "#0084FF"}
              onChange={(e) => setBrandHex(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-white/10 p-0.5 bg-transparent"
              title="Pick brand color"
            />
          </div>
          <input
            type="text"
            value={brandHex}
            onChange={(e) => setBrandHex(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            className="flex-1 text-xs bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-zinc-200 font-mono focus:outline-none focus:border-[#0084FF]"
            placeholder="#0084FF"
          />
          <button
            type="button"
            onClick={handleGenerate}
            className="px-3 py-1.5 rounded-lg bg-[#0084FF] hover:bg-[#0074E0] active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Wand2 className="w-3 h-3" />
            <span>Generate</span>
          </button>
        </div>

        {/* 4 Semantic Color Roles */}
        {palette && (
          <div className="space-y-2.5 pt-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Harmonized Roles
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["primary", "secondary", "accent", "neutral"] as const).map((role) => {
                const colorVal = palette[role];
                const isCopied = copiedColor === colorVal;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      if (onApplyColor) {
                        onApplyColor(role, colorVal);
                      }
                      handleCopy(colorVal, role);
                    }}
                    title={`${role}: ${colorVal} (Click to copy)`}
                    className="flex flex-col items-center gap-1.5 p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer text-left group"
                  >
                    <div
                      className="w-full h-7 rounded-md border border-black/10 dark:border-white/10 relative flex items-center justify-center shadow-2xs"
                      style={{ backgroundColor: colorVal }}
                    >
                      {isCopied && (
                        <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[2.5]" />
                      )}
                    </div>
                    <div className="w-full text-center">
                      <span className="text-[9px] font-mono capitalize block text-slate-600 dark:text-zinc-400 font-semibold truncate">
                        {role}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 dark:text-zinc-500 truncate block">
                        {colorVal}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 9-Shade Spectrum Strip */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                <span>100</span>
                <span className="text-[9px] text-slate-400 dark:text-zinc-500">Tonal Shades</span>
                <span>900</span>
              </div>
              <div className="flex gap-0.5 rounded-lg overflow-hidden h-7 border border-slate-200 dark:border-[#262626] p-0.5 bg-slate-100 dark:bg-[#181818]">
                {palette.shades.map((shade, i) => (
                  <button
                    key={i}
                    type="button"
                    style={{ backgroundColor: shade }}
                    title={`Shade ${(i + 1) * 100}: ${shade} (Click to copy)`}
                    onClick={() => handleCopy(shade)}
                    className="flex-1 rounded-[3px] hover:scale-y-125 transition-transform origin-center cursor-pointer relative group flex items-center justify-center"
                  >
                    {copiedColor === shade && (
                      <Check className="w-2.5 h-2.5 text-white drop-shadow stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 text-center italic pt-0.5">
                Click any role or shade swatch to copy hex code
              </p>
            </div>
          </div>
        )}
      </div>
    </CollapsibleGroup>
  );
}
