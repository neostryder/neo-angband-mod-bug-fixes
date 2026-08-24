/**
 * The `bug-fixes` mod's entry point, and the four patches whose whole body is a
 * hook (the staircase repair has its own file, stairs.test.ts; the string table
 * has strings.test.ts).
 *
 * Every test drives the mod the way the game does: call the default export with
 * resolved flags, install the result as GameState.modHooks / MakeDeps.hooks, and
 * assert the game's behaviour. The matching SEAM tests in core assert the other
 * half - that core offers each point, and what it does with an absent hook.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  loadPackFile as loadJson,
  loadPackRecords as loadRecords,
} from "@rpgm-tools/neo-angband-content/pack";
import {
  ArtifactState,
  FlagSet,
  HIST,
  KF,
  MFLAG_SIZE,
  ObjAllocState,
  ObjRegistry,
  RF,
  RF_SIZE,
  Rng,
  bindConstants,
  histHas,
  loadGame,
  makeArtifact,
  objectListStandardCompare,
  objectPrep,
  saveGame,
  startGame,
} from "@rpgm-tools/neo-angband-core";
import type {
  Artifact,
  GameObject,
  GamePack,
  MakeDeps,
  ModHooks,
  ObjectListEntry,
} from "@rpgm-tools/neo-angband-core";
import * as neoCore from "@rpgm-tools/neo-angband-core";
import { validateManifest } from "@rpgm-tools/neo-angband-mod-sdk";
import type { BugFixesHooks, RawUserNoteWrite } from "./history";
import plugin from "./plugin";

/**
 * The mod's behaviour, driven the way the HOST drives it: the entry point is a
 * ModPlugin whose `hooks` reads the engine off `ctx.core`
 * (mods/bug-fixes/plugin.ts), and the host reduces that to a function of flags
 * (src/mod-hooks.ts pluginAdapter). Same reduction here, with the real core.
 */
const bugFixesHooks = (
  flags: Readonly<Record<string, boolean>>,
): ModHooks & BugFixesHooks => plugin.hooks({ flags, core: neoCore }) as unknown as ModHooks & BugFixesHooks;

/* ------------------------------------------------------------------ *
 * Content.
 * ------------------------------------------------------------------ */


const objPack = {
  objectBase: loadJson("object_base"),
  object: loadJson("object"),
  egoItem: loadJson("ego_item"),
  artifact: loadJson("artifact"),
  curse: loadJson("curse"),
  brand: loadJson("brand"),
  slay: loadJson("slay"),
  activation: loadJson("activation"),
  objectProperty: loadJson("object_property"),
  flavor: loadJson("flavor"),
};

const pack: GamePack = {
  constants: loadJson("constants"),
  terrain: loadRecords("terrain"),
  roomTemplates: loadRecords("room_template"),
  vaults: loadRecords("vault"),
  dungeonProfiles: loadRecords("dungeon_profile"),
  projection: loadRecords("projection"),
  trap: loadRecords("trap"),
  names: loadRecords("names"),
  quest: loadRecords("quest"),
  obj: objPack,
  mon: {
    pain: loadRecords("pain"),
    blowMethods: loadRecords("blow_methods"),
    blowEffects: loadRecords("blow_effects"),
    monsterSpells: loadRecords("monster_spell"),
    monsterBases: loadRecords("monster_base"),
    monsters: loadRecords("monster"),
    summons: loadRecords("summon"),
    pits: loadRecords("pit"),
  },
  player: {
    races: loadRecords("p_race"),
    classes: loadRecords("class"),
    properties: loadRecords("player_property"),
    timed: loadRecords("player_timed"),
    shapes: loadRecords("shape"),
    bodies: loadRecords("body"),
    history: loadRecords("history"),
    realms: loadRecords("realm"),
  },
} as unknown as GamePack;

/** Every flag the manifest declares, all ON - what enabling the mod gives you. */
const ALL_ON: Readonly<Record<string, boolean>> = {
  "bugfix.textAndHistory": true,
  "bugfix.stateIntegrity": true,
  "bugfix.levelGeneration": true,
};

