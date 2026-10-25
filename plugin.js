// bug-fixes - generated from plugin.ts by neo-angband-mod-build
// (@rpgm-tools/neo-angband-mod-sdk). Edit the TypeScript source, not this file.

// history.ts
function expandRawUserNote(entry, playerName) {
  if (entry.expandUserInput !== true) return entry.what;
  if (entry.what.startsWith("/say ")) return `-- ${playerName} says: "${entry.what.slice(5)}"`;
  if (entry.what.startsWith("/me")) return `-- ${playerName}${entry.what.slice(3)}`;
  return `-- Note: ${entry.what}`;
}

// strings.ts
var MISC_STRING_CORRECTIONS = {
  /* effects.c, effect_do(): its sibling messages ("Bad effect description
   * passed to effect_info().  Please report this bug." in effects-info.c and
   * friends) are double-spaced, so this one is a slip and not a house style. */
  "Bad effect passed to effect_do(). Please report this bug.": "Bad effect passed to effect_do().  Please report this bug.",
  /* effect-handler-attack.c, EARTHQUAKE. */
  "The ground shakes! The ceiling caves in!": "The ground shakes!  The ceiling caves in!",
  /* mon-make.c place_new_monster_one's allocation failure. */
  "Warning! Could not allocate a new monster.": "Warning!  Could not allocate a new monster.",
  /* obj-gear.c, wielding an item with a sticky curse. */
  "Oops! It feels deathly cold!": "Oops!  It feels deathly cold!"
};
function miscStringFix(text) {
  return MISC_STRING_CORRECTIONS[text] ?? text;
}
var MESSAGE_CORRECTIONS = {
  /* cmd-cave.c, taking a down staircase on the deepest level. */
  "The dungeon does not appear to extend deeper": "The dungeon does not appear to extend deeper.",
  /* cmd-obj.c, using an item whose effect cannot run right now. */
  "The item cannot be used at the moment": "The item cannot be used at the moment.",
  /* ui-game.c, the lore and death saves failing. */
  "lore save failed!": "Lore save failed!",
  "death save failed!": "Death save failed!"
};
var MESSAGE_FORMAT_CORRECTIONS = [
  /* effect-handler-general.c, turning an item with too little energy into mana. */
  ["That %s had no useable energy", "That %s had no useable energy."],
  /* mon-util.c, a thief's gold steal. */
  ["You steal %d gold pieces worth of treasure.", "You steal %d gold pieces' worth of treasure."]
];
var escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
function formatPattern(format) {
  const body = format.split(/(%[sd])/u).map((part) => part === "%s" ? "(.+?)" : part === "%d" ? "(-?\\d+)" : escapeRegExp(part)).join("");
  return new RegExp(`^${body}$`, "u");
}
var FORMAT_ROWS = MESSAGE_FORMAT_CORRECTIONS.map(([from, to]) => ({ re: formatPattern(from), to }));
function refill(format, values) {
  let i = 0;
  return format.replace(/%[sd]/gu, () => values[i++] ?? "");
}
function textAndHistoryMessage(text) {
  const spaced = miscStringFix(text);
  const exact = MESSAGE_CORRECTIONS[spaced];
  if (exact !== void 0) return exact;
  for (const row of FORMAT_ROWS) {
    const m = row.re.exec(spaced);
    if (m) return refill(row.to, m.slice(1));
  }
  return spaced;
}

// plugin.ts
var ARMOUR_TVALS = [10, 11, 12, 13, 14, 15, 16, 17, 18];
var WAITING = {
  "bugfix.levelGeneration": ["BF-1", "staircase repair (levelGenerated)"]
};
var WAITING_STATE_INTEGRITY = [
  ["BF-2", "partial-stack merge guard (partialStackMerge, #6355 residual)"],
  ["BF-3", "pack-overflow redirect (packOverflowVictim, #4666)"],
  ["BF-4", "duplicate-artifact guard (artifactCommit, #4510)"]
];
var plugin_default = {
  api: ">=2.0.0 <3.0.0",
  hooks({ flags }) {
    const hooks = {};
    if (flags["bugfix.textAndHistory"] === true) {
      hooks.historyAdd = (entry) => {
        if (entry.duplicate) return { keep: false };
        if (entry.rawUserInput !== void 0) {
          return { keep: true, what: entry.rawUserInput, expandUserInput: true };
        }
        return { keep: true };
      };
      hooks.historyDisplay = expandRawUserNote;
      hooks.messageText = textAndHistoryMessage;
    }
    if (flags["bugfix.stateIntegrity"] === true) {
      hooks.saveNoiseScent = () => true;
      hooks.objectListTiebreak = (a, b) => Math.sign(a.dy - b.dy) || Math.sign(a.dx - b.dx);
    }
    return hooks;
  },
  policies({ flags }) {
    if (flags["bugfix.armourValueFloor"] !== true) return void 0;
    return {
      valueFloor: {
        kind: "valueFloor",
        tvals: ARMOUR_TVALS,
        appliesTo: "egoOrPositiveToA",
        comparison: "cheapestPlainSameTvalWithStrictlyGreaterAc",
        price: "objectValueReal"
      }
    };
  },
  start(mod) {
    const flags = mod.meta.flags;
    for (const [flag, [row, what]] of Object.entries(WAITING)) {
      if (flags[flag] === true) mod.meta.log(`${what} is on, but this game cannot apply it yet (gap ${row}), so it changes nothing`);
    }
    if (flags["bugfix.stateIntegrity"] === true) {
      for (const [row, what] of WAITING_STATE_INTEGRITY) {
        mod.meta.log(`${what} is on, but this game cannot apply it yet (gap ${row}), so it changes nothing`);
      }
    }
    if (flags["bugfix.armourValueFloor"] === true) mod.meta.log("armour value floor declared (#179)");
  }
};
export {
  plugin_default as default
};
