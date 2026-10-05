import type { Api2HookContext, Api2Hooks, ModApi2 } from "@rpgm-tools/neo-angband-mod-sdk";
import type { Adapter } from "./core-adapter";
import { expandRawUserNote } from "./history";
import { textAndHistoryMessage } from "./strings";

export function createAdapter(mod: ModApi2): Pick<Adapter, "meta"> {
  return {
    meta: {
      flags: mod.meta.flags,
      log: (message) => mod.meta.log(message),
    },
  };
}

/** Hook composition precedes start(), so these rules use only the composition flags. */
export function createHooks({ flags }: Api2HookContext): Api2Hooks {
  const hooks: Api2Hooks = {};
  if (flags["bugfix.textAndHistory"] === true) {
    hooks.messageText = textAndHistoryMessage;
    hooks.historyAdd = (entry) => {
      if (entry.duplicate) return { keep: false };
      if (entry.rawUserInput !== undefined) {
        return { keep: true, what: entry.rawUserInput, expandUserInput: true };
      }
      return { keep: true };
    };
    hooks.historyDisplay = expandRawUserNote;
  }
  if (flags["bugfix.stateIntegrity"] === true) {
    hooks.saveNoiseScent = () => true;
    hooks.objectListTiebreak = (a, b) =>
      Math.sign(a.dy - b.dy) || Math.sign(a.dx - b.dx);
  }
  return hooks;
}
