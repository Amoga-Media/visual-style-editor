import { describe, it, expect, beforeEach } from "vitest";

describe("Universal Hyperlink System", () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument("test");
  });

  it("can convert a button or div into a hyperlink by wrapping with an anchor", () => {
    const div = doc.createElement("div");
    div.textContent = "Click Me";
    doc.body.appendChild(div);

    const anchor = doc.createElement("a");
    anchor.href = "https://example.com";
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    div.replaceWith(anchor);
    anchor.appendChild(div);

    expect(anchor.href).toBe("https://example.com/");
    expect(anchor.target).toBe("_blank");
    expect(anchor.firstElementChild).toBe(div);
  });

  it("unwraps an anchor tag cleanly without destroying inner contents", () => {
    const anchor = doc.createElement("a");
    anchor.href = "https://example.com";
    const span = doc.createElement("span");
    span.textContent = "Inner Content";
    anchor.appendChild(span);
    doc.body.appendChild(anchor);

    // Unwrap
    const parent = anchor.parentElement!;
    while (anchor.firstChild) {
      parent.insertBefore(anchor.firstChild, anchor);
    }
    anchor.remove();

    expect(doc.body.querySelector("a")).toBeNull();
    expect(doc.body.querySelector("span")?.textContent).toBe("Inner Content");
  });
});
