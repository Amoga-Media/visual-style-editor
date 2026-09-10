import { describe, it, expect, beforeEach } from "vitest";

describe("Framer-style Pinning & Constraints", () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument("test");
  });

  it("applies horizontal stretch constraints (left: 0, right: 0)", () => {
    const el = doc.createElement("div");
    el.style.position = "absolute";
    el.style.left = "0px";
    el.style.right = "0px";
    doc.body.appendChild(el);

    expect(el.style.position).toBe("absolute");
    expect(el.style.left).toBe("0px");
    expect(el.style.right).toBe("0px");
  });

  it("applies sticky top pinning constraint", () => {
    const el = doc.createElement("header");
    el.style.position = "sticky";
    el.style.top = "0px";
    el.style.zIndex = "50";
    doc.body.appendChild(el);

    expect(el.style.position).toBe("sticky");
    expect(el.style.top).toBe("0px");
    expect(el.style.zIndex).toBe("50");
  });

  it("applies top-right pin and resets opposing left offset", () => {
    const el = doc.createElement("div");
    el.style.position = "absolute";
    el.style.top = "0px";
    el.style.right = "0px";
    el.style.left = "auto";
    el.style.bottom = "auto";
    doc.body.appendChild(el);

    expect(el.style.top).toBe("0px");
    expect(el.style.right).toBe("0px");
    expect(el.style.left).toBe("auto");
  });

  it("applies center-middle pinning with translation", () => {
    const el = doc.createElement("div");
    el.style.position = "absolute";
    el.style.top = "50%";
    el.style.left = "50%";
    el.style.transform = "translate(-50%, -50%)";
    doc.body.appendChild(el);

    expect(el.style.top).toBe("50%");
    expect(el.style.left).toBe("50%");
    expect(el.style.transform).toBe("translate(-50%, -50%)");
  });

  it("applies full fill constraints (0px on all sides, 100% width and height)", () => {
    const el = doc.createElement("div");
    el.style.position = "absolute";
    el.style.top = "0px";
    el.style.right = "0px";
    el.style.bottom = "0px";
    el.style.left = "0px";
    el.style.width = "100%";
    el.style.height = "100%";
    doc.body.appendChild(el);

    expect(el.style.width).toBe("100%");
    expect(el.style.height).toBe("100%");
    expect(el.style.top).toBe("0px");
    expect(el.style.bottom).toBe("0px");
  });
});
