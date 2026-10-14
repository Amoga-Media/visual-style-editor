# Visual Style Editor — Image Editing & ChatGPT Prompt Catalog

This catalog documents all screenshots captured directly from our live editor (`public/images/editor-snapshots/`), their role on the website, the interactive hover-zoom focus target, and the prompt for editing or generating enhanced variations in ChatGPT / Midjourney.

The accompanying CSV file is located at:
`public/images/image_edit_prompts.csv`

---

## Quick Reference Table

| Step / ID | Snapshot File | Web Page & Section | Feature Shown | Hover-Zoom Target |
| :--- | :--- | :--- | :--- | :--- |
| **01** | `01-editor-dropzone-open.png` | How It Works (Step 01) | Air-Gapped File DropZone | Center (50% 50%) — Drop Zone |
| **02** | `02-editor-ast-tree-inspector.png` | How It Works (Step 02) | Left Sidebar DOM / AST Tree | Top-Left (15% 35%) — AST Nodes |
| **03** | `03-editor-live-canvas-viewport.png` | How It Works (Step 03) | Live Canvas Viewport | Center (50% 50%) — Canvas Selection |
| **04** | `04-editor-boxmodel-padding-margin.png` | How It Works (Step 04) | **Box Model (Padding & Margin)** | **Top-Right (85% 25%) — Box Model** |
| **04 (Alt)** | `04-editor-boxmodel-close-up.png` | How It Works / Docs | Concentric Box Model Widget | Center (50% 50%) — Concentric Rings |
| **05** | `05-editor-ast-splice-diff.png` | How It Works (Step 05) | Surgical AST Splicer Diff | Center (50% 50%) — Review Diff Modal |
| **06** | `06-editor-disk-save-export.png` | How It Works (Step 06) | Direct Disk Save & Export | Center (50% 50%) — Export Studio |
| **07** | `07-editor-color-typography-lab.png` | Features Matrix | OKLCH Color & Typography | Center-Right (80% 40%) — Contrast / OKLCH |
| **08** | `08-editor-hero-workstation.png` | Home Page Hero / OG | Full Studio Workstation | Center (50% 50%) — Full Workspace |

---

## Detailed Image Profiles & ChatGPT Prompts

### Step 01: Air-Gapped Ingestion DropZone
- **File**: `public/images/editor-snapshots/01-editor-dropzone-open.png`
- **Location**: `/how-it-works` (Step 01: *Open a file or folder*)
- **Current Visual**: Real screenshot of editor in zero-file state with "Drop an HTML file here, or click to browse" and file system access indicator.
- **Hover-Zoom Interaction**: Centers directly onto the glowing dropzone dashed perimeter (`transform-origin: 50% 50%`).
- **ChatGPT Edit Prompt**:
  ```text
  A high-end modern dark-mode software interface mockup of Visual Style Editor's file ingestion screen. Center stage displays a sleek, rounded glassmorphism drop zone with a dashed border glowing softly in cyan/violet. The text reads 'Drop an HTML file here, or click to browse' with subtle folder icons and a glowing badge: '100% Client-Side Ingestion - 0 bytes sent to server'. Keep UI elements razor-sharp, dark obsidian background (#09090b), crisp typography (Inter/Geist), and cinematic ambient lighting accents.
  ```

---

### Step 02: Parse5 AST Coordinate Tree
- **File**: `public/images/editor-snapshots/02-editor-ast-tree-inspector.png`
- **Location**: `/how-it-works` (Step 02: *Parse into an AST with byte locations*)
- **Current Visual**: Real screenshot of editor with left sidebar showing nested DOM elements with Parse5 coordinate tracking.
- **Hover-Zoom Interaction**: Zooms smoothly into the top-left sidebar node badges (`transform-origin: 15% 35%`).
- **ChatGPT Edit Prompt**:
  ```text
  A sleek UI screenshot of Visual Style Editor focused on the left sidebar Layers and DOM tree panel. The panel displays nested HTML nodes (<html>, <body>, <header.sticky>, <button.btn-primary>) with glowing numeric byte offset badges (e.g. 'offset: 142-189', 'startOffset: 320'). An illuminated cyan laser guideline highlights the currently selected node. Ultra-sharp UI elements, clean dark theme aesthetics, typography in crisp monospace, subtle neon cyan accents, 4K resolution feel.
  ```

---

### Step 03: Live Studio Canvas Viewport
- **File**: `public/images/editor-snapshots/03-editor-live-canvas-viewport.png`
- **Location**: `/how-it-works` (Step 03: *Render in an isolated canvas*) & Landing Page
- **Current Visual**: Real screenshot of active canvas preview with bounding box around selected elements and dimensions HUD.
- **Hover-Zoom Interaction**: Focuses directly on the center canvas selection area (`transform-origin: 50% 50%`).
- **ChatGPT Edit Prompt**:
  ```text
  A luxury creative studio software workspace screenshot of Visual Style Editor. In the center canvas, a modern SaaS landing page template is rendered inside an isolated browser viewport with an electric blue/cyan bounding box outline around an active hero heading. A floating dimensions HUD capsule reads 'w: 840px | h: 120px' with magnetic snapping handles. Minimalist dark UI chrome, high-contrast typography, premium 2026 Awwwards-grade aesthetic.
  ```

---

