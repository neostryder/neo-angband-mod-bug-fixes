/**
 * Every read this mod makes of the game's internals happens in this file. No
 * other file in the mod reads `ctx.core` or names an engine function. The
 * plugin entry builds the adapter once with `createAdapter(ctx)` and passes the
 * pieces down. The exports are grouped by the mod API 2 domain each one maps
 * to, and `engine` holds what API 2 does not give a mod at all.
 *
 * The hooks this mod installs, and their API 2 status.
 * - `messageText`, `historyDisplay`, `saveNoiseScent` and `objectListTiebreak`
 *   exist in API 2 with the same job. The message rewrite needs no declaration.
 * - `historyAdd` exists in API 2, where it returns `{ keep, what?, expandUserInput? }`
 *   instead of editing the entry it is given.
 * - `levelGenerated`, `partialStackMerge` and `packOverflowVictim` pass live
 *   game objects and have no API 2 form. Each needs a host-interpreted
 *   declaration or policy table.
 * - `artifactCommit` has no API 2 form either. Refusing a duplicate artifact
 *   needs a host policy.
 */

import type { Gen } from "@rpgm-tools/neo-angband-core";
import type { ValueAdjustContext } from "./armour-value";

/** The engine functions the staircase repair calls (stairs.ts). */
export type StairsCore = Pick<
  typeof import("@rpgm-tools/neo-angband-core"),
  | "FEAT"
  | "loc"
  | "placeStairs"
  | "squareIsEmpty"
  | "squareIsNoStairs"
  | "squareNumWallsAdjacent"
>;

/** The engine function the armour value floor calls (armour-value.ts). */
export type PricingCore = Pick<typeof import("@rpgm-tools/neo-angband-core"), "objectValueReal">;

/** The one registry facade `register()` reaches: registry:tval's `valueAdjust` table. */
export interface HostLike {
  readonly tval: {
    readonly valueAdjust: {
      set(tval: number, handler: (ctx: ValueAdjustContext) => number): void;
    };
  };
}

/**
 * The context members the plugin reads, declared structurally because this
 * repository holds no copy of the host.
 */
export interface HookCtx {
  readonly flags: Readonly<Record<string, boolean>>;
  readonly core: StairsCore & PricingCore;
  /** Emit a diagnostic line; the host decides where it goes. Present on register()'s ctx. */
  readonly log?: (msg: string) => void;
}

/** The part of a stack `partialStackMerge` reads. */
export interface StackLike {
  readonly number: number;
  readonly kind: { readonly base: { readonly maxStack: number } };
}

/** API 2 `meta`. */
export interface AdapterMeta {
  /** The resolved rule flags. API 2: `meta.flags`, and `flags` in the hook context. */
  readonly flags: Readonly<Record<string, boolean>>;
  /** API 2: `meta.log(message)`. A no-op where the host passes no `log`. */
  log(message: string): void;
}

/** No API 2 counterpart: engine values and calls a mod is not handed there. */
export interface AdapterEngine {
  /** levelGenerated staircase repair on a live Gen. API 2: a host-interpreted level-generation declaration ("every level has a reachable up and down stair"). */
  readonly stairs: StairsCore;
  /** Prices plain armour candidates inside registry:tval's valueAdjust. API 2: a host-interpreted pricing policy table (per-tval value floor). */
  readonly pricing: PricingCore;
  /** Installs a registry:tval valueAdjust handler on the live registry. API 2: the same pricing policy table, declared rather than installed. */
  setValueAdjust(host: HostLike, tval: number, handler: (adj: ValueAdjustContext) => number): void;
  /** Whether a live stack handed to partialStackMerge is at its per-stack limit. API 2: a host-interpreted stacking policy. */
  stackIsFull(obj: StackLike): boolean;
  /** The live level levelGenerated hands over, typed for the staircase repair. API 2: none; the repair becomes the level-generation declaration above. */
  level(gen: unknown): Gen;
}

export interface Adapter {
  readonly meta: AdapterMeta;
  readonly engine: AdapterEngine;
}

/** Build the adapter from the plugin context. */
export function createAdapter(ctx: HookCtx): Adapter {
  const core = ctx.core;
  return {
    meta: {
      flags: ctx.flags,
      log: (message) => ctx.log?.(message),
    },
    engine: {
      stairs: core,
      pricing: core,
      setValueAdjust: (host, tval, handler) => host.tval.valueAdjust.set(tval, handler),
      stackIsFull: (obj) => obj.number === obj.kind.base.maxStack,
      level: (gen) => gen as Gen,
    },
  };
}
