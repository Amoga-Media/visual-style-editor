import { describe, it, expect } from "vitest";
import { isHtmlFile } from "@/lib/fs/is-html-file";

describe("isHtmlFile", () => {
  it("accepts a .html file by extension even with no MIME type", () => {
    const file = new File(["<html></html>"], "page.html", { type: "" });
    expect(isHtmlFile(file)).toBe(true);
  });

  it("accepts a .htm file by extension", () => {
    const file = new File(["<html></html>"], "legacy.HTM", { type: "" });
    expect(isHtmlFile(file)).toBe(true);
  });

  it("accepts a file with the text/html MIME type even with an unrecognized extension", () => {
    const file = new File(["<html></html>"], "index", { type: "text/html" });
    expect(isHtmlFile(file)).toBe(true);
  });

  it("rejects a file that is neither .html/.htm nor text/html", () => {
    const file = new File(["{}"], "data.json", { type: "application/json" });
    expect(isHtmlFile(file)).toBe(false);
  });

  it("rejects an image file dropped by mistake", () => {
    const file = new File([""], "photo.png", { type: "image/png" });
    expect(isHtmlFile(file)).toBe(false);
  });
});
