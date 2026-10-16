# Master Autonomous Testing Specification & Execution Blueprint
## Comprehensive Deep-Audit & Feature Verification for Visual Style Editor

> **Target Application**: Visual Style Editor (`/editor`)  
> **Source Directory**: `c:\Users\ZAHID-PC\Desktop\visual-style-editor\`  
> **Testing Scope**: 100% of all UI controls, live DOM mutations, AST round-tripping, canvas interactions, and export pipelines.

---

## 1. Skill Selection Matrix (from `SKILLS_DIRECTORY.md`)

To ensure this testing process operates at the highest industry standards, the following skills from [`.agents/skills/`](file:///.agents/skills/) are formally designated and bound to this testing operation:

| Selected Skill | Directory Path | Role in Testing & Verification |
| :--- | :--- | :--- |
| **`webapp-testing`** | [`.agents/skills/webapp-testing/SKILL.md`](file:///.agents/skills/webapp-testing/SKILL.md) | **Primary E2E Engine**: Headless/Headed Chromium via Playwright. Automates iframe pointer events, drag-and-drop, bounding box resize handles, focal-point pads, keyboard shortcuts, and DOM verification. |
| **`verification-before-completion`** | [`.agents/skills/verification-before-completion/SKILL.md`](file:///.agents/skills/verification-before-completion/SKILL.md) | **Strict Quality Gate**: Mandates that no test or feature is declared functional without reproducible evidence (Vitest 100-file suite exit code 0 + Playwright 0-error report). |
| **`systematic-debugging`** | [`.agents/skills/systematic-debugging/SKILL.md`](file:///.agents/skills/systematic-debugging/SKILL.md) | **Root-Cause Isolation**: When a slider, token, or export produces an unexpected CSS mutation, isolates whether the flaw is in the UI component, Zustand store, AST parser (`parse5`), or iframe postMessage bridge. |
| **`debugging-and-error-recovery`** | [`.agents/skills/debugging-and-error-recovery/SKILL.md`](file:///.agents/skills/debugging-and-error-recovery/SKILL.md) | **Fault Recovery**: Preserves test harness state, captures browser error logs and DOM dumps, and recovers without corrupting the user's workspace files. |
| **`tailwind-4-docs`** | [`.agents/skills/tailwind-4-docs/SKILL.md`](file:///.agents/skills/tailwind-4-docs/SKILL.md) | **CSS Architecture Validation**: Validates Tailwind v4 `@theme` directives, arbitrary value syntax (e.g. `bg-[#00f0ff]`), utility resolution, and CSS variable mapping. |
| **`tailwindcss-responsive-darkmode`** | [`.agents/skills/tailwindcss-responsive-darkmode/SKILL.md`](file:///.agents/skills/tailwindcss-responsive-darkmode/SKILL.md) | **Theme & Dark Mode Verification**: Verifies dual-theme contrast, `html.dark` class toggling, and dark-mode style isolation in both editor shell and preview canvas. |
| **`tailwindcss-mobile-first`** | [`.agents/skills/tailwindcss-mobile-first/SKILL.md`](file:///.agents/skills/tailwindcss-mobile-first/SKILL.md) | **Responsive Cascade**: Checks breakpoint rules (`sm:`, `md:`, `lg:`), ensuring mobile styles apply by default and desktop overrides cascade without overwriting base properties. |
| **`impeccable`** | [`.agents/skills/impeccable/SKILL.md`](file:///.agents/skills/impeccable/SKILL.md) | **UI Polish & Ergonomics**: Evaluates property panel spacing, focus rings, tooltip feedback, active button highlighting, and accessibility. |
| **`gsap-performance`** | [`.agents/skills/gsap-performance/SKILL.md`](file:///.agents/skills/gsap-performance/SKILL.md) | **Canvas & Motion Profiling**: Tests 60fps smoothness during pan/zoom, element dragging, and resize handle manipulation without layout thrashing. |
| **`ponytail-review`** | [`.agents/skills/ponytail-review/SKILL.md`](file:///.agents/skills/ponytail-review/SKILL.md) | **Code Simplicity**: Audits test scripts and potential bug fixes for minimal footprint and anti-overengineering. |

---

## 2. The Master Autonomous Testing Prompt

```markdown
You are Antigravity acting as the Principal QA & Systems Verification Engineer. Your objective is to conduct the most exhaustive, microscopic, and rigorous end-to-end verification of the Visual Style Editor ever performed.

Every single feature, control, slider, dropdown, modal, export option, and canvas interaction must be verified against the live DOM and AST parser. Nothing is assumed to work without explicit automated test verification.

### Operating Environment & Context
- **Workspace**: `c:\Users\ZAHID-PC\Desktop\visual-style-editor\`
- **Local Dev Server**: `http://localhost:4321/editor`
- **Skills Activated**: `webapp-testing`, `verification-before-completion`, `systematic-debugging`, `tailwind-4-docs`, `tailwindcss-responsive-darkmode`, `tailwindcss-mobile-first`, `gsap-performance`.

---

### Exhaustive 14-Tier Testing Execution Matrix

#### TIER 1: Colors & Color Picker Studio (`ColorGroup.tsx`, `ColorPicker.tsx`, `PaletteHarmonizerGroup.tsx`)
1. **Text Color**:
   - Change text color using preset Tailwind color swatch (e.g. `red-500` / `#ef4444`). Verify live text element in iframe receives the color.
   - Enter raw custom hex (`#3b82f6`) and rgba (`rgba(59, 130, 246, 0.7)`). Verify alpha transparency channel works.
2. **Background Color & Gradients**:
   - Apply solid background color.
   - Apply gradient preset (linear-to-r, direction selector, gradient stops). Verify `background-image` or Tailwind gradient classes in live DOM.
3. **Palette Harmonizer & Eyedropper**:
   - Verify Palette Harmonizer extracts dominant colors from the page/image.
   - Click harmonized swatches to verify instant style application.
   - Verify Eyedropper API fallback when unsupported in headless environment.

#### TIER 2: Typography & Font Studio (`TypographyGroup.tsx`, `fonts/`)
1. **Font Family**:
   - Select system font stack (`sans`, `serif`, `mono`). Verify live font change.
   - Select Google Font (e.g. `Inter`, `Playfair Display`, `Outfit`). Verify external stylesheet injection in iframe `<head>`.
2. **Font Size, Weight & Line Height**:
   - Step through presets: `text-xs` (12px), `text-base` (16px), `text-4xl` (36px).
   - Enter custom decimal values with units (`1.125rem`, `22px`).
   - Change font weight from Thin (100) to Black (900).
   - Adjust Line Height (relative multiplier and fixed px).
   - Adjust Letter Spacing (`tracking-tighter`, `tracking-wide`, custom em/px).
3. **Alignment, Decoration & Transforms**:
   - Test text-align: Left, Center, Right, Justify.
   - Test text-decoration: None, Underline, Line-through.
   - Test text-transform: Uppercase, Lowercase, Capitalize, Normal.
   - Test white-space: Normal, Nowrap, Pre-wrap.

#### TIER 3: Opacity, Filters & Advanced CSS (`EffectsGroup.tsx`, `AdvancedCssGroup.tsx`)
1. **Opacity**:
   - Adjust opacity slider from 100% down to 25%, 10%, 0%.
   - Enter direct decimal percentage (e.g. `45.5%`). Verify `opacity: 0.455` or `opacity-45` in live DOM.
2. **Backdrop Blur & Filters**:
   - Apply Backdrop Blur (`backdrop-blur-sm`, `backdrop-blur-md`).
   - In Advanced CSS, test CSS Filters:
     - Blur: Slider + direct decimal input (`0.5px`, `4px`). Verify `filter: blur(...)`.
     - Contrast: Slider + decimal (`125.5%`). Verify `filter: contrast(...)`.
     - Brightness, Grayscale, Invert, Sepia, Hue-Rotate.
   - Test Mix Blend Modes (`multiply`, `screen`, `overlay`).
3. **Rotation & Transforms**:
   - Rotate element using dial/input (e.g. `12.5deg`, `-45deg`).
   - Scale element X/Y.

#### TIER 4: Image Studio & 2D Focal-Point Crop Pad (`ImageGroup.tsx`)
1. **Source & Alt Attributes**:
   - Edit Image URL (`src`). Verify live update in iframe without broken reload.
   - Edit Alt Text. Verify attribute mutation on `<img>` element.
2. **Object Fit & Aspect Ratio**:
   - Test object-fit: `contain`, `cover`, `fill`, `none`, `scale-down`.
   - Test aspect-ratio presets: `1:1`, `16:9`, `4:3`, `video`, `square`.
3. **2D Focal-Point Pan Pad**:
   - Click preset quadrants: Top (`50% 0%`), Center (`50% 50%`), Bottom (`50% 100%`), Left (`0% 50%`), Right (`100% 50%`).
   - Verify that clicking any focal position automatically activates `object-fit: cover`.
   - Perform interactive drag on the 2D Pan Pad. Verify continuous updates to `object-position`.
   - Enter direct decimal values for Pan X (`12.5%`) and Pan Y (`0.5%`).

#### TIER 5: Element Resize & Box Model Studio (`BoxModelVisualizer.tsx`, `SelectionOverlay.tsx`)
1. **8-Point Canvas Resize Handles**:
   - Select element. Verify bounding box and 8 resize handles (N, S, E, W, NE, NW, SE, SW).
   - Drag East handle (+50px width). Verify live width expansion and pixel readout pill.
   - Drag South handle (+40px height). Verify live height expansion.
   - Verify min-width / max-width boundary clamping.
2. **Interactive 4-Sided Box Model Visualizer**:
   - Adjust Padding: Top, Right, Bottom, Left independently.
   - Toggle "Link All Sides" and adjust all 4 paddings simultaneously.
   - Adjust Margin: Positive margins and negative margins (e.g. `-10px`).
   - Test Auto Margin centering (`mx-auto`).

#### TIER 6: Layout, Display Modes, Flexbox & Grid (`LayoutGroup.tsx`, `FlexGridGroup.tsx`)
1. **Display Modes**:
   - Toggle through: `Block`, `Inline-Block`, `Flex`, `Inline-Flex`, `Grid`, `None`.
   - Verify immediate DOM class/style mutation and Property Panel button active state syncing.
2. **Flexbox Engine**:
   - Direction: Row, Row-reverse, Column, Column-reverse.
   - Wrap: Nowrap, Wrap, Wrap-reverse.
   - Justify Content: Start, Center, End, Space-Between, Space-Around, Space-Evenly.
   - Align Items: Start, Center, End, Baseline, Stretch.
   - Align Self override on child elements.
   - Flex Child controls: Flex Grow, Flex Shrink, Flex Basis (`auto`, `0`, `custom`).
3. **Grid Engine**:
   - Grid Template Columns: Preset columns (1, 2, 3, 4, 6, 12) and custom repeat (`repeat(3, minmax(0, 1fr))`).
   - Gap Controls: Unified Gap, Row Gap, Column Gap with direct pixel/rem inputs.
   - Grid Auto Flow: Row, Col, Dense.

#### TIER 7: Border & Radius Studio (`BorderGroup.tsx`)
1. **Border Width, Style & Color**:
   - Set border width uniformly (1px, 2px, 4px, 8px).
   - Set border width on individual sides (e.g. `border-b-2` only).
   - Test border styles: `solid`, `dashed`, `dotted`, `double`, `none`.
   - Change border color and verify high contrast.
2. **Border Radius (Uniform & 4 Independent Corners)**:
   - Uniform slider: `rounded-none`, `rounded-md`, `rounded-xl`, `rounded-full`.
   - Expand 4-corner mode: Set Top-Left (16px), Top-Right (0px), Bottom-Right (16px), Bottom-Left (0px). Verify asymmetric rounding on live element.

#### TIER 8: Shadow & Glow Customization Studio (`ShadowPresetsGroup.tsx`)
1. **Shadow Presets**:
   - Test presets: `None`, `Subtle`, `Medium`, `Large`, `2XL`, `Neon Cyan Glow`, `Neon Amber Glow`.
2. **Custom Shadow Parameters**:
   - Adjust X Offset, Y Offset, Blur Radius, and Spread.
   - Test direct decimal input on Blur (e.g. `15.5px`).
   - Test Inset Toggle button: verify `inset` is injected into `box-shadow` CSS without breaking existing offsets.
   - Test "Clear Shadow" button: resets `box-shadow` to `none`.

#### TIER 9: Canvas Drag-and-Drop Sibling & Parent Reordering (`SelectionOverlay.tsx`, `DropZone.tsx`)
1. **Floating Action HUD**:
   - Verify HUD appears with Tag pill, Breadcrumbs, and Reorder handle.
   - Click "Move Down": verify target element moves after its sibling in live DOM.
   - Click "Move Up": verify target element moves before sibling.
2. **Canvas Drag-to-Reorder**:
   - Drag grip handle or element over valid sibling drop zone.
   - Verify visual insertion guide line displays at drop coordinates.
   - Release mouse: verify DOM node moves cleanly without losing applied classes/styles.

#### TIER 10: Inline Text Editing & Component Insertion (`InlineTextEditor.tsx`, `InsertPanel.tsx`)
1. **Inline Double-Click Text Editing**:
   - Double-click text heading or paragraph directly on canvas.
   - Type modified string (e.g. "Senior Cloud Architect").
   - Press Enter or blur: verify text content updates in live iframe and AST.
   - Press Escape: verify text edit cancels cleanly without mutating DOM.
2. **Component Insertion**:
   - Open Insert Panel.
   - Insert basic element (Button, Heading, Card, Container) into canvas.
   - Verify newly inserted element receives valid structural path and unique ID.

#### TIER 11: Multi-Viewport Cascade & Responsive Breakpoints (`Toolbar.tsx`, `DevicePresetDropdown.tsx`)
1. **Device Presets**:
   - Switch between Desktop (1440px), Tablet (768px), and Mobile (375px).
   - Verify preview iframe smoothly resizes to target dimensions.
2. **Responsive Overrides**:
   - In Tablet mode, change text size to `text-2xl` (`md:text-2xl`).
   - In Mobile mode, change text size to `text-lg` (`sm:text-lg`).
   - Switch back to Desktop: verify Desktop retains original `text-4xl`.
   - Verify AST output preserves responsive prefix hierarchy.

#### TIER 12: Undo/Redo Time-Travel & Change-Set Tracking (`undo-store.ts`, `change-set-store.ts`)
1. **Multi-Step Undo / Redo**:
   - Perform a sequence of 5 disparate actions: (1) change color, (2) change font size, (3) move element down, (4) change border, (5) edit text.
   - Press Ctrl+Z (or click Toolbar Undo) 5 consecutive times.
   - Verify live iframe DOM faithfully reverts each individual step in reverse order.
   - Press Ctrl+Y (Redo) 5 times: verify all 5 edits re-apply faithfully.
2. **Change Review Modal**:
   - Open Review Modal (`ReviewModal.tsx`).
   - Verify visual diff shows exact old vs new classes/styles/text.
   - Verify granular discard of individual changes.

#### TIER 13: Export Studio, Import & AST Fidelity (`ExportStudioModal.tsx`, `src/lib/ast/`)
1. **Clean Document Serialization**:
   - Open Export Studio.
   - Verify Clean HTML Export:
     - Contains valid `<!DOCTYPE html>`.
     - Retains `<head>` scripts, Tailwind CDN tags, and Google Font links.
     - Prunes all editor-internal attributes (`data-ve-*`, `ve-hover`, selection outlines).
2. **Multi-Format Generation**:
   - Verify React (TSX) export: proper `className=` conversions, self-closing tags, valid React FC structure.
   - Verify Astro export: proper frontmatter fences (`---`), valid Astro syntax.
3. **Workspace Import & File Persistence**:
   - Load real-world complex landing pages (from `files for testing/` and `Full Website Tests/`).
   - Verify full document tree mounts in Layers Panel without parser crash.

#### TIER 14: Dark/Light Mode Theme Contrast & System Health
1. **Dual Theme Switching**:
   - Toggle Light Mode: verify shell background, borders, and input text are clearly readable with WCAG AA compliance.
   - Toggle Dark Mode: verify deep obsidian styling, zero washed-out borders, and crisp focus rings.
2. **Console & Session Health**:
   - 0 unhandled exceptions (`window.onerror` / `pageerror`).
   - 0 fatal console errors (`TypeError`, `Cannot read properties of undefined`).
   - 0 memory leaks or lingering event listeners after rapid canvas interactions.
```

---

## 3. Automated Verification Execution Script

To execute this entire suite autonomously with concrete, pass/fail assertions, execute:

```bash
node scripts/test-super-rigorous-suite.cjs
```

The script systematically runs all 14 tiers against the live local application, captures DOM snapshots, asserts computed CSS properties, exercises time-travel undo, tests responsive cascades, and generates a structured audit report.