### Step 04: Tactile Box Model & Padding / Margin Controls
- **File**: `public/images/editor-snapshots/04-editor-boxmodel-padding-margin.png`
- **Alternative Close-Up**: `public/images/editor-snapshots/04-editor-boxmodel-close-up.png`
- **Location**: `/how-it-works` (Step 04: *Adjust styles with precise controls*)
- **Current Visual**: Real screenshot of right inspector panel open to Spacing & Layout, featuring the **concentric Box Model diagram** (outer Margin Box with top/right/bottom/left inputs, and inner Padding Box with lock icons and tactile spring sliders).
- **Hover-Zoom Interaction**: Magnifies 1.35x directly into the **top-right Box Model diagram** (`transform-origin: 85% 25%`).
- **ChatGPT Edit Prompt**:
  ```text
  A high-fidelity close-up UI screenshot of Visual Style Editor's right inspector panel, specifically highlighting the Box Model and Spacing controls. Center of the inspector features a clean, concentric diagram: an outer amber/orange-tinted 'Margin' box (showing 24px top/bottom, 16px left/right) and an inner emerald-tinted 'Padding' box (showing 32px all sides). Surrounding the diagram are tactile tactile spring sliders, lock/unlock icons, and instantaneous Tailwind utility mappings (e.g. 'm-6 p-8'). Sharp, readable text, sleek dark theme (#141414), subtle neon glows on active input fields.
  ```

---

### Step 05: Character-Offset Surgical Splicer & Code Diff
- **File**: `public/images/editor-snapshots/05-editor-ast-splice-diff.png`
- **Location**: `/how-it-works` (Step 05: *Splice only the changed bytes*)
- **Current Visual**: Real screenshot with Review Changes / AST Splicer dialog open, showing exact before/after class diff with untouched neighboring code.
- **Hover-Zoom Interaction**: Focuses on the center diff comparison (`transform-origin: 50% 50%`).
- **ChatGPT Edit Prompt**:
  ```text
  A crisp dark-mode software modal dialog screenshot showing Visual Style Editor's 'Review & Splicing Diff' window. A side-by-side or unified code diff shows an HTML element's class attribute update: '- class="bg-blue-500 py-4"' in muted rose, replaced by '+ class="bg-indigo-600 p-8 rounded-2xl shadow-xl"' in glowing vibrant emerald. Surrounding comments and server template tags ({% if ... %}) are shown with an intact padlock icon: 'Zero Collateral Mutation - Character Offset Verified'. Dark UI, syntax highlighting, pristine developer aesthetic.
  ```

---

### Step 06: Native File System Direct Disk Commit & Export Studio
- **File**: `public/images/editor-snapshots/06-editor-disk-save-export.png`
- **Location**: `/how-it-works` (Step 06: *Write back to your file*)
- **Current Visual**: Real screenshot with Export Studio dialog open, displaying direct disk sync, Clean HTML, React JSX, and Astro export buttons.
- **Hover-Zoom Interaction**: Focuses on the central export and disk commit options (`transform-origin: 50% 50%`).
- **ChatGPT Edit Prompt**:
  ```text
  A modern software modal screenshot of Visual Style Editor's 'Export Studio & Disk Commit' dialog. Tabs at the top show 'Clean HTML5', 'React JSX', 'Astro Component', and 'Full Project Zip'. A prominent primary button with a hard drive icon reads 'Save Directly to Disk (<2ms File Handle Sync)' with an emerald status dot. Code preview pane below shows cleanly formatted Tailwind markup. Obsidian dark background, high contrast typography, glassmorphism cards.
  ```

---

### Step 07: Color Science & OKLCH Typography Lab
- **File**: `public/images/editor-snapshots/07-editor-color-typography-lab.png`
- **Location**: `/features` (Features Matrix)
- **Current Visual**: Real screenshot of right inspector panel showing OKLCH color gamut, harmonic palettes, and WCAG AAA score.
- **Hover-Zoom Interaction**: Focuses on the OKLCH chromatic arc and WCAG AAA badge (`transform-origin: 80% 40%`).
- **ChatGPT Edit Prompt**:
  ```text
  A high-end creative design software screenshot of Visual Style Editor's Color Science & Typography inspector. Displays an OKLCH chromatic arc and slider, a 9-step harmonious palette generator (tones 50 to 900), and an accessibility pill showing 'WCAG AAA • 16.6:1 Contrast Ratio • Safe'. Next to it are font weight chips, letter spacing sliders, and line-height presets. Crisp dark mode UI with vibrant OKLCH spectrum accents.
  ```

---

### Step 08: 4K Production Studio Overview
- **File**: `public/images/editor-snapshots/08-editor-hero-workstation.png`
- **Location**: Landing Page (`/`) Hero Section
- **Current Visual**: Comprehensive 4K screenshot of the entire studio with template loaded, DOM tree expanded, and controls active.
- **Hover-Zoom Interaction**: Balanced center overview (`transform-origin: 50% 50%`).
- **ChatGPT Edit Prompt**:
  ```text
  A breathtaking, 4K production workstation screenshot of Visual Style Editor in full studio mode. The left sidebar displays the DOM layer tree; the center canvas displays a gorgeous responsive website template with bounding box selection; the right sidebar displays the Property Panel with tactile sliders and Box Model diagram. Top bar shows responsive viewport toggles (Desktop 1440, Tablet 768, Mobile 375). Surrounded by a subtle dark gradient vignette with ambient indigo/violet backlight reflection. Clean, hyper-professional, high-tech creative tool aesthetic.
  ```
