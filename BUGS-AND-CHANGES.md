# What changed, and what to watch out for

Plain-English summary. If you just want the short version: **you no
longer type or browse to a file path anywhere — you drag an HTML file
into the browser window (or click "Choose a file…") and start editing
immediately.** This version also fixes the bugs/gaps flagged after the
first pass — see section 2.

---

## 1. What was asked for, and what was actually blocking it

The app used to require a folder path **before you could even start the
server** — you had to launch it with something like:

```
npm run dev -- --root=/absolute/path/to/your/project
```

...or it would refuse to start at all. Then, inside the app, there was a
file-browser sidebar where you clicked through folders on that server to
find and open a file.

Both of those "give me a path" steps are gone now:

- **Starting the app no longer needs a path.** `npm run dev` just works —
  no `--root`, no `WORKSPACE_ROOT` environment variable.
- **Opening a file no longer needs a path.** The old folder-browser
  sidebar is gone. In its place, when no file is open, you get a big
  drop zone in the middle of the screen: drag an `.html`/`.htm` file onto
  it, or click "Choose a file…" to pick one the normal way.

## 2. Fixed in this pass

The first delivery worked, but testing it turned up one real bug and a
few rough edges. All of these are fixed now:

- **Bug: dropping more than one file could silently open the wrong
  one, or nothing at all.** The original code only ever looked at
  whichever dropped file happened to come first in the browser's list.
  So dragging an image and an HTML file in together — with the image
  landing first — would reject the whole drop and never even look at
  the HTML file. It now checks every dropped file for the first one
  that's actually HTML, regardless of order, and opens that one. Covered
  by a new test file (`select-drop-candidate.test.ts`) that specifically
  reproduces the old broken order and confirms it now works.
- **Rough edge: dropping multiple files gave no explanation of what
  happened.** Now, if you drop more than one file, the app tells you
  which one it opened and that the rest were ignored, instead of saying
  nothing.
- **Rough edge: the "no automatic backups anymore" gap had no
  mitigation.** There's now an in-app **version history** panel
  (the "History" button in the toolbar once a file is open). It keeps a
  snapshot of the file exactly as you opened it, plus one more snapshot
  right before every save overwrites the current version — each with a
  one-click "Download" so you can always get back an earlier version.
  This is **not** the same guarantee the old server-side `.history/`
  folder gave you: it lives only in that browser tab, for that session,
  and disappears if you close the tab or reload the page. It's a real
  safety net for "I saved something and want the previous version back
  right now," not a permanent backup system — for anything you actually
  care about long-term, keep using your own backups (git, Time Machine,
  etc.), same as before.
- **Rough edge: a failed in-place save looked identical to a successful
  one.** Save now explicitly checks (and if needed, asks the browser for)
  write permission *before* attempting to save, so it can tell you
  clearly which of these happened: "Saved to `file.html`", "downloaded a
  copy because this browser didn't allow saving directly to `file.html`",
  or "downloaded a copy because writing to `file.html` failed" — instead
  of just quietly downloading with no explanation either way.

**Not "fixed," because it isn't a bug in this app to begin with:**
Firefox and Safari genuinely don't implement the browser API that lets a
web page write straight back to a file on disk (only Chromium-based
browsers do, as of writing). There's no code fix for that — it's a
capability gap in those browsers. What *is* fixed: the drop screen now
tells you up front, before you even open a file, if your browser is one
of the ones that can't save in place — so it's not a surprise later.

## 3. How saving works now (please read this one)

**Before:** the app had its own copy of your file on its server (because
it needed a path to it), so every "Save" wrote straight back to that
file on disk, and it also kept a timestamped backup copy in a
`.history/` folder every single time, automatically.

**Now:** the app never has a server-side copy of your file — it only
ever sees whatever you dragged in, in memory, in your browser tab. So
"Save" works one of two ways, depending on your browser:

- **Chrome, Edge, Brave, and other Chromium-based browsers:** if you
  drag-and-dropped the file (or used "Choose a file…"), the app asks the
  browser for direct write permission to that exact file. When that's
  granted, Save overwrites your original file in place, same as before.
- **Firefox, Safari, or any time the direct-write isn't available or
  isn't granted:** Save instead **downloads a new copy** of the edited
  file through your browser's normal download mechanism. Your original
  file on disk is left untouched; the edited version lands in your
  Downloads folder (or wherever your browser saves downloads) under the
  same filename. The status message next to the toolbar's file name
  always tells you which of the two just happened.

**There is no more automatic *permanent* backup folder** — see the
in-app version history note in section 2 for the session-scoped
replacement, and keep your own backups for anything long-term.

**Also gone:** the "this file changed on disk elsewhere — reload it?"
banner. That only worked because the server was watching your project
folder for changes. There's no folder being watched anymore, so that
feature has been removed rather than left half-working.

## 4. What's new, file by file (if you want the detail)

**Client (the browser app):**
- `client/src/components/DropZone.tsx` — new. The drag-and-drop /
  click-to-choose screen shown when no file is open. Also shows a note
  up front if your browser can't save in place.
- `client/src/components/FileBrowser.tsx` — **deleted.** This was the
  old folder-browsing sidebar.
- `client/src/components/PreviewFrame.tsx` — changed to load the
  dropped file's content directly (`srcDoc`) instead of asking the
  server to serve a file at a path.
- `client/src/components/Toolbar.tsx` — now shows the loaded file's
  name, a "Drop a different file" button, and a "History" button,
  instead of a server path.
