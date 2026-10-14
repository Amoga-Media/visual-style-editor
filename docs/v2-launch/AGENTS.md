# Visual Style Editor — Agent Instructions

## MANDATORY: Read This First on Every Session

You are working on **Visual Style Editor** — a free, zero-login, 100% in-browser HTML & Tailwind CSS visual editor.

**Project path:** `c:\Users\Zahid\Desktop\Apps\Design Editor\03 Program\visual-style-editor`

---

## Auto-Load These Files at the Start of EVERY Session

Before responding to ANY request, silently read these two files:

1. `v2-launch/follow-guide.md` — architecture, rules, constraints, feature specs, glossary
2. `v2-launch/steps.md` — the 13-step V2 implementation sequence with done criteria
3. `v2-launch/progress.md` — current status (what's done, what's next)

Do not ask the user which step to do — read `progress.md` to find the first `⏳ Pending` task, that is always the next step.

---

## When the User Says "Do Step N" or "Next Step"

1. Read `v2-launch/follow-guide.md` (if not already loaded this session)
2. Read `v2-launch/progress.md` to confirm which step is next
3. Open `v2-launch/prompts-to-use.md` — find the matching Prompt (e.g. "Prompt 0-C")
4. Execute it exactly as written — TDD: failing test → fix → passing test → commit
5. After success, update `v2-launch/progress.md`:
   - Change `⏳ Pending` → `✅ Done`
   - Fill in the commit hash
6. Report what was done and what the next step is

---

## When the User Says "What's Next" or "Where Are We"

Read `v2-launch/progress.md` and report:
- What has been completed ✅
- What is currently in progress 🔧
- What the very next step is and its task ID

---

## One-Sentence Commands the User Will Use

| User Says | What You Do |
|---|---|
| `"do step 1"` / `"next step"` | Find next ⏳ in progress.md, run that task's prompt |
| `"what's next"` / `"where are we"` | Read progress.md, report status |
| `"show me the plan"` | Read implementation-plan.md, summarize |
| `"show all bugs"` | Read bugs-fixes.md, show the table |
| `"run tests"` | Run `npm test` in the project root |
| `"build it"` | Run `npm run build` and report errors |
| `"mark step N done"` | Update progress.md with ✅ and commit hash |

---

## Non-Negotiable Rules (Always Active)

- **TDD always** — write failing test → confirm failure → implement → confirm pass → commit
- **Run `npm test` before every commit** — zero failing tests permitted
- **No new npm packages** without user approval — use only what's in `package.json`
- **Dark mode tokens only** — `bg-[#090909]`, `border-[#262626]`, `text-zinc-200` etc.
- **Conventional commits** — `fix:`, `feat:`, `test:`, `docs:`
- **Never edit** `astro.config.mjs`, `vitest.config.ts`, `tsconfig.json`, `package.json` without explicit instruction
- **localStorage keys** must be prefixed `vse_`
- **Structural edits** (insert, delete, duplicate, move) always accumulate — never deduplicate

---

## Key Paths

| What | Path |
|---|---|
| Follow Guide | `v2-launch/follow-guide.md` |
| Steps | `v2-launch/steps.md` |
| Progress | `v2-launch/progress.md` |
| All Prompts | `v2-launch/prompts-to-use.md` |
| Tests | `v2-launch/test.md` |
| Bugs | `v2-launch/bugs-fixes.md` |
| Full Plan | `v2-launch/implementation-plan.md` |
| Source | `src/` |
| Test Files | `test/` |
