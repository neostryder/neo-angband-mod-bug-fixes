/**
 * Test support, not part of the mod: the mod's behaviour as the game's core
 * hooks, so the suites can drive a real game with it.
 *
 * The mod itself is an API 2 definition (plugin.ts). This file builds the
 * core's own `ModHooks` from what the mod really contributes: its `hooks`
 * (adapted to core's hook shape) and its `engineHooks`, which are the game's own
 * members and need no adapting.
 */

import * as neoCore from "@rpgm-tools/neo-angband-core";
import type { ModHooks } from "@rpgm-tools/neo-angband-core";
import plugin from "./plugin";

export function specHooks(flags: Readonly<Record<string, boolean>>): ModHooks {
  const real = plugin.hooks({ id: "bug-fixes", flags }) ?? {};
  const hooks: ModHooks = {};
  if (real.messageText) hooks.messageText = real.messageText;
  if (real.historyDisplay) hooks.historyDisplay = real.historyDisplay;
  if (real.saveNoiseScent) hooks.saveNoiseScent = real.saveNoiseScent;
  if (real.objectListTiebreak) hooks.objectListTiebreak = real.objectListTiebreak;
  if (real.historyAdd) {
    const decide = real.historyAdd;
    hooks.historyAdd = (entry): boolean => {
      const decision = decide(entry);
      if (decision.what !== undefined) entry.what = decision.what;
      if (decision.expandUserInput !== undefined) entry.expandUserInput = decision.expandUserInput;
      return decision.keep;
    };
  }
  /* The game's own members, as the game asks for them: with the engine in hand. */
  const own = (plugin.engineHooks?.({ id: "bug-fixes", flags, engine: { api: "1", core: neoCore, state: undefined, registries: undefined, registry: undefined } }) ?? {}) as Record<string, unknown>;
  for (const name of ["artifactCommit", "partialStackMerge", "packOverflowVictim", "levelGenerated"] as const) {
    if (own[name] !== undefined) (hooks as Record<string, unknown>)[name] = own[name];
  }
  return hooks;
}
