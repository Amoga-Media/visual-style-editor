# Visual Style Editor — Web App Flow

> **Architecture:** 100% In-Browser Client-Side Execution (Astro + React Island)  
> **Input:** Drag-and-drop any `.html` / `.htm` file, choose a sample template, or pick from disk  
> **Output:** Pure, surgical HTML with Tailwind utility classes or inline CSS

---

## 1. Primary User Journey

```mermaid
flowchart TD
    A[User visits webapp URL] --> B[Astro Landing Page with SEO & Hero]
    B --> C{Load Method}
    C -->|Drag & Drop| D[Drop HTML onto DropZone]
    C -->|Choose File| D2[Pick via File System Access API]
    C -->|Try Sample| D3[Load curated starter template]
    
    D & D2 & D3 --> E[In-Memory parse5 AST Analysis\n(Detects Tailwind v3/v4 theme & tokens)]
    E --> F[Preview loads in Sandboxed same-origin iframe]
    F --> G[Hover element -> Selection Box follows cursor]
    G --> H[Click element to select]
    H --> I[Property Panel populates:\nLayout / Typography / Border / Colors / Text]
    
    I --> J{Make visual adjustment}
    J -->|During Drag / Input| K[Instant live style preview in iframe]
    J -->|Release / Commit| L[forwardMap -> Tailwind Class / CSS Style]
    L --> M[Record in Zustand Change-Set & Undo Stack]
    
    M --> N{Action}
    N -->|Tweak more| G
    N -->|Undo / Redo| O[Cmd/Ctrl+Z -> Reconcile iframe DOM]
    N -->|Review Changes| P[Diff Modal showing Before / After]
    
    P --> Q{Save / Export}
    Q -->|Direct Save| R[FileSystemFileHandle write directly to disk (Chromium)]
    Q -->|Download Copy| S[Browser Blob Download (Safari/Firefox/Fallback)]
    Q -->|Discard| T[Revert iframe DOM to original session baseline]
```

---

## 2. Step-by-Step Flow Details

### Step 1: Zero-Friction Entry
* The user navigates to the web app URL. There is no account registration, login, or setup required.
* The landing page provides an immediate drop zone along with a set of pre-loaded sample templates (e.g. Modern Agency Hero, Pricing Card, SaaS Landing, Newsletter) for instant exploration.

### Step 2: In-Browser AST Analysis & Theme Detection
* The moment a file is dropped, the client-side AST engine parses the HTML string using `parse5`.
* It detects whether Tailwind CDN (v3 script or v4 `@tailwindcss/browser`) is loaded and scans for custom `@theme` blocks or `tailwind.config` declarations, extracting custom color tokens and font stacks into memory.

### Step 3: Sandboxed Live Preview & Selection
* The file's raw HTML is rendered into an iframe using an isolated document context.
* An external SVG/HTML selection overlay tracks cursor movements and clicks using `getBoundingClientRect()` without injecting foreign attributes into the user's HTML.

### Step 4: Visual Controls & Instant Feedback
* Sliders, color pickers, typography toggles, and spacing controls reflect the element's actual computed styles and existing Tailwind classes.
* Visual dragging updates `element.style` in real-time at 60fps for ultra-smooth responsiveness.
* On release, the value is committed through `forwardMap()`, generating standard Tailwind utility classes (e.g. `text-lg font-semibold tracking-tight text-indigo-600`) or standard CSS declarations.

### Step 5: Surgical AST Splicing (Zero Code Degradation)
* When the user clicks **Save**, `applyEditsClientSide()` computes the exact character offsets of modified attributes and splices only the changed tokens.
* All original indentation, HTML comments, head scripts, and external libraries (like GSAP or Lucide) remain 100% untouched.

### Step 6: Native Disk Persistence & Export
* On Chromium browsers (Chrome, Edge, Brave, Arc), the app utilizes the **File System Access API** to write changes directly back to the original file on the user's hard drive.
* On Firefox or Safari, it triggers an instant direct download of the updated `.html` file.
