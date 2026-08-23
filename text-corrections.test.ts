/**
 * The weapon-lore text corrections, filed under the "Text and history fixes"
 * section (bugfix-text-and-history / bugfix.textAndHistory) alongside every
 * other textual correction this mod makes.
 *
 * ONE TOGGLE PER CLASS OF FIX, not one per fix. A player who wants item
 * descriptions to describe the game they are playing wants all of them; a menu
 * with a row per corrected sentence is a menu nobody reads (neostryder,
 * 2026-08-07). So this section owns every "the text says something the game no
 * longer does" correction, and a new one joins it rather than growing the list.
 * The rows below are therefore a table, and the assertions loop over it: adding
 * a correction means adding a row and its patch, and nothing else.
 *
 * TODAY THAT IS THE TWO-HANDED WEAPON LORE.
 * Angband 4.2 has one weapon slot and no two-handed rule: nothing stops a
 * character wielding a Pike and a shield. Four gamedata descriptions still
 * assert otherwise, left over from a rule the game dropped. Core keeps them,
 * because core keeps upstream's text exactly; this mod rewrites them.
 *
 * WHAT THIS FILE TESTS, and what it deliberately does not. The mechanism -
 * that a `patches` entry keyed by a record ref reaches the composed game - is
 * the SDK's behaviour and is tested there (mod-sdk loader.test.ts). Re-asserting
 * it here would test the SDK twice and this mod's data zero times.
 *
 * What can actually be wrong HERE is the data: a ref that resolves to no record
 * (or to the wrong one), and a replacement that says something other than
 * "the same sentence, minus the two-hand claim". Both are checked against the
 * REAL core pack, the published one a player runs, via the same recordKey() the
 * composer uses - not a hand-written mirror of the slug rules, which would agree
 * with itself and not with the composer.
 *
 * THE TWO-DIRECTION ASSERTION. Each row asserts core still MAKES the claim as
 * well as that the patch removes it. Without the first half this file would keep
 * passing after core dropped the wording on its own, and the section would be a
 * patch that changes nothing while still advertising a fix to the player.
 */

import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { recordKey } from "@rpgm-tools/neo-angband-mod-sdk";

import objectContrib from "./object.json";
import artifactContrib from "./artifact.json";
import manifest from "./manifest.json";

const require = createRequire(import.meta.url);

interface PackFile {
  records: Record<string, unknown>[];
}

function corePack(file: string): PackFile {
  return require(`@rpgm-tools/neo-angband-content/pack/${file}.json`) as PackFile;
}

/** The published content version, so a pending core release names itself below. */
const CONTENT_VERSION = (
  require("@rpgm-tools/neo-angband-content/package.json") as { version: string }
).version;

/**
 * Every phrasing of the claim across the four descriptions. Kept as one list
 * rather than per-row so a replacement cannot smuggle the claim back in under a
 * wording no row happened to look for.
 */
const TWO_HAND_CLAIM = [
  "needing two hands",
  "requiring two hands",
  "requires two hands",
  "two hands to wield",
  "two-handed",
];

function claims(text: string): string[] {
  const lower = text.toLowerCase();
  return TWO_HAND_CLAIM.filter((p) => lower.includes(p));
}

/**
 * The four rows, spelled as (file, the record's identity in core, the section's
 * replacement). Identity is the pack record's own fields, so the ref is DERIVED
 * by recordKey rather than copied out of the JSON - copying it would make the
 * test agree with the contribution no matter which record that ref hits.
 */
const ROWS = [
  { file: "object", find: { type: "hafted", name: "& Two-Handed Great Flail~" } },
  { file: "object", find: { type: "polearm", name: "& Pike~" } },
  { file: "artifact", find: { name: "of Wrath" } },
  { file: "artifact", find: { name: "'Mundwine'" } },
] as const;

const CONTRIB: Record<string, { sections: Record<string, { patches: Record<string, { desc: string[] }> }> }> = {
  object: objectContrib,
  artifact: artifactContrib,
};

describe("text-corrections", () => {
  it("declares the section the contributions are filed under", () => {
    const ids = (manifest.sections ?? []).map((s: { id: string }) => s.id);
    expect(ids).toContain("bugfix-text-and-history");
    for (const file of ["object", "artifact"]) {
      expect(Object.keys(CONTRIB[file]!.sections)).toEqual(["bugfix-text-and-history"]);
    }
  });

  it("patches exactly the four records it names, and no others", () => {
    const refs = Object.values(CONTRIB).flatMap((c) =>
      Object.keys(c.sections["bugfix-text-and-history"]!.patches),
    );
    expect(refs).toHaveLength(ROWS.length);
    expect(new Set(refs).size).toBe(ROWS.length);
  });

  for (const row of ROWS) {
    const label = `${row.file}: ${row.find.name}`;

    it(`${label} - the ref resolves to exactly one core record`, () => {
      const hits = corePack(row.file).records.filter((r) =>
        Object.entries(row.find).every(([k, v]) => r[k] === v),
      );
      expect(hits).toHaveLength(1);

      const ref = `core:${recordKey(row.file, hits[0]!)}`;
      const patches = CONTRIB[row.file]!.sections["bugfix-text-and-history"]!.patches;
      expect(Object.keys(patches)).toContain(ref);
    });

    it(`${label} - core makes the two-hand claim and the patch drops it`, () => {
      const rec = corePack(row.file).records.find((r) =>
        Object.entries(row.find).every(([k, v]) => r[k] === v),
      )!;
      const ref = `core:${recordKey(row.file, rec)}`;
      const replacement = CONTRIB[row.file]!.sections["bugfix-text-and-history"]!.patches[ref]!;

      const before = (rec.desc as string[]).join("");
      const after = replacement.desc.join("");

      /*
       * Core carrying the claim is the half that expires. Until the engine
       * publishes a content pack built from an unedited reference/lib/gamedata,
       * the published pack still holds THIS MOD's text and there is nothing to
       * fix - so the failure names that, rather than reading as a bad ref.
       */
      expect(
        claims(before),
        `core content ${CONTENT_VERSION} no longer makes the two-hand claim for ` +
          `${row.find.name}. Either the engine has not yet published a pack built ` +
          `from unedited upstream gamedata (bump @rpgm-tools/neo-angband-content), ` +
          `or upstream fixed the wording and this section should be retired.`,
      ).not.toEqual([]);

      expect(claims(after), `replacement still claims two hands: ${after}`).toEqual([]);

      /*
       * A replacement is a restatement, not a new item: same opening clause.
       * 20 chars, not 24 - Pike's two-hand clause starts right after "spear,"
       * (common prefix 22), so 24 clips into the diverging word and fails for
       * that row alone. 20 stays under all four rows' shared opening (22-53).
       */
      expect(after.slice(0, 20)).toBe(before.slice(0, 20));
      expect(after.length).toBeLessThan(before.length);
    });
  }
});
