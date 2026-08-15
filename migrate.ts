/**
 * Bag-schema migration for the bug-fixes mod: six atomic fix flags (schema 0)
 * folded into three player-facing class toggles (schema 1).
 *
 * The host drives this through core's migrateModBag at mod-load time when the
 * mod's saveSchema has advanced past the bag's. See plugin.ts migrateBag.
 */

import type { JsonValue } from "@rpgm-tools/neo-angband-core";

/**
 * Bag schema this version of the mod writes and expects.
 *
 * Schema 0 (every release before the class-toggle regroup): bag `data` is a
 * plain map of the six atomic fix flags to booleans - the player's per-fix
 * choices. Schema 1: the same idea, but three class flags only.
 */
export const BUGFIX_SAVE_SCHEMA = 1;

/** Schema-0 atomic flags folded into bugfix.textAndHistory. */
export const SCHEMA0_TEXT_AND_HISTORY = [
  "bugfix.uniqueKillHistory",
  "bugfix.miscStrings",
] as const;

/** Schema-0 atomic flags folded into bugfix.stateIntegrity. */
export const SCHEMA0_STATE_INTEGRITY = [
  "bugfix.noiseScentSave",
  "bugfix.objectListOrder",
  "bugfix.duplicateArtifact",
] as const;

/** Schema-0 atomic flags folded into bugfix.levelGeneration. */
export const SCHEMA0_LEVEL_GENERATION = ["bugfix.stairsReachable"] as const;

/**
 * Fold a class's old atomic values into the single class toggle.
 *
 * MIXED-STATE RULE: OR - the class is ON if any constituent was ON.
 *
 * A player who had a class's fixes in mixed states (e.g. uniqueKillHistory on,
 * miscStrings off) cannot keep both choices under one toggle. Prefer OR over
 * AND: opting into any fix in the class is a positive preference for that class
 * of correction, and silently turning OFF a fix they had enabled would
 * reintroduce a bug they had already chosen to remove. Re-enabling a sibling
 * they had off is the smaller surprise for a bug-fix mod whose defaults are
 * all on; they can still turn the whole class off.
 */
export function foldClassFlag(values: readonly boolean[]): boolean {
  return values.some((v) => v === true);
}

function readOldFlag(
  data: Readonly<Record<string, unknown>>,
  flag: string,
): boolean {
  return data[flag] === true;
}

/**
 * Rewrite this mod's own bag data from an older saveSchema to the current one.
 *
 * Pure: the host drives it through core's migrateModBag at mod-load time. Schema
 * 0 bags hold the six atomic flags; schema 1 holds the three class flags. Unknown
 * or non-object data becomes an empty map of class flags (all off in the bag -
 * the host still applies manifest defaults for any flag absent from rule choices).
 */
export function migrateBugFixBagData(
  data: unknown,
  fromSchema: number,
): JsonValue {
  if (fromSchema >= BUGFIX_SAVE_SCHEMA) {
    return (data ?? {}) as JsonValue;
  }
  const old =
    data !== null && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
  return {
    "bugfix.textAndHistory": foldClassFlag(
      SCHEMA0_TEXT_AND_HISTORY.map((f) => readOldFlag(old, f)),
    ),
    "bugfix.stateIntegrity": foldClassFlag(
      SCHEMA0_STATE_INTEGRITY.map((f) => readOldFlag(old, f)),
    ),
    "bugfix.levelGeneration": foldClassFlag(
      SCHEMA0_LEVEL_GENERATION.map((f) => readOldFlag(old, f)),
    ),
  };
}