/**
 * One player-facing class toggle -> the hooks that class installs.
 * One toggle per CLASS of fix, never one per atomic fix.
 */
const CLASS_TO_HOOKS: readonly [string, readonly string[]][] = [
  ["bugfix.textAndHistory", ["historyAdd", "historyDisplay", "messageText"]],
  [
    "bugfix.stateIntegrity",
    ["saveNoiseScent", "objectListTiebreak", "artifactCommit"],
  ],
  ["bugfix.levelGeneration", ["levelGenerated"]],
];

describe("the bug-fixes mod's entry point", () => {
  it("matches the manifest: every runtime hook class has a declared rule or section flag", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("./manifest.json", import.meta.url), "utf8"),
    ) as { rules: { flag: string }[]; sections: { id: string; flag?: string }[] };
    /* A content-only section needs no plugin hook, so this is deliberately
     * one-directional. Code without a declared player toggle would create a
     * change the player cannot switch off. */
    const declaredFlags = [
      ...manifest.rules.map((r) => r.flag),
      ...manifest.sections.map((s) => s.flag ?? s.id),
    ];
    for (const [flag] of CLASS_TO_HOOKS) expect(declaredFlags).toContain(flag);
    expect(Object.keys(ALL_ON).sort()).toEqual(
      CLASS_TO_HOOKS.map(([f]) => f).sort(),
    );
  });

  it("contributes nothing when the mod is enabled but every class is off", () => {
    expect(bugFixesHooks({})).toEqual({});
    const allOff = Object.fromEntries(
      CLASS_TO_HOOKS.map(([flag]) => [flag, false]),
    );
    expect(bugFixesHooks(allOff)).toEqual({});
  });

  it("installs exactly the hooks each class needs, and no other", () => {
    for (const [flag, classHooks] of CLASS_TO_HOOKS) {
      const hooks = bugFixesHooks({ [flag]: true });
      expect(Object.keys(hooks).sort(), `${flag} alone`).toEqual(
        [...classHooks].sort(),
      );
    }
  });

  it("installs every hook with the whole patch set on", () => {
    const allHooks = CLASS_TO_HOOKS.flatMap(([, hs]) => hs).sort();
    expect(Object.keys(bugFixesHooks(ALL_ON)).sort()).toEqual(allHooks);
  });
});

