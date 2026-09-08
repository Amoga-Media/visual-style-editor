import type { TailwindMode } from "@/types";

export function detectTailwindMode(html: string): TailwindMode {
  const isV4 = /<script[^>]+src=["'][^"']*@tailwindcss\/browser@4[^"']*["']/i.test(html);
  if (isV4) return "v4-cdn";

  const isV3 = /<script[^>]+src=["'][^"']*cdn\.tailwindcss\.com[^"']*["']/i.test(html);
  if (isV3) return "v3-cdn";

  return "none";
}
