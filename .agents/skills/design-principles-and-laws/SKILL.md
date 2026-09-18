---
name: design-principles-and-laws
description: Comprehensive master reference and operational rules for cognitive UX laws, human-computer interaction (HCI) principles, visual perception psychology, spatial geometry mathematics, and interface craftsmanship. Covers Hick's Law, Fitts's Law, Jakob's Law, Miller's Law, Tesler's Law, Doherty Threshold, Von Restorff Effect, Peak-End Rule, Zeigarnik Effect, Norman's affordances and mappings, Gestalt psychology, concentric curvature mathematics, modular typography scales, 60-30-10 color theory, motion physics, and a 15-point audit checklist. Portable across any web or mobile project.
---

# Design Principles & Cognitive UX Laws: The Master Architectural Guide

This skill is the universal, portable design intelligence system for engineering interfaces that feel natural, intuitive, and visually elite. It bridges human cognitive psychology, physical interaction ergonomics, spatial geometry mathematics, and modern frontend craftsmanship.

Any AI agent, frontend engineer, or product designer can apply this skill across **any web application, mobile app, SaaS platform, or design system**.

---

## 1. The Core Directives of Elite Interface Design

1. **Cognitive Ease over Decorative Clutter:** Every pixel, border, and control must serve an intentional purpose. If an element does not inform, orient, or empower the user, eliminate it.
2. **Zero Mental Translation:** Controls must spatially mirror the physical or mental model of the object being manipulated (Direct Affordance & Natural Mapping).
3. **Graceful Complexity Transfer (Tesler's Law):** Never force the user to do the work that software can calculate or automate (e.g., auto-layout, automatic unit parsing, smart selection recovery).
4. **Immediate Continuous Feedback (Doherty Threshold):** Acknowledge every user interaction within 100ms and render continuous interactive states at 60fps.
5. **Physical Continuity & Harmony:** Nested geometry must honor concentric curvature mathematics ($R_{\text{inner}} = R_{\text{outer}} - \text{Padding}$), and spatial intervals must align with a strict 4px/8px modular grid.

---

## 2. Cognitive Psychology & Human-Interaction Laws

### A. Hick's Law (Decision Architecture)
> **Mathematical Formulation:**
> $$T = b \cdot \log_2(n + 1)$$
> *The time required to make a decision increases logarithmically with the number and complexity of choices ($n$).*

#### Operational Rules:
- **Zone Consolidation:** Divide top bars and master controls into a maximum of **3 distinct cognitive zones**:
  - **Zone 1 (Left):** Context & Hierarchy (Project name, page switcher, history undo/redo).
  - **Zone 2 (Center):** Primary Stage / Mode Controls (Canvas mode, viewport switcher, zoom level).
  - **Zone 3 (Right):** Utilities & Primary Conversion CTA (Theme, preferences, save, primary export button).
- **Progressive Disclosure:** Never expose 40 flat properties simultaneously. Group properties into collapsible categories (Typography, Layout, Spacing, Visuals) and default secondary or advanced options to closed.
- **Contextual Adaptation:** When an element is selected (e.g., an `<svg>` vs. an `<input>`), highlight and open only the relevant styling panels; collapse irrelevant ones.
- **Limit Choice Overload:** Keep dropdowns and segmented controls to $\le 5$ options. If more exist, provide instant fuzzy search or categorized nesting.

---

### B. Fitts's Law (Physical & Mouse Ergonomics)
> **Mathematical Formulation:**
> $$T = a + b \cdot \log_2\left(\frac{D}{W} + 1\right)$$
> *The time required to rapidly move to a target area is a function of the ratio between the distance to the target ($D$) and the width of the target ($W$).*

#### Operational Rules:
- **Floating Contextual Action HUDs:** Bring the most frequent actions (duplicate, delete, parent container, reorder, text edit) directly to the cursor/selection rather than forcing an 800–1400px round-trip mouse movement to sidebars.
- **Minimum Click & Touch Targets:**
  - Mouse/Desktop clickable targets: Minimum **$28\times 28\text{ px}$** (ideal: $32\times 32\text{ px}$).
  - Mobile/Touch targets: Minimum **$44\times 44\text{ pt}$** ($48\times 48\text{ px}$).
- **The Magic of Infinite Edges & Corners:** Screen corners and edges have infinite width ($W = \infty$) because the cursor stops at the display edge. Place top-level utilities, drawer toggles, and corner actions flush against screen boundaries.
- **Smart Placement Flipping:** If an element is near the viewport boundary (e.g., `< 40\text{ px}` from the top), flip floating overlays below the element to avoid clipping or occlusion.

---

### C. Jakob's Law (Familiarity & Conventions)
> *Users spend most of their time on other sites. They expect your tool to work the same way as all the other tools they already know.*

#### Operational Rules:
- **Standard 3-Pane Studio Layout:**
  - **Left Sidebar:** Navigator, page tree, layers, primitives, and blocks.
  - **Center Canvas:** The active preview artboard / working document.
  - **Right Sidebar:** Contextual property inspector and fine-grained style controls.
- **Concentric Box-Model Visualizer:** Users recognize the Margin (outer) $\rightarrow$ Border $\rightarrow$ Padding $\rightarrow$ Core (inner) concentric box diagram from Chrome DevTools, Figma, and Webflow. Never replace it with a flat list of 8 unlinked number inputs.
- **Universal Keyboard Shortcuts:**
  - `⌘/Ctrl + Z` $\rightarrow$ Undo
  - `⌘/Ctrl + Y` or `⌘/Ctrl + Shift + Z` $\rightarrow$ Redo
  - `⌘/Ctrl + D` $\rightarrow$ Duplicate
  - `⌘/Ctrl + G` $\rightarrow$ Group / Wrap in container
  - `Delete` / `Backspace` $\rightarrow$ Delete selected item
  - `Escape` $\rightarrow$ Select parent container / Deselect / Close modal
  - `Space + Drag` $\rightarrow$ Pan canvas

---

### D. Miller's Law & Cognitive Chunking
> *The average person can only keep $7 \pm 2$ items in their working memory.*

#### Operational Rules:
- **Chunking Information:** Chunk lists of choices into groups of 3 to 5 items using subtle hairline dividers or segmented cards.
- **Max 7 Visible Top-Level Tabs:** Never place more than 5–7 persistent tabs or toolbar buttons in one group.
- **Concise Ephemeral Status Toasts:** Status feedback messages should communicate exactly one thought clearly (e.g., `"Duplicated <button>"`) and dismiss automatically after 2000–2500ms.

---

### E. Tesler's Law (Conservation of Complexity)
> *Every system has an inherent amount of irreducible complexity. The only question is who handles it: the user or the software.*

#### Operational Rules:
- **Software Takes the Hit:** If an element needs to be wrapped in a layout container, provide a 1-click `"Wrap in Auto-Div"` rather than requiring the user to create a div, drag the element inside, and manually assign flex properties.
- **Forgiving Input Parsers (Postel's Law):** Automatically parse and accept user input whether they type `"24"`, `"24px"`, `"1.5rem"`, or `"auto"`. Never throw input validation errors for missing unit strings.
- **Cascade Inheritance Display:** Visually show when a property is inherited from a parent or breakpoint cascade so the user never wonders why a style is active.

---

### F. Doherty Threshold & Perceived Performance
> *Productivity soars when a computer and its users interact at a pace that ensures neither has to wait on the other ($< 400\text{ ms}$).*

#### Operational Rules:
- **Optimistic Visual Updates:** Live-apply styles and transformations immediately in the DOM/CSS variable engine while debouncing or backgrounding disk saves and AST serialization.
- **Skeleton Loaders over Spinners:** Use layout-matching skeleton pulses instead of generic loading spinners to maintain spatial continuity.
- **Instant Mode Switching:** Toggling between Edit and Preview modes must be instantaneous without page reloads.

---

### G. Von Restorff Effect (Isolation Principle)
> *When multiple similar objects are present, the one that differs from the rest is most likely to be remembered and clicked.*

#### Operational Rules:
- **Single Primary CTA per Screen:** Every screen or toolbar must have exactly **ONE** high-contrast, visually prominent action (e.g., a vibrant gradient `Export Studio` button).
- **Subordinate Secondary Tools:** Secondary buttons (Undo, Redo, Theme, Settings) must use ghost, subtle border, or muted background variants so they never compete for visual attention.
- **Destructive Isolation:** Danger actions (Delete element, Discard changes) must exclusively hold the destructive color token (e.g., crimson/rose hover) and never be paired ambiguously with primary actions.

---

### H. Norman's Principles of Interaction Design (Don Norman)

1. **Affordances (What it can do):** A button must look clickable (distinct surface, subtle shadow, or pill boundary). Draggable items must display grab cursors and tactile grip icons (`GripVertical`).
2. **Signifiers (Where to do it):** If inline text can be edited, provide a clear tooltip or badge (`Double-click to edit text` or `[T]` action icon).
3. **Natural Mapping:**
   - **3×3 Alignment Matrix:** Clicking top-right aligns both horizontal and vertical axes to top-right directly, eliminating separate dropdown mental translations.
   - Sliders must move left-to-right to increase magnitude.
   - Steppers must increase on `ArrowUp` and decrease on `ArrowDown`.
4. **Constraints & Error Prevention:**
   - Disable Undo when history is empty (`disabled` state).
   - Prevent deletion of critical root elements (`<html>`, `<body>`).
   - Automatically re-target selection to adjacent siblings when deleting an element so the user never lands in an unexpected dead state.
5. **Feedback:** Every tap, click, or drag must provide immediate visual confirmation (active depression, highlight ring, or badge increment).
6. **Feedforward:** Communicate what will happen before completion (e.g., highlighting insertion lines before dropping an element).
7. **Conceptual Models:** Maintain consistency between the user's mental model and the system state (e.g., tree view order matches visual stacking order).

---

### I. Peak-End Rule & Goal Gradient Effect
- **Peak-End Rule:** Users remember an experience based on its peak emotional moment and its ending. Make completion events (e.g., exporting code, publishing a site, successful build) celebratory, ultra-fast, and crisp.
- **Goal Gradient Effect:** Motivation increases as users get closer to completing a task. Use clear visual progress steppers (e.g., `"Step 2 of 3"`, `"85% completed"`) to accelerate task completion.
- **Zeigarnik Effect:** Unfinished tasks produce cognitive tension. Show subtle indicators for unsaved changes or unfinished wizard steps so users naturally resolve them before exiting.

---

### J. Serial Position Effect (Primacy & Recency)
- Users recall the **first** (Primacy) and **last** (Recency) items in any list, toolbar, or menu far better than the middle.
- **Placement Strategy:** Place the most essential context or navigation at the extreme left/top (first), and the ultimate primary action or conclusion at the extreme right/bottom (last). Keep ancillary utilities in the center.

---

### K. Postel's Law (The Robustness Principle)
> *"Be conservative in what you do, be liberal in what you accept from others."*
- When generating output (HTML, CSS, JSON), produce strictly compliant, pristine, and validated syntax.
- When accepting user input, accept typos, mixed units, uppercase strings, pasted code fragments, and automatically sanitize and normalize them.

---

## 3. Gestalt Principles of Visual Perception

| Principle | Meaning | Architectural Application |
| :--- | :--- | :--- |
| **Proximity** | Objects near each other are perceived as a group. | Keep labels directly attached to their inputs ($4\text{ px}$ gap). Space unrelated setting groups with $16\text{–}24\text{ px}$ margins. |
| **Similarity** | Elements sharing color, size, or shape share function. | All editable numeric inputs share identical monospace typography and unit badges. All interactive toggles use identical segmented styling. |
| **Common Region** | Items enclosed in a boundary are perceived as unified. | Use subtle cards with hairline borders (`border border-slate-200 dark:border-[#262626]`) and tinted backgrounds to containerize complex tool suites. |
| **Figure-Ground** | Brain separates focal objects from ambient backgrounds. | Overlays, modals, and floating HUDs must use frosted glassmorphism (`backdrop-blur-md bg-slate-900/90`) and deep elevation shadows to float above the canvas. |
| **Continuity** | Eyes follow continuous lines, curves, and alignments. | Strictly align input fields to a 4px/8px baseline grid. Never allow ragged left edges across related form controls. |
| **Closure** | The human mind completes incomplete shapes. | Use subtle dotted canvas grids (`canvas-dot-grid`) to communicate infinite spatial canvas without heavy obstructive grid lines. |
| **Focal Point** | The element with the highest visual contrast captures attention first. | Use vibrant accent colors sparingly (on selection rings, active handles, and primary CTA) so the eye immediately knows where to focus. |
| **Common Fate** | Elements that move together in the same direction are perceived as related. | When a parent container is dragged or animated, all nested children and selection badges move synchronously with zero lag. |

---

## 4. Visual Craftsmanship & Spatial Geometry Mathematics

### A. Concentric Curvature Mathematics (The Corner Radius Rule)
Never use the same corner radius for an outer container and its nested child. Identical radii create awkward, pinched corners that destroy visual harmony.

$$\mathbf{R_{\text{inner}} = \max\left(0, R_{\text{outer}} - \text{Padding}\right)}$$

```
+----------------------------------------------------+  <-- Outer Container (R_outer = 16px)
|  Padding = 6px                                     |
|  +----------------------------------------------+  |
|  |                                              |  |  <-- Inner Card (R_inner = 16px - 6px = 10px)
|  |  Content Area                                |  |
|  |                                              |  |
|  +----------------------------------------------+  |
+----------------------------------------------------+
```

#### Tailwind Implementation:
```html
<!-- Outer Shell -->
<div class="rounded-2xl p-1.5 bg-slate-900/40 border border-slate-700/50">
  <!-- Inner Core (rounded-xl = 12px, outer = 16px, padding = 6px => 16 - 6 = 10 ~ rounded-xl) -->
  <div class="rounded-xl p-4 bg-slate-800/90 shadow-inner">
    Content
  </div>
</div>
```

---

### B. The 4px / 8px Spatial Grid System
All spacing, padding, margins, heights, and widths must be multiples of 4px or 8px:
- **$2\text{ px}$ / $4\text{ px}$:** Micro gaps (between icon and label, pill badge inner padding).
- **$8\text{ px}$:** Compact component padding (buttons, input fields, item rows).
- **$12\text{ px}$ / $16\text{ px}$:** Standard card padding, modal content gap, section headers.
- **$24\text{ px}$ / $32\text{ px}$:** Major module separation, layout column gutters.
- **$48\text{ px}$ / $64\text{ px}$ / $96\text{ px}$:** Macro page section vertical padding.

---

### C. Optical Centering (Barycentric Adjustments)
Geometric centering is often **optically off-center**. 
- **Play Buttons / Triangles:** The centroid of a right-pointing equilateral triangle is at $\frac{1}{3}$ of its width. When centering a play icon inside a circle or square button, shift the icon **$+1\text{ px}$ to $+2\text{ px}$** to the right (`translate-x-0.5`).
- **Icons with Descenders / Caps:** Align icon bounding boxes with the cap-height of adjacent text, not the total line-height box.

---

### D. Typography Hierarchy Scale (Major Third — 1.250)
Use a harmonic modular type scale rather than arbitrary font sizes:

| Level | Size | Weight | Line Height | Letter Spacing (Tracking) | Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Micro** | $9\text{–}10\text{ px}$ | 600 SemiBold | $1.2$ | `+0.05em` (`tracking-wider`) | Badges, tags, HUD dimension labels |
| **Caption** | $11\text{ px}$ | 500 Medium | $1.3$ | `+0.02em` | Input field labels, secondary metadata |
| **Body** | $12\text{–}13\text{ px}$ | 400 Regular | $1.5$ | `normal` | UI panel text, descriptions, lists |
| **Subhead** | $14\text{–}16\text{ px}$ | 600 SemiBold | $1.4$ | `-0.01em` (`tracking-tight`) | Group headers, modal titles |
| **Title** | $20\text{–}24\text{ px}$ | 600 SemiBold | $1.25$ | `-0.02em` | Card titles, panel section headings |
| **Hero H1** | $32\text{–}48\text{ px}$ | 700 Bold | $1.15$ | `-0.03em` | Landing page titles, primary artboard headings |

---

### E. Color Distribution: The 60-30-10 Rule
- **60% Dominant Base:** Clean background surfaces (deep dark slate `#0f172a` / `#141414` or warm crisp white `#f8fafc`).
- **30% Secondary Structure:** Borders, cards, sidebars, headers, and neutral interactive states (slate-100/800, hairline rings).
- **10% Accent Energy:** Vibrant brand focus (primary buttons, active selection handles, bounding boxes, notification dots: e.g., `#0099ff` electric sky or `#6366f1` indigo).

### F. Dark Mode Surface Elevation (Lightness Stacking)
In dark mode, surfaces closer to the user must be **lighter in value**, not darker:
- **Level 0 (Canvas / Viewport Base):** `#090d16` or `#0a0a0a`
- **Level 1 (Sidebars / Top Toolbar):** `#0f172a` or `#141414`
- **Level 2 (Cards / Property Panels):** `#1e293b` or `#1f1f1f`
- **Level 3 (Dropdowns / Popovers / Floating HUDs):** `#334155` or `#2a2a2a` with `backdrop-blur-md`
- **Level 4 (Selection Rings / Highlights):** `#38bdf8` / `#6366f1` (High luminosity)

---

## 5. Motion Physics & Micro-Interaction Dynamics

### A. Easing Curves & Timing
- **Entrance Animations (Elements appearing):** Use deceleration curves. Fast start, gentle settle.
  - CSS: `cubic-bezier(0.16, 1, 0.3, 1)` or `ease-out`
  - Duration: $200\text{–}300\text{ ms}$
- **Exit Animations (Elements dismissing):** Use acceleration curves. Gentle start, rapid departure.
  - CSS: `cubic-bezier(0.4, 0, 1, 1)` or `ease-in`
  - Duration: $150\text{–}200\text{ ms}$
- **Micro-Toggles & Hover Feedback:**
  - CSS: `cubic-bezier(0.4, 0, 0.2, 1)` or `ease-in-out`
  - Duration: $100\text{–}150\text{ ms}$

### B. Hardware-Accelerated Transforms
- **Rule:** Never animate `width`, `height`, `top`, `left`, `margin`, or `padding` during live transitions or drags. These trigger expensive layout recalculations and repaint cascades.
- **Solution:** Exclusively animate `transform: translate3d(...)`, `transform: scale(...)`, and `opacity`. Use `will-change: transform` only during active interaction lifecycles.

---

## 6. How to Use & Port This Skill Across Any Project

### Cross-Project Installation:
To use this skill in any other project repository:
1. Copy the skill folder into the project's agent customization directory:
   ```bash
   # In any workspace:
   mkdir -p .agents/skills/design-principles-and-laws
   cp /path/to/design-principles-and-laws/SKILL.md .agents/skills/design-principles-and-laws/SKILL.md
   ```
2. Or in your global Antigravity/Gemini configuration directory (`skills/design-principles-and-laws/SKILL.md`) for universal access across all workspaces.

### When to Invoke This Skill:
- **During UI/UX Design & Brainstorming:** Structure layouts according to Hick's Law, Fitts's Law, and Jakob's Law.
- **During Component Creation:** Implement concentric corner radii, 4px grid spacing, and accessible hit targets.
- **During Code Reviews & Audits:** Run the 15-point checklist below to guarantee world-class usability before shipping.

---

## 7. The 15-Point Design Law Audit Checklist

Before considering any UI feature, component, or screen complete, audit against this checklist:

- [ ] **1. Hick's Law Check:** Is the master navigation/header consolidated into $\le 3$ primary zones? Are complex properties progressively disclosed in collapsible sections?
- [ ] **2. Fitts's Law Check:** Can frequent actions be executed directly near the selection or cursor via floating HUDs or immediate contextual controls?
- [ ] **3. Jakob's Law Check:** Does the application structure follow universally recognized paradigms (e.g., standard 3-pane studio layout, standard box model, familiar shortcuts)?
- [ ] **4. Touch & Click Hitboxes:** Are all desktop hitboxes $\ge 28\times 28\text{ px}$ and mobile touch targets $\ge 44\times 44\text{ pt}$?
- [ ] **5. Norman Mapping Check:** Do layout and alignment controls (e.g., flex/grid 3×3 matrix, direction arrows) spatially map to their physical effect without requiring mental translation?
- [ ] **6. Concentric Curvature Check:** Do all nested cards and wrappers satisfy $R_{\text{inner}} = \max(0, R_{\text{outer}} - \text{Padding})$ without awkward corner pinching?
- [ ] **7. Optical Centering Check:** Are asymmetric icons (such as play arrows) optically adjusted rather than mechanically centered?
- [ ] **8. Miller's Law / Chunking Check:** Are options and lists chunked into groups of 3 to 5 items with clear visual separation?
- [ ] **9. Isolation Principle (Von Restorff):** Is there exactly ONE dominant primary action on the screen? Are destructive actions isolated and visually distinct?
- [ ] **10. Tesler's Law Check:** Does the software absorb complexity (e.g., forgiving input parsers that accept any CSS unit, auto-wrapping containers, smart selection fallbacks)?
- [ ] **11. Doherty Threshold Check:** Do UI state changes, toggles, and feedback occur in $< 100\text{ ms}$ with zero perceptible lag?
- [ ] **12. Meaningful Empty States:** Does every unselected or empty view provide actionable guidance, document-level metadata, or helpful shortcuts instead of a dead screen?
- [ ] **13. Dark Mode Elevation Check:** Do elevated surfaces (cards, modals, popovers) get progressively lighter as they approach the user along the Z-axis?
- [ ] **14. Contrast & Readability Check:** Does all text meet WCAG AA ($4.5:1$ for body, $3:1$ for large text)?
- [ ] **15. Trapped State Check:** Can the user collapse, expand, escape, or undo any view or action via clear visible controls and standard keybindings (`Escape`, `⌘Z`)?
