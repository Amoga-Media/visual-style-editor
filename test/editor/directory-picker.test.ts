import { describe, it, expect } from "vitest";
import { processDroppedFileList } from "@/lib/fs/directory-picker";

describe("directory-picker / processDroppedFileList", () => {
  it("processes a mix of multiple HTML files, tailwind.config.js, and style.css", async () => {
    const htmlFile1 = new File(["<h1>Index</h1>"], "index.html", { type: "text/html" });
    const htmlFile2 = new File(["<h1>About</h1>"], "about.html", { type: "text/html" });
    const tailwindConfigFile = new File(
      ["module.exports = { theme: { extend: { colors: { brand: '#ff0055' } } } };"],
      "tailwind.config.js",
      { type: "text/javascript" }
    );
    const cssFile = new File([":root { --brand-accent: #00ffcc; }"], "style.css", { type: "text/css" });

    const result = await processDroppedFileList([htmlFile1, htmlFile2, tailwindConfigFile, cssFile]);

    expect(result.htmlFiles).toHaveLength(2);
    expect(result.htmlFiles[0].name).toBe("index.html");
    expect(result.htmlFiles[1].name).toBe("about.html");

    expect(result.tailwindConfig?.fileName).toBe("tailwind.config.js");
    expect(result.tailwindConfig?.theme.colors).toContainEqual({ name: "brand", value: "#ff0055" });

    expect(result.customStyles?.fileName).toBe("style.css");
    expect(result.customStyles?.extractedTheme?.colors).toContainEqual({ name: "brand-accent", value: "#00ffcc" });
  });

  it("handles only tailwind.config and style.css gracefully without html files", async () => {
    const tailwindConfigFile = new File(
      ["export default { theme: { colors: { blueCustom: '#0066cc' } } };"],
      "tailwind.config.mjs",
      { type: "text/javascript" }
    );

    const result = await processDroppedFileList([tailwindConfigFile]);
    expect(result.htmlFiles).toHaveLength(0);
    expect(result.tailwindConfig?.theme.colors).toContainEqual({ name: "blueCustom", value: "#0066cc" });
  });
});
