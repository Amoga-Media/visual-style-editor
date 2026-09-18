import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  getGpuHardwareInfo,
  getGpuLayerPromotionStyle,
  sampleImageColorsGpu,
} from "@/lib/gpu/gpu-engine";
import GpuStatusBadge from "@/components/editor/GpuStatusBadge";

describe("GPU Acceleration Engine", () => {
  it("detects GPU hardware info or provides graceful fallback", async () => {
    const info = await getGpuHardwareInfo();
    expect(info).toBeDefined();
    expect(typeof info.vendor).toBe("string");
    expect(typeof info.renderer).toBe("string");
    expect(["WebGPU", "WebGL2", "WebGL", "Software/None"]).toContain(info.api);
    expect(typeof info.maxTextureSize).toBe("number");
    expect(info.maxTextureSize).toBeGreaterThan(0);
    expect(["High", "Medium", "Low"]).toContain(info.memoryTier);
  });

  it("returns GPU hardware layer promotion styles", () => {
    const style = getGpuLayerPromotionStyle();
    expect(style.transform).toBe("translateZ(0)");
    expect(style.willChange).toBe("transform");
    expect(style.contain).toBe("layout paint");
    expect(style.backfaceVisibility).toBe("hidden");
  });

  it("extracts dominant color and palette from canvas using GPU sampler without error", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ff6600";
      ctx.fillRect(0, 0, 32, 32);
    }

    const result = sampleImageColorsGpu(canvas, 16);
    expect(result).toBeDefined();
    expect(typeof result.dominantColor).toBe("string");
    expect(result.dominantColor.startsWith("#")).toBe(true);
    expect(typeof result.isLight).toBe("boolean");
    expect(Array.isArray(result.palette)).toBe(true);
  });

  it("renders GpuStatusBadge component without crashing", () => {
    const html = renderToString(<GpuStatusBadge />);
    expect(html).toBeDefined();
    expect(typeof html).toBe("string");
  });
});
