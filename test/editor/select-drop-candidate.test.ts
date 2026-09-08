import { describe, it, expect } from "vitest";
import { selectDropCandidate, type DropCandidate } from "@/lib/fs/select-drop-candidate";

type Handle = { marker: string };

function file(name: string, type = ""): File {
  return new File(["content"], name, { type });
}

function candidate(name: string, type = "", handle: Handle | null = null): DropCandidate<Handle> {
  return { file: file(name, type), handle };
}

describe("selectDropCandidate", () => {
  it("returns null for an empty drop", () => {
    expect(selectDropCandidate([])).toBeNull();
  });

  it("chooses the single dropped HTML file with no warning", () => {
    const result = selectDropCandidate([candidate("page.html")]);
    expect(result).toEqual({ kind: "chosen", candidate: expect.objectContaining({ file: expect.any(File) }), warning: undefined });
    expect(result?.kind === "chosen" && result.candidate.file.name).toBe("page.html");
  });

  it("BUG FIX: finds the HTML file even when a non-HTML file was listed first in the drop", () => {
    // Before the fix, the code only ever looked at whichever dropped file
    // came first in the browser's item list — dropping an image alongside
    // an HTML file (image first) would reject the whole drop and never
    // even consider the HTML file.
    const result = selectDropCandidate([candidate("photo.png", "image/png"), candidate("page.html")]);
    expect(result?.kind).toBe("chosen");
    expect(result?.kind === "chosen" && result.candidate.file.name).toBe("page.html");
  });

  it("finds the HTML file when it comes first and a non-HTML file comes after", () => {
    const result = selectDropCandidate([candidate("page.html"), candidate("notes.txt", "text/plain")]);
    expect(result?.kind).toBe("chosen");
    expect(result?.kind === "chosen" && result.candidate.file.name).toBe("page.html");
  });

  it("warns (but still succeeds) when more than one file was dropped", () => {
    const result = selectDropCandidate([candidate("photo.png", "image/png"), candidate("page.html")]);
    expect(result?.kind === "chosen" && result.warning).toBe('2 files were dropped — opened "page.html" and ignored the rest.');
  });

  it("does not warn when only one file was dropped", () => {
    const result = selectDropCandidate([candidate("page.html")]);
    expect(result?.kind === "chosen" && result.warning).toBeUndefined();
  });

  it("reports an error listing every dropped file when none of them are HTML", () => {
    const result = selectDropCandidate([candidate("photo.png", "image/png"), candidate("notes.txt", "text/plain")]);
    expect(result).toEqual({
      kind: "no-html",
      error: 'None of the dropped files ("photo.png", "notes.txt") look like an HTML file — drop a .html or .htm file.',
    });
  });

  it("reports a single-file error message when exactly one non-HTML file was dropped", () => {
    const result = selectDropCandidate([candidate("photo.png", "image/png")]);
    expect(result).toEqual({
      kind: "no-html",
      error: '"photo.png" doesn\'t look like an HTML file — drop a .html or .htm file.',
    });
  });
});