describe("the six atomic flags survive the class regroup through rule and section renames", () => {
  /*
   * This mod has never written a save-file bag (no `register()`, nothing on
   * `ctx.state.mods["bug-fixes"]`), so it has no business owning a
   * `saveSchema` / `migrateBag` migration - that seam is for a mod's own
   * PERSISTED GAME STATE, and this mod persists none. What actually needed to
   * survive the six-flags-to-three regroup is PLAYER TOGGLE STATE. The host
   * resolves rule and section choices from its own store, keyed by flag name.
   * Four retired rules retain `renamedRuleFlags`; the Text and history rule
   * became a content section, so its own legacy rule and its two predecessors
   * use that section's `renamedSectionFlags` instead.
   */
  const manifestRaw = JSON.parse(
    readFileSync(new URL("./manifest.json", import.meta.url), "utf8"),
  ) as {
    rules: { flag: string }[];
    sections: { id: string; flag?: string; renamedSectionFlags?: string[] }[];
    renamedRuleFlags?: Record<string, string>;
    saveSchema?: number;
  };

  const EXPECTED_RENAMES: Readonly<Record<string, string>> = {
    "bugfix.noiseScentSave": "bugfix.stateIntegrity",
    "bugfix.objectListOrder": "bugfix.stateIntegrity",
    "bugfix.duplicateArtifact": "bugfix.stateIntegrity",
    "bugfix.stairsReachable": "bugfix.levelGeneration",
  };

  it("declares no saveSchema and ships no migrateBag - there is no bag to migrate", () => {
    expect(manifestRaw.saveSchema).toBeUndefined();
    expect((plugin as Record<string, unknown>)["migrateBag"]).toBeUndefined();
  });

  it("keeps non-content rule renames pointed at current rules", () => {
    expect(manifestRaw.renamedRuleFlags).toEqual(EXPECTED_RENAMES);
    const currentFlags = new Set(manifestRaw.rules.map((r) => r.flag));
    for (const [oldFlag, newFlag] of Object.entries(EXPECTED_RENAMES)) {
      expect(currentFlags.has(newFlag), `${newFlag} must still be a declared rule`).toBe(true);
      expect(currentFlags.has(oldFlag), `${oldFlag} must NOT still be a declared rule`).toBe(false);
    }
  });

  it("moves Text and history's legacy rule choices to its content section", () => {
    const section = manifestRaw.sections.find((s) => s.id === "bugfix-text-and-history");
    expect(section).toBeDefined();
    expect(section!.flag).toBe("bugfix.textAndHistory");
    expect(section!.renamedSectionFlags).toEqual([
      "bugfix.textAndHistory",
      "bugfix.uniqueKillHistory",
      "bugfix.miscStrings",
      "text-corrections",
    ]);
  });

  it("passes the host's real manifest validator with renamedRuleFlags in place", () => {
    // The actual gate the game runs at install/enable time, not a hand-rolled
    // stand-in for it - this is what would refuse a bad rename (a destination
    // that is not a current rule, a source that still is one, self-rename).
    expect(() => validateManifest(manifestRaw)).not.toThrow();
  });

  /**
   * Mirrors ModStore.migrateRuleChoices (packages/web/src/mod-store.ts in the
   * engine repo): a choice already recorded for the current flag wins outright;
   * otherwise every retired flag feeding one class is folded with OR. This repo
   * has no dependency on the web package, so the fold is reimplemented here to
   * pin the PROPERTY the remaining manifest `renamedRuleFlags` exists to buy:
   * an old per-fix choice always resolves into the right class, and turning a
   * fix ON is never silently lost.
   */
  function foldRuleChoices(
    oldChoices: Readonly<Record<string, boolean>>,
    renamed: Readonly<Record<string, string>>,
  ): Record<string, boolean> {
    const folded: Record<string, boolean> = {};
    for (const [oldFlag, newFlag] of Object.entries(renamed)) {
      const old = oldChoices[oldFlag];
      if (old === undefined) continue;
      folded[newFlag] = (folded[newFlag] ?? false) || old;
    }
    return folded;
  }

  it("round-trips a pre-regroup player's remaining rule choices into their classes with no loss", () => {
    // A player on the OLD (six-flag) mod who had explicitly turned some fixes
    // off - mixed state inside a multi-fix class is exactly what the OR-fold
    // has to decide, and is the case a lossy migration would get wrong.
    const preRegroupChoices = {
      "bugfix.noiseScentSave": true,
      "bugfix.objectListOrder": false,
      "bugfix.duplicateArtifact": false,
      "bugfix.stairsReachable": false,
    };
    expect(foldRuleChoices(preRegroupChoices, EXPECTED_RENAMES)).toEqual({
      "bugfix.stateIntegrity": true, // noiseScentSave on, the other two off
      "bugfix.levelGeneration": false, // stairsReachable was off alone
    });
  });

  it("turns a class off only when every remaining retired constituent was off", () => {
    const allOffInText = {
      "bugfix.noiseScentSave": false,
      "bugfix.objectListOrder": false,
      "bugfix.duplicateArtifact": false,
      "bugfix.stairsReachable": true,
    };
    expect(foldRuleChoices(allOffInText, EXPECTED_RENAMES)).toEqual({
      "bugfix.stateIntegrity": false,
      "bugfix.levelGeneration": true,
    });
  });

  it("leaves a flag the player never touched absent, so it still resolves to the manifest default", () => {
    // getRuleChoices only ever stores deliberate deviations; a flag missing
    // from the old choices must stay missing from the fold, not become an
    // explicit false that would override the new rule's default.
    const onlyOneChoice = { "bugfix.stairsReachable": false };
    const folded = foldRuleChoices(onlyOneChoice, EXPECTED_RENAMES);
    expect(folded).toEqual({ "bugfix.levelGeneration": false });
    expect(folded).not.toHaveProperty("bugfix.stateIntegrity");
  });
});

