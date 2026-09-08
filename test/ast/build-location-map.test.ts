import { describe, it, expect } from "vitest";
import { buildLocationMap } from "@/lib/ast/build-location-map";

describe("buildLocationMap", () => {
  const fixture = `<html><head></head><body><div id="cta" class="btn primary">Click</div><p style="color: red;">Text</p></body></html>`;

  it("builds structural locations for all elements", () => {
    const { locations } = buildLocationMap(fixture);
    expect(locations.length).toBeGreaterThan(0);

    const cta = locations.find((l) => l.structuralPath === "#cta");
    expect(cta).toBeDefined();
    expect(cta?.currentClassList).toEqual(["btn", "primary"]);
    expect(cta?.classAttrRange).toBeDefined();

    const p = locations.find((l) => l.tag === "p");
    expect(p).toBeDefined();
    expect(p?.styleAttrRange).toBeDefined();
  });
});
