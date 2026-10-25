/**
 * Test support, not part of the mod: the mod's behaviour as the game's core
 * hooks, so the suites can drive a real game with it.
 *
 * The mod itself is an API 2 definition (plugin.ts). Four of its fixes have no
 * API 2 hook yet, so this file builds the core's own `ModHooks` from two
 * sources: the hooks the mod really contributes (adapted to core's hook shape),
 * and the specification code for the waiting fixes. The first source is the
 * shipped bundle; the second is what the game's additions must do.
 */

import * as neoCore from "@rpgm-tools/neo-angband-core";
import type { ModHooks } from "@rpgm-tools/neo-angband-core";
import plugin from "./plugin";
import { ensureStairsReachable } from "./stairs";
import { allowArtifactCommit, allowPartialStackMerge, packOverflowVictim } from "./waiting-rules";

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
  if (flags["bugfix.stateIntegrity"] === true) {
    hooks.artifactCommit = (_aidx, alreadyCreated): boolean => allowArtifactCommit(alreadyCreated);
    hooks.partialStackMerge = (drained): boolean => allowPartialStackMerge(drained);
    hooks.packOverflowVictim = (_state, departedQuiver): number | null => packOverflowVictim(departedQuiver);
  }
  if (flags["bugfix.levelGeneration"] === true) {
    hooks.levelGenerated = (gen, quest): boolean => ensureStairsReachable(gen as never, quest, neoCore);
  }
  return hooks;
}