describe("#4245: no duplicate unique-kill history entries", () => {
  const hook = bugFixesHooks(ALL_ON).historyAdd!;

  it("suppresses a duplicate and permits everything else", () => {
    expect(hook({ what: "Killed Grip", type: HIST.SLAY_UNIQUE, duplicate: true })).toBe(false);
    expect(hook({ what: "Killed Grip", type: HIST.SLAY_UNIQUE, duplicate: false })).toBe(true);
    /* It keys on the duplicate flag core computes, not on the text - so it cannot
     * accidentally swallow an unrelated entry that happens to read the same. */
    expect(hook({ what: "Found The Phial", type: HIST.ARTIFACT_KNOWN, duplicate: false })).toBe(true);
  });

  it("in a real game, a re-kill logs one entry instead of two", () => {
    const uniqueFlags = new FlagSet(RF_SIZE);
    uniqueFlags.on(RF.UNIQUE);
    const race = {
      ridx: 2,
      name: "Grip, Farmer Maggot's Dog",
      mexp: 1,
      level: 1,
      flags: uniqueFlags,
      blows: [],
      drops: [],
      maxNum: 1,
    };
    const mon = (): never =>
      ({
        race,
        originalRace: null,
        midx: 0,
        grid: { x: 20, y: 12 },
        heldObj: [],
        mflag: new FlagSet(MFLAG_SIZE),
      }) as never;

    const game = startGame(pack, { seed: 4242, depth: 1, modHooks: bugFixesHooks(ALL_ON) });
    race.maxNum = 1;
    game.state.onPlayerKill?.(mon());
    game.state.onPlayerKill?.(mon());
    const logged = game.state.actor.player.hist.filter((e) =>
      histHas(e.type, HIST.SLAY_UNIQUE),
    );
    expect(logged).toHaveLength(1);
    expect(logged[0]?.event).toBe("Killed Grip, Farmer Maggot's Dog");
  });
});

