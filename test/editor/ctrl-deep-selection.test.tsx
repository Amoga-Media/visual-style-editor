import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  isOverlayOrIgnored,
  resolveTargetElement,
  findDeepestChildAtPoint,
} from "@/components/editor/PreviewFrame";
import DevicePresetDropdown from "@/components/editor/DevicePresetDropdown";
import Toolbar from "@/components/editor/Toolbar";

describe("Ctrl+Click Deep Selection & Overlay Bypass", () => {
  it("identifies .noise-bg, preloaders, and full-screen empty fixed overlays as ignorable", () => {
    const doc = document.implementation.createHTMLDocument();

    const noiseDiv = doc.createElement("div");
    noiseDiv.className = "noise-bg";
    expect(isOverlayOrIgnored(noiseDiv, doc)).toBe(true);

    const grainDiv = doc.createElement("div");
    grainDiv.className = "grain-overlay";
    expect(isOverlayOrIgnored(grainDiv, doc)).toBe(true);

    const preloaderDiv = doc.createElement("div");
    preloaderDiv.id = "preloader";
    expect(isOverlayOrIgnored(preloaderDiv, doc)).toBe(true);

    const normalBtn = doc.createElement("button");
    normalBtn.textContent = "Submit";
    expect(isOverlayOrIgnored(normalBtn, doc)).toBe(false);

    const normalHeading = doc.createElement("h1");
    normalHeading.textContent = "Hello World";
    expect(isOverlayOrIgnored(normalHeading, doc)).toBe(false);
  });

  it("bypasses .noise-bg overlay and resolves the underlying interactive element on normal click", () => {
    const doc = document.implementation.createHTMLDocument();
    const noiseDiv = doc.createElement("div");
    noiseDiv.className = "noise-bg";
    doc.body.appendChild(noiseDiv);

    const button = doc.createElement("button");
    button.textContent = "Work With Me";
    button.className = "btn-fold";
    doc.body.appendChild(button);

    // Mock elementsFromPoint returning [noiseDiv, button, body, html]
    doc.elementsFromPoint = vi.fn().mockReturnValue([noiseDiv, button, doc.body, doc.documentElement]);

    // When clicking directly on the noiseDiv
    const resolved = resolveTargetElement(doc, 100, 200, noiseDiv, false);
    expect(resolved).toBe(button);
  });

  it("performs Figma-style deep selection when Ctrl is held (deepSelect = true)", () => {
    const doc = document.implementation.createHTMLDocument();

    const section = doc.createElement("section");
    const container = doc.createElement("div");
    container.className = "hero-title-anim";
    const h1 = doc.createElement("h1");
    const span1 = doc.createElement("span");
    span1.className = "title-word text-brand-dark";
    span1.textContent = "JAMES";
    const span2 = doc.createElement("span");
    span2.className = "title-word text-brand-orange";
    span2.textContent = "DAVID";

    h1.appendChild(span1);
    h1.appendChild(span2);
    container.appendChild(h1);
    section.appendChild(container);
    doc.body.appendChild(section);

    // Mock elementsFromPoint returning the stack under the mouse
    doc.elementsFromPoint = vi.fn().mockReturnValue([span1, h1, container, section, doc.body, doc.documentElement]);

    // With Ctrl held (deepSelect: true), it targets the deepest leaf span
    const deepTarget = resolveTargetElement(doc, 150, 80, section, true);
    expect(deepTarget).toBe(span1);
    expect(deepTarget?.textContent).toBe("JAMES");
  });

  it("finds deepest child within a container at coordinate points", () => {
    const parent = document.createElement("div");
    const child = document.createElement("div");
    const leafSpan = document.createElement("span");
    leafSpan.textContent = "Deep Leaf";

    child.appendChild(leafSpan);
    parent.appendChild(child);

    child.getBoundingClientRect = () => ({
      left: 10,
      right: 200,
      top: 10,
      bottom: 100,
      width: 190,
      height: 90,
      x: 10,
      y: 10,
      toJSON: () => {},
    });

    leafSpan.getBoundingClientRect = () => ({
      left: 20,
      right: 100,
      top: 20,
      bottom: 50,
      width: 80,
      height: 30,
      x: 20,
      y: 20,
      toJSON: () => {},
    });

    const found = findDeepestChildAtPoint(parent, 30, 30);
    expect(found).toBe(leafSpan);
  });
});

describe("Draggable and Hideable Dimensions Dropdown", () => {
  it("renders DevicePresetDropdown with drag handle and hide button", () => {
    const onSelectPreset = vi.fn();
    const onApplyCustomDimensions = vi.fn();
    const onHide = vi.fn();
    const onDragStart = vi.fn();
    const onResetPosition = vi.fn();

    const html = renderToString(
      <DevicePresetDropdown
        category="desktop"
        activePreset={null}
        customDimensions={null}
        onSelectPreset={onSelectPreset}
        onApplyCustomDimensions={onApplyCustomDimensions}
        onHide={onHide}
        onDragStart={onDragStart}
        onResetPosition={onResetPosition}
        isCustomPosition={true}
      />
    );

    // Verify presence of drag handle and buttons
    expect(html).toContain("Drag to reposition");
    expect(html).toContain("Hide Dimensions dropdown");
    expect(html).toContain("Reset position to top center");
  });

  it("renders Toolbar with Dimensions HUD toggle button", () => {
    const onViewportChange = vi.fn();
    const onChangeFile = vi.fn();
    const onToggleDimensionsHUD = vi.fn();

    const html = renderToString(
      <Toolbar
        fileName="index.html"
        viewport="desktop"
        onViewportChange={onViewportChange}
        onChangeFile={onChangeFile}
        statusMessage={null}
        historyCount={0}
        onToggleHistory={vi.fn()}
        onOpenReview={vi.fn()}
        iframeDocument={null}
        isDimensionsHUDHidden={false}
        onToggleDimensionsHUD={onToggleDimensionsHUD}
      />
    );

    expect(html).toContain("Hide Dimensions Dropdown");
  });

  it("renders Toolbar toggle button with Show tooltip when hidden", () => {
    const onViewportChange = vi.fn();
    const onChangeFile = vi.fn();
    const onToggleDimensionsHUD = vi.fn();

    const html = renderToString(
      <Toolbar
        fileName="index.html"
        viewport="desktop"
        onViewportChange={onViewportChange}
        onChangeFile={onChangeFile}
        statusMessage={null}
        historyCount={0}
        onToggleHistory={vi.fn()}
        onOpenReview={vi.fn()}
        iframeDocument={null}
        isDimensionsHUDHidden={true}
        onToggleDimensionsHUD={onToggleDimensionsHUD}
      />
    );

    expect(html).toContain("Show Dimensions Dropdown");
  });
});
