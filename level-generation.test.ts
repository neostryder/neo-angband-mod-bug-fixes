import { describe, expect, it } from "vitest";
import { loadPackRecords } from "@rpgm-tools/neo-angband-content/pack";
import * as neoCore from "@rpgm-tools/neo-angband-core";
import { PROVENANCE_KEY, composeContentPacks, recordKey, resolveSectionState, sectionFlag, validateManifest } from "@rpgm-tools/neo-angband-mod-sdk";
import type { FileContribution, JsonRecord, LoadedPack } from "@rpgm-tools/neo-angband-mod-sdk";
import manifestDocument from "./manifest.json";
import vault from "./vault.json";
import roomTemplate from "./room_template.json";
import plugin from "./plugin";

const manifest = validateManifest(manifestDocument);
const sectionId = "bugfix-level-generation";
const section = manifest.sections!.find((s) => s.id === sectionId)!;
const baseFiles = {
  vault: { records: loadPackRecords("vault") as JsonRecord[] },
  room_template: { records: loadPackRecords("room_template") as JsonRecord[] },
};
const packs: LoadedPack[] = [
  { manifest: { id: "core", name: "Core", version: "1.23.0-beta.4", shape: "content" }, files: baseFiles },
  { manifest, files: { vault, room_template: roomTemplate as FileContribution } },
];

function compose(enabled: boolean) {
  const choices = { "bug-fixes": { [sectionId]: enabled } };
  const state = resolveSectionState(packs.map((p) => p.manifest), choices, new Set(["core", "bug-fixes"]));
  const on = state.get("bug-fixes")!.get(sectionId)!;
  return {
    content: composeContentPacks(packs, { sections: choices }),
    flags: { [sectionFlag(section)]: on },
  };
}

function record(records: readonly unknown[], name: string): JsonRecord {
  const hits = (records as JsonRecord[]).filter((r) => r["name"] === name);
  expect(hits).toHaveLength(1);
  const { [PROVENANCE_KEY]: _provenance, ...body } = hits[0]!;
  return body;
}

describe("level generation template fixes", () => {
  it("uses one enabled-by-default section for the patches and the staircase hook", () => {
    expect(section.flag).toBe("bugfix.levelGeneration");
    expect(section.default).toBe(true);
    for (const enabled of [true, false]) {
      const { flags, content } = compose(enabled);
      expect(content.problems).toEqual([]);
      expect(content.faults).toEqual([]);
      const engine = { api: "1" as const, core: neoCore, state: undefined, registries: undefined, registry: undefined };
      expect(typeof plugin.engineHooks({ id: "bug-fixes", flags, engine })["levelGenerated"])
        .toBe(enabled ? "function" : "undefined");
    }
  });

  it("addresses exactly the three upstream records through their real keys", () => {
    const diagonal = record(baseFiles.vault.records, "Diagonal 1");
    expect(diagonal["type"]).toBe("Interesting room");
    expect(Object.keys(vault.sections[sectionId].patches)).toEqual([`core:${recordKey("vault", diagonal)}`]);
    expect(Object.keys(roomTemplate.sections[sectionId].fieldPatches)).toEqual([
      `core:${recordKey("room_template", record(baseFiles.room_template.records, "Comb right"))}`,
      `core:${recordKey("room_template", record(baseFiles.room_template.records, "Zag right"))}`,
    ]);
  });

  it("reproduces all eight Diagonal 1 edge rows from upstream 2faa18c03", () => {
    const before = record(baseFiles.vault.records, "Diagonal 1");
    expect(before["D"]).toEqual([
      "    %%%%%%%%", "    %......%", "    %......%", "   %.1....% ",
      "   %......% ", "  %......%  ", "  %......%  ", " %1.1...%   ",
      " %......%   ", "%......%    ", "%%%%%%%%    ",
    ]);
    expect(record(compose(true).content.records["vault"]!, "Diagonal 1")).toEqual({
      ...before,
      D: [
        "    %%%%%%%%", "    %......%", "   %%......%", "   %.1....%%",
        "  %%......% ", "  %......%% ", " %%......%  ", " %1.1...%%  ",
        "%%......%   ", "%......%%   ", "%%%%%%%%    ",
      ],
    });
  });

  it("changes only Comb right's doors from 1 to 2 as upstream 24d52a798", () => {
    const before = record(baseFiles.room_template.records, "Comb right");
    expect(before["doors"]).toBe(1);
    expect(record(compose(true).content.records["room_template"]!, "Comb right"))
      .toEqual({ ...before, doors: 2 });
  });

  it("changes only Zag right's middle edge as upstream 9af5ea85a, leaving Zag left alone", () => {
    const before = record(baseFiles.room_template.records, "Zag right");
    const rows = before["D"] as string[];
    expect(rows[5]).toBe("##x(xx#x(xx#x(xx#%");
    const records = compose(true).content.records["room_template"]!;
    expect(record(records, "Zag right")).toEqual({
      ...before, D: rows.map((row, i) => i === 5 ? "##x(xx#x(xx#x(xx##" : row),
    });
    expect(record(records, "Zag left")).toEqual(record(baseFiles.room_template.records, "Zag left"));
  });

  it("preserves every other record when on and every original record when off", () => {
    const enabled = compose(true).content;
    const disabled = compose(false).content;
    for (const file of ["vault", "room_template"] as const) {
      const originals = baseFiles[file].records;
      expect(enabled.records[file]).toHaveLength(originals.length);
      expect(disabled.records[file]).toEqual(originals);
      const patchedNames = file === "vault" ? ["Diagonal 1"] : ["Comb right", "Zag right"];
      for (const [i, original] of originals.entries()) {
        if (!patchedNames.includes(original["name"] as string)) expect(enabled.records[file]![i]).toEqual(original);
      }
    }
  });
});
