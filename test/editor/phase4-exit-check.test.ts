import { describe, it, expect, beforeEach } from "vitest";
import type { ThemeMap } from "@/types";
import { handleSliderCommit } from "@/components/editor/property-panel/LayoutGroup";
import { useSettingsStore } from "@/store/settings-store";
import { useChangeSetStore } from "@/store/change-set-store";
import { friendlyLabel, revertAllEdits } from "@/components/editor/ReviewModal";

const emptyTheme: ThemeMap = { mode: "v3-cdn", colors: [], fonts: [] };

beforeEach(() => {
  useSettingsStore.setState({ snapToDefaultScale: false });
  useChangeSetStore.setState({ edits: [] });
});

describe("Phase 4 exit check (implementation-plan.md, end of Task 4.2 / PRD §6 core story)", () => {
  // "resize a heading's font-size, round a card's corners, add a border,
  // open Review, confirm it shows exactly three before/after lines."
  it("three edits across two elements land as exactly three change-set entries", () => {
    document.body.innerHTML = `
      <h1 id="heading" class="text-lg"></h1>
      <div id="card" class="w-64"></div>
    `;
    const heading = document.getElementById("heading") as HTMLElement;
    const card = document.getElementById("card") as HTMLElement;

    const recordEdit = useChangeSetStore.getState().recordEdit;

    // 1. Resize the heading's font-size.
    handleSliderCommit(heading, "font-size", "32px", "font-size", emptyTheme, "#heading", recordEdit);
    // 2. Round the card's corners.
    handleSliderCommit(card, "border-radius", "12px", "border-radius", emptyTheme, "#card", recordEdit);
    // 3. Add a border to the card.
    handleSliderCommit(card, "border-style", "solid", "border-style", emptyTheme, "#card", recordEdit);

    const { edits } = useChangeSetStore.getState();

    // Exactly three lines — not two (properties, not elements, are what
    // dedup keys on: two edits on #card for DIFFERENT properties must both
    // survive, only a same-element-same-property re-commit collapses).
    expect(edits).toHaveLength(3);

    const byProperty = Object.fromEntries(edits.map((e) => [e.property, e]));
    expect(byProperty["font-size"].structuralPath).toBe("#heading");
    expect(byProperty["border-radius"].structuralPath).toBe("#card");
    expect(byProperty["border-style"].structuralPath).toBe("#card");

    // Each line is a real before/after pair (Review's whole point), not an
    // edit that happens to look like a no-op.
    for (const e of edits) {
      if (e.kind === "class") {
        expect(e.oldClassList.join(" ")).not.toBe(e.newClassList.join(" "));
      } else {
        throw new Error("expected a class-kind EditRecord in this Tailwind-mode scenario");
      }
    }

    // Sanity-check the friendlier labels Review renders for each row.
    expect(friendlyLabel("#heading")).toBe("#heading");
    expect(friendlyLabel("#card")).toBe("#card");

    // Discard-all reverts both elements to their pre-session class lists
    // and empties the change-set — the other half of Task 4.2.
    revertAllEdits(edits, document);
    expect(heading.className).toBe("text-lg");
    expect(card.className).toBe("w-64");
  });
});
