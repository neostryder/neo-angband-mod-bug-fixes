/**
 * bugfix.armourValueFloor (#179) - armourValueFloor driven against the REAL
 * published engine and the real content pack, the same harness plugin.test.ts
 * uses for the rest of this mod. Nothing here is a hand-built fake of core's
 * pricing: `objectValueReal` is the genuine, published formula, so the exact
 * gold figures below are what the game itself computes, not a guess.
 *
 * `armourValueFloor` only calls `PricingCore.objectValueReal`, which is
 * already part of @rpgm-tools/neo-angband-core's PUBLISHED surface - the
 * function itself needs nothing from the new registry:tval `valueAdjust`
 * seam to be exercised directly. What this suite cannot cover is the
 * SEAM'S OWN wiring (a real `objectValueReal` invoking a registered
 * `valueAdjust` handler at all) - that half is core's, tested there, and
 * needs a core release before it can be exercised end to end from here. See
 * plugin.test.ts for how `register()` installs this handler onto a host.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  loadPackFile as loadJson,
} from "@rpgm-tools/neo-angband-content/pack";
import { ObjRegistry, Rng, bindConstants, objectPrep, objectValueReal } from "@rpgm-tools/neo-angband-core";
import type { GameObject, ObjectKind, ObjPackJson } from "@rpgm-tools/neo-angband-core";
import { armourValueFloor } from "./armour-value";
import type { PricingCore, ValueAdjustContext } from "./armour-value";

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
} as unknown as ObjPackJson;

const reg = new ObjRegistry(objPack);
const constants = bindConstants(loadJson("constants"));
const core: PricingCore = { objectValueReal };

function findKind(name: string): ObjectKind {
  const kind = reg.kinds.find((k) => k.name === name);
  if (!kind) throw new Error(`content pack has no kind named ${name}`);
  return kind;
}

function makePlain(kind: ObjectKind): GameObject {
  return objectPrep(new Rng(1), reg, constants, kind, 0, "minimise");
}

function ctxFor(obj: GameObject, qty = 1): ValueAdjustContext {
  return {
    reg,
    obj,
    qty,
    baseValue: objectValueReal(reg, obj, qty),
    totalAc: obj.ac + obj.toA,
  };
}

describe("armourValueFloor (#179) - the exact reported case", () => {
  it("reproduces the reported, inverted numbers from real content", () => {
    const studded = makePlain(findKind("Studded Leather Armour~"));
    studded.toA = 2;
    const hardLeather = makePlain(findKind("Hard Leather Armour~"));

    /* The confirmed, already-researched baseline (see plugin.ts's header and
     * this mod's manifest.json/README): magical Studded Leather Armour
     * (+2 AC, 14 total) prices at 266; plain Hard Leather Armour (16 AC, no
     * bonus) prices at 336. Reproduced here from the real formula and the
     * real content pack, not hand-computed. */
    expect(objectValueReal(reg, studded, 1)).toBe(266);
    expect(objectValueReal(reg, hardLeather, 1)).toBe(336);
    expect(objectValueReal(reg, studded, 1)).toBeLessThan(objectValueReal(reg, hardLeather, 1));
  });

  it("floors the magical item at the cheapest plainer item with more AC - the toggle ON behaviour", () => {
    const studded = makePlain(findKind("Studded Leather Armour~"));
    studded.toA = 2;
    const ctx = ctxFor(studded);

    expect(ctx.baseValue).toBe(266);
    expect(ctx.totalAc).toBe(14);

    /* Hard Leather Armour (16 AC, plain, 336 gold) is the cheapest kind in
     * Studded Leather's own tval that offers more than 14 total AC, so the
     * floor lands exactly there - no longer cheaper than the plainer,
     * heavier alternative on the same shelf. */
    expect(armourValueFloor(core, ctx)).toBe(336);
  });

  it("leaves the numbers exactly as reported when the toggle is OFF (no handler installed)", () => {
    /* The toggle being off means register() never installs armourValueFloor
     * at all (see plugin.test.ts) - object_value_real is then the plain
     * published function, exercised directly here to prove the untouched
     * numbers still match the report exactly. */
    const studded = makePlain(findKind("Studded Leather Armour~"));
    studded.toA = 2;
    const hardLeather = makePlain(findKind("Hard Leather Armour~"));

    expect(objectValueReal(reg, studded, 1)).toBe(266);
    expect(objectValueReal(reg, hardLeather, 1)).toBe(336);
  });
});

describe("armourValueFloor - a second real inversion, and the boundary where one stops", () => {
  it("corrects a second real case: Hard Leather Armour +1 (17 total AC) undersells Leather Scale Mail (20 AC, plain, 546g)", () => {
    const hardLeatherPlusOne = makePlain(findKind("Hard Leather Armour~"));
    hardLeatherPlusOne.toA = 1;
    const ctx = ctxFor(hardLeatherPlusOne);

    expect(ctx.baseValue).toBe(374);
    expect(ctx.totalAc).toBe(17);
    expect(armourValueFloor(core, ctx)).toBe(546);
  });

  it("is a no-op right at the boundary where its own value already matches the cheapest better alternative", () => {
    /* Hard Leather Armour +3 (19 total AC) already prices at exactly what
     * Leather Scale Mail (20 AC, plain) costs - Math.max is a genuine no-op
     * here, not a skip: a real candidate exists, and this item's own price
     * already meets it. */
    const hardLeatherPlusThree = makePlain(findKind("Hard Leather Armour~"));
    hardLeatherPlusThree.toA = 3;
    const ctx = ctxFor(hardLeatherPlusThree);

    expect(ctx.baseValue).toBe(546);
    expect(armourValueFloor(core, ctx)).toBe(ctx.baseValue);
  });
});

describe("armourValueFloor - does not touch what is not inverted", () => {
  it("is a no-op for a plain item (no ego, toA <= 0)", () => {
    const plain = makePlain(findKind("Studded Leather Armour~"));
    const ctx = ctxFor(plain);
    expect(armourValueFloor(core, ctx)).toBe(ctx.baseValue);
  });

  it("is a no-op for a cursed item (negative toA, no ego)", () => {
    const cursed = makePlain(findKind("Studded Leather Armour~"));
    cursed.toA = -3;
    const ctx = ctxFor(cursed);
    expect(armourValueFloor(core, ctx)).toBe(ctx.baseValue);
  });

  it("is a no-op for the heaviest kind in its tval - there is nothing plainer-but-better to compare against", () => {
    const heaviest = makePlain(findKind("Adamantite Plate Mail~"));
    heaviest.toA = 5;
    const ctx = ctxFor(heaviest);
    expect(armourValueFloor(core, ctx)).toBe(ctx.baseValue);
  });
});