describe("#6665: raw player notes expand after history storage", () => {
  const playerName = "CelebrimborLong";
  const raw = `/say ${"x".repeat(64)}`;
  const expanded = `-- ${playerName} says: "${raw.slice(5)}"`;

  function storedNote(hooks: ModHooks & BugFixesHooks) {
    const game = startGame(pack, { seed: 6665, depth: 1, modHooks: hooks });
    const entry: RawUserNoteWrite = {
      what: expanded,
      type: HIST.USER_INPUT,
      duplicate: false,
      rawUserInput: raw,
    };
    const wanted = hooks.historyAdd?.(entry) ?? true;
    expect(wanted).toBe(true);
    const add = neoCore.historyAdd as unknown as (
      player: typeof game.state.actor.player,
      text: string,
      type: number,
      dlev: number,
      clev: number,
      turn: number,
      expandUserInput?: true,
    ) => boolean;
    add(game.state.actor.player, entry.what, HIST.USER_INPUT, 1, 1, 7, entry.expandUserInput);

    const saved = JSON.parse(JSON.stringify(saveGame(game)));
    const savedEntry = saved.player.hist.at(-1)!;
    if (entry.expandUserInput === true) {
      expect(savedEntry).toMatchObject({ event: raw, expandUserInput: true });
    } else {
      expect(savedEntry).toMatchObject({ event: expanded.slice(0, 79) });
    }
    const restored = loadGame(pack, saved as never).state;
    const entryAfterReload = (restored.actor.player.hist as unknown as Array<{
      event: string;
      expandUserInput?: true;
    }>).at(-1)!;
    return { entryAfterReload, hooks };
  }

  it("keeps a full raw note through a save/reload and expands it in every history view", () => {
    const { entryAfterReload, hooks } = storedNote(bugFixesHooks(ALL_ON));
    expect(expanded).toHaveLength(91);
    expect(entryAfterReload).toMatchObject({ event: raw, expandUserInput: true });
    expect(entryAfterReload.event).toHaveLength(69);
    const displayEntry =
      entryAfterReload.expandUserInput === true
        ? { what: entryAfterReload.event, type: 1 << HIST.USER_INPUT, expandUserInput: true as const }
        : { what: entryAfterReload.event, type: 1 << HIST.USER_INPUT };
    expect(hooks.historyDisplay!(displayEntry, playerName)).toBe(expanded);
    expect(hooks.historyDisplay!(displayEntry, playerName)).toMatch(/x"$/);
  });

  it("leaves the 4.2.6 expanded-and-truncated entry untouched when Text and history is off", () => {
    const { entryAfterReload, hooks } = storedNote(
      bugFixesHooks({ "bugfix.textAndHistory": false }),
    );
    expect(hooks.historyAdd).toBeUndefined();
    expect(hooks.historyDisplay).toBeUndefined();
    expect(entryAfterReload).toMatchObject({ event: expanded.slice(0, 79) });
    expect(entryAfterReload.event).toHaveLength(79);
    expect(entryAfterReload.event).not.toMatch(/"$/);
  });
});

describe("#4605: noise and scent ride the save", () => {
  it("asks for them", () => {
    expect(bugFixesHooks(ALL_ON).saveNoiseScent!()).toBe(true);
  });

  it("in a real game, the heatmaps survive save/reload exactly", () => {
    const hooks = bugFixesHooks(ALL_ON);
    const game = startGame(pack, { seed: 808, depth: 3, modHooks: hooks });
    /* One hand-set scent value, so an all-zero map cannot make the round trip
     * pass vacuously. (Playing turns would fill the maps too, but it would make
     * this test depend on the turn loop as well as on the save.) */
    const c = game.state.chunk;
    c.scent[game.state.actor.grid.y * c.width + game.state.actor.grid.x] = 42;

    const saved = JSON.parse(JSON.stringify(saveGame(game))) as {
      chunk: { scent?: unknown; noise?: unknown };
    };
    expect(saved.chunk.scent).toBeDefined();
    expect(saved.chunk.noise).toBeDefined();

    const restored = loadGame(pack, saved as never).state;
    expect(Array.from(restored.chunk.scent)).toEqual(Array.from(c.scent));
    expect(Array.from(restored.chunk.noise)).toEqual(Array.from(c.noise));
  });
});

describe("#4664: a strict total order for the floor object list", () => {
  const tiebreak = bugFixesHooks(ALL_ON).objectListTiebreak!;

  it("orders nearer-to-top first, then leftmost", () => {
    expect(tiebreak({ dy: 3, dx: 4 }, { dy: 4, dx: 3 })).toBeLessThan(0);
    expect(tiebreak({ dy: 4, dx: 3 }, { dy: 3, dx: 4 })).toBeGreaterThan(0);
    /* Same row: dx decides. */
    expect(tiebreak({ dy: 2, dx: 1 }, { dy: 2, dx: 5 })).toBeLessThan(0);
    /* The same grid twice really is equal - a total order still has ties for
     * identical keys, and returning non-zero here would make the sort lie. */
    expect(tiebreak({ dy: 2, dx: 2 }, { dy: 2, dx: 2 })).toBe(0);
  });

  it("is a legal comparator: antisymmetric and transitive", () => {
    const keys = [
      { dy: -2, dx: 3 },
      { dy: 0, dx: 0 },
      { dy: 0, dx: 7 },
      { dy: 1, dx: -4 },
      { dy: 1, dx: 6 },
      { dy: 5, dx: -1 },
    ];
    for (const a of keys) {
      for (const b of keys) {
        /* Summed rather than negated: Math.sign(0) is +0 and -Math.sign(0) is -0,
         * which Object.is (and so toBe) treats as different numbers. */
        expect(Math.sign(tiebreak(a, b)) + Math.sign(tiebreak(b, a))).toBe(0);
        for (const c of keys) {
          if (tiebreak(a, b) < 0 && tiebreak(b, c) < 0) {
            expect(tiebreak(a, c)).toBeLessThan(0);
          }
        }
      }
    }
  });

  it("breaks the tie inside core's comparator, on a real game state", () => {
    const { state } = startGame(pack, { seed: 99, depth: 1, modHooks: bugFixesHooks(ALL_ON) });
    const obj = {
      kind: { name: "Ration of Food", dChar: ",", dAttr: "w", cost: 3 },
      tval: 80,
      sval: 1,
      number: 1,
      artifact: null,
      notice: 0,
    } as unknown as GameObject;
    /* (dx=3, dy=4) and (dx=4, dy=3) are both 25 units away: every upstream key
     * ties, including distance, so only the hook can order them. */
    const a = { object: obj, unknown: false, count: [1, 0], dx: 3, dy: 4 } as unknown as ObjectListEntry;
    const b = { object: obj, unknown: false, count: [1, 0], dx: 4, dy: 3 } as unknown as ObjectListEntry;
    const cmp = objectListStandardCompare(state);
    expect(cmp(a, b)).toBeGreaterThan(0); // b (dy=3) is nearer the top
    expect(cmp(b, a)).toBeLessThan(0);
  });
});

describe("#4510: an artifact cannot be committed twice", () => {
  const reg = new ObjRegistry(objPack as never);
  const constants = bindConstants(loadJson("constants") as never);

  /** A normal (non-special) artifact whose (tval, sval) is unique in the list. */
  function uniqueNormalArt(): Artifact {
    const arts = reg.artifacts.filter((a): a is Artifact => a !== null);
    const found = arts.find((art) => {
      const kind = reg.lookupKind(art.tval, art.sval);
      if (!kind || kind.kindFlags.has(KF.INSTA_ART)) return false;
      return arts.filter((o) => o.tval === art.tval && o.sval === art.sval).length === 1;
    });
    if (!found) throw new Error("no unique normal artifact in the pack");
    return found;
  }

  function deps(hooks?: MakeDeps["hooks"]): MakeDeps {
    const d: MakeDeps = {
      reg,
      alloc: new ObjAllocState(reg, constants),
      constants,
      artifacts: new ArtifactState(reg.artifacts.length),
      noArtifacts: false,
    };
    if (hooks) d.hooks = hooks;
    return d;
  }

  it("refuses a commit of an already-created artifact, and permits a fresh one", () => {
    const hook = bugFixesHooks(ALL_ON).artifactCommit!;
    expect(hook(7, true)).toBe(false);
    expect(hook(7, false)).toBe(true);
  });

  it("in the object pipeline, clears the artifact and reports failure", () => {
    const art = uniqueNormalArt();
    const kind = reg.lookupKind(art.tval, art.sval)!;
    const d = deps(bugFixesHooks(ALL_ON));
    d.artifacts.markCreated(art.aidx, true); // already created elsewhere
    const obj = objectPrep(new Rng(1), reg, constants, kind, art.allocMin, "randomise");
    obj.artifact = art;

    expect(makeArtifact(new Rng(1), d, obj, art.allocMin)).toBe(false);
    expect(obj.artifact).toBeNull();
  });

  it("faithful core (patch off) re-commits it - the wart this patch covers", () => {
    const art = uniqueNormalArt();
    const kind = reg.lookupKind(art.tval, art.sval)!;
    const d = deps(); // no hooks at all
    d.artifacts.markCreated(art.aidx, true);
    const obj = objectPrep(new Rng(1), reg, constants, kind, art.allocMin, "randomise");
    obj.artifact = art;

    expect(makeArtifact(new Rng(1), d, obj, art.allocMin)).toBe(true);
    expect(obj.artifact?.aidx).toBe(art.aidx);
  });
});