- `client/src/components/VersionHistory.tsx` — new. The in-session
  backup panel described in section 2.
- `client/src/App.tsx` — rewired around an in-memory "currently loaded
  file" instead of a path string; the external-change-detection
  websocket code was removed (see above); wires up version history and
  permission-aware save messaging.
- `client/src/lib/file-system-access.ts` — new. Small helpers around
  the browser's File System Access API: opening a handle from a drop or
  a file picker, checking/requesting write permission, writing back to
  a handle, and detecting up front whether the current browser supports
  any of this at all.
- `client/src/lib/download.ts` — new. The "give me a downloaded copy"
  fallback used everywhere the direct-write path isn't available.
- `client/src/lib/is-html-file.ts` — new. The "does this look like an
  HTML file?" check used to reject non-HTML drops with a friendly
  message instead of silently failing.
- `client/src/lib/select-drop-candidate.ts` — new. The "which of the
  dropped files should actually be opened" logic — this is where the
  multi-file bug fix from section 2 lives, pulled out on its own so it
  has direct test coverage.
- `client/src/lib/version-history.ts` — new. Small label/filename
  helpers for the version history panel.

**Server:**
- `server/src/cli.ts`, `server/src/watch.ts`, and the old
  `server/src/routes/browse.ts` / `file.ts` / `save.ts` / `preview.ts` —
  **all deleted.** Everything that required a workspace-root path (the
  CLI-argument parsing, the folder browser API, the "load file at path"
  API, the "save to path" API, the static file server, and the
  chokidar-based folder watcher) is gone, replaced by two much simpler
  routes below.
- `server/src/routes/analyze.ts` — new. Replaces the old "load file at
  path" endpoint. You send it the file's content directly; it sends
  back the Tailwind detection results, same as before, just without
  needing a path to read the content from.
- `server/src/routes/apply-edits.ts` — new. Replaces the old "save to
  path" endpoint. You send it the file's content plus the list of
  edits; it sends back the edited content. Saving that content to an
  actual file (in-place or as a download) is now the browser's job, not
  the server's — see section 3.
- `server/src/index.ts` — much shorter now: no path/config required to
  start, no websocket server, just the two routes above.
- Removed the now-unused `chokidar` and `ws` dependencies from
  `server/package.json` (they existed only for the folder watcher and
  its websocket push, both gone).

**Shared types** (`shared/src/types.ts`): `FileLoadResponse` became
`AnalyzeRequest`/`AnalyzeResponse` (no `path` field, since there's no
path). `SaveRequest` now carries `html` instead of `path`.
`SaveResponse`'s success case now returns the edited `html` instead of a
`backupPath`. `ServerPushMessage` (the websocket message type) was
removed along with the websocket feature.

## 5. Testing done

- All pre-existing tests that didn't touch the removed
  path/workspace-root code still pass unchanged.
- The old tests for the deleted routes (`browse`, `file`, `save`,
  `watch`, `cli`, `backup`) were removed along with the code they
  tested, and replaced with two new test files
  (`analyze-route.test.ts`, `apply-edits-route.test.ts`) covering the
  same scenarios — happy path, mixed class/style edits, brand-new
  attribute insertion, and all-or-nothing conflict handling — just
  against content instead of a path.
- New unit tests for the client-side logic: `is-html-file.test.ts`,
  `file-system-access.test.ts` (including the new permission/capability
  functions), `download.test.ts`, `select-drop-candidate.test.ts`
  (specifically reproduces the multi-file bug and confirms the fix),
  `version-history.test.ts`.
- Full suite: **shared 63/63, server 46/46, client 154/154 — 263/263
  total.**
- Ran a strict TypeScript check (`tsc --noEmit`) against both `server`
  and a scratch check of `client` (same approach the project's own
  Stage 15 notes describe using, since `client` still has no committed
  typecheck config — see "known gaps" below). No new type errors; the
  same two pre-existing `culori`-related warnings from before are still
  there, untouched.
- Started the actual server with zero configuration and hit
  `/api/health`, `/api/analyze`, and `/api/apply-edits` directly,
  including a deliberate conflict case (409 response). All behaved as
  expected.
- Ran the real `npm run dev` command end-to-end (both server and
  client) and confirmed the client's dev proxy reaches the new
  endpoints correctly.
- Production-built the client (`vite build`) to confirm nothing fails
  to bundle.
- **Not done:** an actual browser drag-and-drop click-through. This
  sandbox has no headless browser available (the project's own Stage 15
  QA notes flag the same limitation for GSAP verification), so the
  drag-and-drop interaction itself is covered by unit tests of its
  underlying logic (including the exact bug scenario from section 2)
  plus a full server round-trip test, not a literal "drag a file and
  watch it work" browser test.

## 6. Known limitations / things to keep in mind

- **Save-in-place only works in Chromium-based browsers** (Chrome,
  Edge, Brave, Arc, etc.). Firefox and Safari will always fall back to
  a downloaded copy — this is a browser capability gap, not a bug in
  this app (see section 2). The drop screen now says so up front on
  browsers where it applies.
- **Version history is session-only, not a permanent backup** — see
  section 2/3. Keep your own backups for anything you'd be upset to
  lose.
- The three pre-existing gaps already flagged in this project's own
  Stage 15 notes are all still true and untouched by this pass: no
  `client/tsconfig.json` or typecheck script committed, no
  React-Testing-Library/Playwright browser-level UI tests, and the
  `culori` package's missing type declarations. These predate the
  drag-and-drop rework and aren't something this pass touched.
