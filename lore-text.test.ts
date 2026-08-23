/**
 * "Text and history fixes" (section bugfix-text-and-history).
 *
 * These are gamedata text corrections, so the toggle has to be a section rather
 * than a runtime-only rule. The tests derive each record ref from the published
 * content pack with recordKey(), then check both directions: core still carries
 * the wording that needs correction, and this contribution replaces that exact
 * leaf field.
 */

import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { recordKey } from "@rpgm-tools/neo-angband-mod-sdk";

import classContrib from "./class.json";
import objectPropertyContrib from "./object_property.json";
import manifest from "./manifest.json";

const require = createRequire(import.meta.url);

interface PackFile {
  records: Record<string, unknown>[];
}

interface FieldPatch {
  op: string;
  path: string;
  value: string;
}

interface Contribution {
  sections: Record<string, { fieldPatches: Record<string, FieldPatch[]> }>;
}

function corePack(file: string): PackFile {
  return require(`@rpgm-tools/neo-angband-content/pack/${file}.json`) as PackFile;
}

function valueAtPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (Array.isArray(current)) return current[Number(part)];
    if (typeof current === "object" && current !== null) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, value);
}

const ROWS = [
  {
    file: "class",
    find: { name: "Priest" },
    path: "book.4.spell.4.name",
    before: "Light of Manwë",
    after: "Light of Varda",
  },
  {
    file: "object_property",
    find: { code: "BLESSED", name: "blessed melee" },
    path: "desc",
    before: "Blessed by the gods (combat bonuses for holy casters)",
    after: "Blessed by the Valar (combat bonuses for holy casters)",
  },
] as const;

const CONTRIB: Record<string, Contribution> = {
  class: classContrib,
  object_property: objectPropertyContrib,
};

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

  for (const row of ROWS) {
    it(`${row.file}: ${row.before} is replaced with ${row.after}`, () => {
      const hits = corePack(row.file).records.filter((record) =>
        Object.entries(row.find).every(([key, value]) => record[key] === value),
      );
      expect(hits).toHaveLength(1);

      const record = hits[0]!;
      const ref = `core:${recordKey(row.file, record)}`;
      const fieldPatches = CONTRIB[row.file]!.sections["bugfix-text-and-history"]!.fieldPatches;

      expect(valueAtPath(record, row.path)).toBe(row.before);
      expect(Object.keys(fieldPatches)).toEqual([ref]);
      expect(fieldPatches[ref]).toEqual([
        { op: "set", path: row.path, value: row.after },
      ]);
    });
  }
});
