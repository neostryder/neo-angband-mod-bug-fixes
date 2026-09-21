/**
 * bugfix.armourValueFloor (#179) - the mod's own code, wired through
 * plugin.ts's `register()`.
 *
 * THE DEFECT. Angband 4.2.6's own store-pricing formula (object_power's
 * acPower/toAcPower, ported at packages/core/src/obj/power.ts in the game's
 * repository) prices a point of AC differently depending on where it comes
 * from. A point of the kind's own base `ac` is scaled by
 * `trunc(750*(ac+toA)/weight)` (capped at 450%) before being added to the
 * power total, so it earns a share of the SAME multiplier that a heavier,
 * higher-base-AC kind's whole class already rides. A point of magical
 * `to_a` earns only its own flat, unscaled addition (plus tier bonuses that
 * do not start until +27). The two are not equivalent, and the direction is
 * backwards from what a player expects: enchantment is presented as an
 * upgrade, not a worse way to reach the same number.
 *
 * Reported and confirmed (neostryder/neo-angband#179): a magical Studded
 * Leather Armour (+2 AC, 12 base + 2 magic = 14 total) prices at 266 gold,
 * while a plain Hard Leather Armour (16 AC, no bonus at all - MORE total
 * AC, for MORE gold) prices at 336. The enchanted item is the worse buy,
 * gold for gold, than simply choosing plainer, heavier armour sitting on
 * the same shelf.
 *
 * THE FIX. An enchanted item's value is floored at the cheapest ordinary
 * (no ego, no bonus) item of its OWN tval that offers strictly more total
 * AC - the real alternative a shopper would otherwise just buy instead.
 * Every candidate's own price is computed by the SAME faithful formula
 * core already runs (`objectValueReal`, called through `ctx.core`, never
 * reimplemented here) on a synthetic plain object built from that
 * candidate's own base stats. This closes exactly the reported case - a
 * plainer item selling for more than this one despite having less to
 * offer - without inventing a new pricing philosophy: every item that
 * already prices at or above every such alternative (the overwhelming
 * majority, including every unenchanted item and most modestly-enchanted
 * ones) is untouched, because Math.max only ever raises a price, and only
 * when a real, cheaper-but-better alternative exists to raise it to.
 *
 * WHY A CANDIDATE IS BUILT FROM RandomValue.base, NOT object_prep. A
 * registry:tval `valueAdjust` handler is handed the object, the registry,
 * and the computed value - no Rng, no constants bag, nothing object_prep
 * needs. object_prep's "minimise" mode reads exactly the `.base` field of
 * each kind's RandomValue (pval, toH, toD, toA, modifiers, ...) and nothing
 * else, so plainObjectOf reproduces that same minimised, unenchanted object
 * directly from the kind record - no engine call, no randomness, and
 * nothing here can desynchronise anything, because pricing was never part
 * of the RNG stream to begin with.
 *
 * WHY THIS CANNOT RECURSE FOREVER. Every candidate this file builds has
 * `ego: null` and `toA: 0` - so when core's own objectValueReal reaches the
 * SAME registered handler again for that candidate (registry:tval is keyed
 * by tval, and every candidate shares this item's own tval), the
 * `!magical` guard below returns immediately, one level down, every time.
 */

import type { GameObject, ObjectKind, ObjRegistry } from "@rpgm-tools/neo-angband-core";

/**
 * registry:tval's `valueAdjust` context (core's obj/tval-registry.ts
 * TvalValueAdjustContext), declared here rather than imported: the
 * @rpgm-tools/neo-angband-core version this mod is pinned to predates the
 * seam - core's own release for it is a separate, gated step. Keep this in
 * step with TvalValueAdjustContext by hand until a core release carries it.
 */
export interface ValueAdjustContext {
  readonly reg: ObjRegistry;
  readonly obj: GameObject;
  readonly qty: number;
  readonly baseValue: number;
  readonly totalAc: number;
}

/** The one core primitive this fix calls into, never reimplements. */
export type PricingCore = Pick<typeof import("@rpgm-tools/neo-angband-core"), "objectValueReal">;

/**
 * A minimised, unenchanted GameObject of `kind`, built to price it exactly
 * as object_value_real would price a freshly `object_prep`-ed one: every
 * RandomValue field taken at its own `.base`, every bonus, ego and curse
 * cleared. `template` supplies the pieces a bare kind record does not carry
 * on its own (the live FlagSet instance, the elInfo array shape) - both are
 * wiped or zeroed on the COPY returned here, never mutated on the template
 * itself.
 */
function plainObjectOf(kind: ObjectKind, template: GameObject): GameObject {
  const flags = template.flags.clone();
  flags.wipe();
  return {
    ...template,
    kind,
    tval: kind.tval,
    sval: kind.sval,
    ac: kind.ac,
    toA: 0,
    toH: kind.toH.base,
    toD: kind.toD.base,
    weight: kind.weight,
    dd: kind.dd,
    ds: kind.ds,
    pval: 0,
    ego: null,
    artifact: null,
    brands: null,
    slays: null,
    curses: null,
    activation: null,
    modifiers: template.modifiers.map(() => 0),
    flags,
    elInfo: template.elInfo.map(() => ({ resLevel: 0, flags: 0 })),
  };
}

/**
 * The cheapest gold cost, in this item's own tval, of an ordinary item that
 * offers strictly more total AC than `totalAc` - the real comparator a
 * shopper would find on the next shelf. `null` when nothing in the tval
 * offers more (this item already carries the class's own maximum base AC).
 */
function cheapestBetterPlainValue(
  core: PricingCore,
  reg: ObjRegistry,
  tval: number,
  qty: number,
  totalAc: number,
  template: GameObject,
): number | null {
  let cheapest: number | null = null;
  for (const kind of reg.kinds) {
    if (kind.tval !== tval || kind.ac <= totalAc) continue;
    const value = core.objectValueReal(reg, plainObjectOf(kind, template), qty);
    if (cheapest === null || value < cheapest) cheapest = value;
  }
  return cheapest;
}

/**
 * registry:tval's `valueAdjust` handler for #179: floors a magically
 * enhanced armour item's value at the cheapest ordinary item of its own
 * tval that offers strictly more total AC, so enchantment can never make an
 * item a WORSE buy, gold for gold, than plainer and heavier armour sitting
 * on the same shelf.
 *
 * A plain item (`ego` absent and `toA` not positive) is untouched - the
 * whole computation is skipped before it runs. An item that already prices
 * at or above every cheaper-but-better alternative is untouched too:
 * `Math.max` is a floor, never a cut.
 */
export function armourValueFloor(core: PricingCore, ctx: ValueAdjustContext): number {
  const { reg, obj, qty, baseValue, totalAc } = ctx;
  const magical = (obj.ego !== null && obj.ego !== undefined) || obj.toA > 0;
  if (!magical) return baseValue;

  const cheapestBetter = cheapestBetterPlainValue(core, reg, obj.tval, qty, totalAc, obj);
  if (cheapestBetter === null) return baseValue;
  return Math.max(baseValue, cheapestBetter);
}
