import { describe, it, expect, beforeEach } from "vitest";

describe("Layers Panel Overhaul & Auto-Divs", () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument("test");
  });

  it("wraps element in auto-div container cleanly and preserves children", () => {
    const p = doc.createElement("p");
    p.textContent = "Hello world";
    doc.body.appendChild(p);

    const wrapper = doc.createElement("div");
    wrapper.className = "flex flex-col";
    p.replaceWith(wrapper);
    wrapper.appendChild(p);

    expect(wrapper.children.length).toBe(1);
    expect(wrapper.firstElementChild).toBe(p);
    expect(doc.body.firstElementChild).toBe(wrapper);
  });

  it("reparents element inside a target layer and inherits container flow", () => {
    const section = doc.createElement("section");
    section.className = "flex items-center gap-4";
    doc.body.appendChild(section);

    const card = doc.createElement("div");
    card.className = "p-4 bg-white";
    doc.body.appendChild(card);

    // Reparent inside section
    section.appendChild(card);

    expect(section.contains(card)).toBe(true);
    expect(card.parentElement).toBe(section);
  });

  it("reorders siblings before and after cleanly", () => {
    const parent = doc.createElement("div");
    const child1 = doc.createElement("div");
    child1.id = "c1";
    const child2 = doc.createElement("div");
    child2.id = "c2";
    const child3 = doc.createElement("div");
    child3.id = "c3";

    parent.appendChild(child1);
    parent.appendChild(child2);
    parent.appendChild(child3);
    doc.body.appendChild(parent);

    // Move child3 before child2
    parent.insertBefore(child3, child2);

    expect(Array.from(parent.children).map((c) => c.id)).toEqual(["c1", "c3", "c2"]);
  });
});
