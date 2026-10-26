// bug-fixes - generated from plugin.ts by neo-angband-mod-build
// (@rpgm-tools/neo-angband-mod-sdk). Edit the TypeScript source, not this file.

// history.ts
function expandRawUserNote(entry, playerName) {
  if (entry.expandUserInput !== true) return entry.what;
  if (entry.what.startsWith("/say ")) return `-- ${playerName} says: "${entry.what.slice(5)}"`;
  if (entry.what.startsWith("/me")) return `-- ${playerName}${entry.what.slice(3)}`;
  return `-- Note: ${entry.what}`;
}

// stairs.ts
function stairWalkable(c, grid) {
  return c.isPassable(grid) || c.isDoor(grid) || c.isRubble(grid);
}
function stairDirs(core) {
  const { loc } = core;
  return [
    loc(0, 1),
    loc(0, -1),
    loc(1, 0),
    loc(-1, 0),
    loc(1, 1),
    loc(-1, 1),
    loc(1, -1),
    loc(-1, -1)
  ];
}
function walkableRegion(c, start, core) {
  const { loc } = core;
  const dirs = stairDirs(core);
  const seen = new Uint8Array(c.width * c.height);
  const stack = [start];
  seen[start.y * c.width + start.x] = 1;
  while (stack.length > 0) {
    const cur = stack.pop();
    for (const dir of dirs) {
      const n = loc(cur.x + dir.x, cur.y + dir.y);
      if (!c.inBounds(n)) continue;
      const idx = n.y * c.width + n.x;
      if (seen[idx] || !stairWalkable(c, n)) continue;
      seen[idx] = 1;
      stack.push(n);
    }
  }
  return seen;
}
function findReachableStairSpot(g, seen, near, core) {
  const { loc, squareIsEmpty, squareIsNoStairs, squareNumWallsAdjacent } = core;
  const c = g.c;
  const player = g.playerSpot;
  for (let walls = 3; walls >= 0; walls--) {
    let best = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let y = 1; y <= c.height - 2; y++) {
      for (let x = 1; x <= c.width - 2; x++) {
        if (!seen[y * c.width + x]) continue;
        const grid = loc(x, y);
        if (player && grid.x === player.x && grid.y === player.y) continue;
        if (!squareIsEmpty(g, grid)) continue;
        if (squareIsNoStairs(c, grid)) continue;
        if (squareNumWallsAdjacent(c, grid) !== walls) continue;
        const dy = y - near.y;
        const dx = x - near.x;
        const dist = dy * dy + dx * dx;
        if (dist < bestDist) {
          bestDist = dist;
          best = grid;
        }
      }
    }
    if (best) return best;
  }
  return null;
}
function ensureStairsReachable(g, quest, core) {
  const { FEAT, loc, placeStairs, squareIsEmpty, squareIsNoStairs } = core;
  const c = g.c;
  const start = g.playerSpot;
  if (!start) return true;
  if (!stairWalkable(c, start)) return false;
  const seen = walkableRegion(c, start, core);
  for (const feat of [FEAT.MORE, FEAT.LESS]) {
    let total = 0;
    let reached = 0;
    let stranded = null;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const grid = loc(x, y);
        if (c.feat(grid) !== feat) continue;
        total++;
        if (seen[y * c.width + x]) reached++;
        else if (!stranded) stranded = grid;
      }
    }
    if (total === 0 || reached > 0) continue;
    let spot = findReachableStairSpot(g, seen, stranded ?? start, core);
    if (!spot && squareIsEmpty(g, start) && !squareIsNoStairs(c, start)) {
      spot = start;
    }
    if (!spot) return false;
    placeStairs(g, spot, quest, feat);
    if (c.feat(spot) !== feat) return false;
  }
  return true;
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

// state-rules.ts
function allowPartialStackMerge(drained) {
  return drained.number !== drained.kind.base.maxStack;
}
function packOverflowVictim(departedQuiver) {
  return departedQuiver;
}
function allowArtifactCommit(alreadyCreated) {
  return !alreadyCreated;
}

// plugin.ts
var ARMOUR_TVALS = [10, 11, 12, 13, 14, 15, 16, 17, 18];
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
  /*
   * The hooks API 2 has no form for: the game's own members, called with live
   * arguments. Each one is declared only while its flag is on.
   */
  engineHooks({ flags, engine }) {
    const hooks = {};
    if (flags["bugfix.levelGeneration"] === true) {
      hooks["levelGenerated"] = (gen, quest) => ensureStairsReachable(gen, quest, engine.core);
    }
    if (flags["bugfix.stateIntegrity"] === true) {
      hooks["artifactCommit"] = (_aidx, alreadyCreated) => allowArtifactCommit(alreadyCreated);
      hooks["partialStackMerge"] = (drained) => allowPartialStackMerge(drained);
      hooks["packOverflowVictim"] = (_state, departedQuiver) => packOverflowVictim(departedQuiver);
    }
    return hooks;
  },
  start(mod) {
    if (mod.meta.flags["bugfix.armourValueFloor"] === true) mod.meta.log("armour value floor declared (#179)");
  }
};
export {
  plugin_default as default
};
