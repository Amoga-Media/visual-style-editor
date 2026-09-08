import { describe, it, expect } from "vitest";
import { parseV3Theme } from "@/lib/tailwind/theme-v3";

describe("parseV3Theme", () => {
  it("extracts custom colors from tailwind.config", () => {
    const html = `
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                clifford: '#da373d',
              }
            }
          }
        }
      </script>
    `;
    const theme = parseV3Theme(html);
    expect(theme.colors).toEqual([{ name: "clifford", value: "#da373d" }]);
  });
});
