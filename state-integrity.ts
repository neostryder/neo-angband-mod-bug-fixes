/**
 * neostryder/neo-angband#115 and #116: two new core seams, one per residual
 * defect docs/modding/BUG_FIXES.md entries 3 and 11 track.
 *
 * The local type mirrors the two new core seams because the published core
 * version used to develop this mod predates them - the same reason history.ts
 * carries its own mirror for the raw-note seams. The plugin is compiled
 * against the public ModHooks type at release time; keeping this small
 * structural boundary here lets the mod's typecheck stay useful while its
 * tests exercise the built engine carrying the new API. `GameObject` and
 * `GameState` are not mirrored - the published core already exports both, and
 * only the two new ModHooks MEMBERS are missing from it.
 */

import type { GameObject, GameState } from "@rpgm-tools/neo-angband-core";

/** The two new members added to the core ModHooks surface. */
export interface StateIntegritySeamHooks {
  /**
   * combinePack's uneven-stack merge (game/gear.ts): whether the SOURCE stack
   * `drained` is allowed to be shrunk to top up `receiving`. Faithful core
   * proceeds unconditionally.
   */
  partialStackMerge?: (drained: GameObject, receiving: GameObject) => boolean;
  /**
   * packOverflow's NULL-victim path (game/obj-cmd.ts): which handle to shed
   * when the caller passed no explicit victim. `departedQuiver` is the one
   * handle that just left GameState.gear.quiver, or null when nothing did.
   * Faithful core sheds the trailing gear.inven[] entry.
   */
  packOverflowVictim?: (state: GameState, departedQuiver: number | null) => number | null;
}
