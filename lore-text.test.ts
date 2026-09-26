/**
 * "Text and history fixes" (section bugfix-text-and-history) is a section, not a
 * runtime-only rule, because it carries gamedata text patches. text-changes.test.ts
 * checks every patch it ships; this file checks the section itself.
 */

import { describe, expect, it } from "vitest";

import manifest from "./manifest.json";

describe("lore-text", () => {
  it("converts Text and history from a rule to a section with its legacy flags", () => {
    const section = (manifest.sections ?? []).find(
      (s: { id: string }) => s.id === "bugfix-text-and-history",
    );
    expect(section).toBeDefined();
    expect(section!.flag).toBe("bugfix.textAndHistory");
    expect(section!.renamedSectionFlags).toEqual([
      "bugfix.textAndHistory",
      "bugfix.uniqueKillHistory",
      "bugfix.miscStrings",
      "text-corrections",
    ]);
    expect((manifest.rules ?? []).map((r: { flag: string }) => r.flag)).not.toContain(
      "bugfix.textAndHistory",
    );
  });
});
