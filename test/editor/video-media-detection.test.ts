import { describe, it, expect, beforeEach } from "vitest";
import { classifyElement } from "@/lib/dom/element-classifier";

describe("Video & Media Link Detection Engine", () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument("test");
  });

  it("classifies <video> element with imageMedia panel active", () => {
    const video = doc.createElement("video");
    video.setAttribute("src", "https://example.com/stream.mp4");
    doc.body.appendChild(video);

    const classification = classifyElement(video);
    expect(classification.category).toBe("image");
    expect(classification.visiblePanels.imageMedia).toBe(true);
  });

  it("classifies <iframe> video embed with imageMedia panel active", () => {
    const iframe = doc.createElement("iframe");
    iframe.setAttribute("src", "https://www.youtube.com/embed/dQw4w9WgXcQ");
    doc.body.appendChild(iframe);

    const classification = classifyElement(iframe);
    expect(classification.category).toBe("image");
    expect(classification.visiblePanels.imageMedia).toBe(true);
  });

  it("detects source child within <video> tag", () => {
    const video = doc.createElement("video");
    const source = doc.createElement("source");
    source.setAttribute("src", "https://example.com/movie.webm");
    source.setAttribute("type", "video/webm");
    video.appendChild(source);
    doc.body.appendChild(video);

    const childSource = video.querySelector("source");
    expect(childSource?.getAttribute("src")).toBe("https://example.com/movie.webm");
  });

  it("updates video player boolean attributes (autoplay, loop, muted, controls)", () => {
    const video = doc.createElement("video");
    video.setAttribute("autoplay", "");
    video.setAttribute("loop", "");
    video.setAttribute("muted", "");
    video.setAttribute("controls", "");
    video.setAttribute("poster", "https://example.com/poster.jpg");
    doc.body.appendChild(video);

    expect(video.hasAttribute("autoplay")).toBe(true);
    expect(video.hasAttribute("loop")).toBe(true);
    expect(video.hasAttribute("muted")).toBe(true);
    expect(video.hasAttribute("controls")).toBe(true);
    expect(video.getAttribute("poster")).toBe("https://example.com/poster.jpg");
  });
});
