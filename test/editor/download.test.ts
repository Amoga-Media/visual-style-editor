import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadHtml } from "@/lib/fs/download";

// jsdom doesn't implement URL.createObjectURL/revokeObjectURL (they're
// genuinely absent, not just no-ops) — stubbed here the same way this
// project's other browser-API-adjacent tests stub what jsdom is missing
// (see HANDOFF-stage15.md's Task 6.4 note on jsdom polyfills needed for
// the GSAP check).
let createObjectURLSpy: ReturnType<typeof vi.fn>;
let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  createObjectURLSpy = vi.fn().mockReturnValue("blob:mock-url");
  revokeObjectURLSpy = vi.fn();
  // @ts-expect-error -- jsdom doesn't implement these; stubbing for the test
  window.URL.createObjectURL = createObjectURLSpy;
  // @ts-expect-error -- same
  window.URL.revokeObjectURL = revokeObjectURLSpy;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("downloadHtml", () => {
  it("creates a Blob URL, clicks a download anchor with the given filename, then revokes the URL", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadHtml("page.html", "<html>edited</html>");

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe("text/html");

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });

  it("doesn't leave the anchor element attached to the document afterward", () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const before = document.body.childElementCount;

    downloadHtml("page.html", "<html></html>");

    expect(document.body.childElementCount).toBe(before);
  });
});
