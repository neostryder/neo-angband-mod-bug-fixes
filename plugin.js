// bug-fixes - generated from plugin.ts by neo-angband-mod-build
// (@rpgm-tools/neo-angband-mod-sdk). Edit the TypeScript source, not this file.

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
  /* effect-handler-general.c: its three sibling messages ("Bad effect
   * description passed to effect_info().  Please report this bug." and friends)
   * are double-spaced, so this one is a slip and not a house style. */
  "Bad effect passed to effect_do(). Please report this bug.": "Bad effect passed to effect_do().  Please report this bug.",
  /* effect-handler-general.c, EARTHQUAKE. */
  "The ground shakes! The ceiling caves in!": "The ground shakes!  The ceiling caves in!",
  /* mon-make.c place_new_monster_one's allocation failure. */
  "Warning! Could not allocate a new monster.": "Warning!  Could not allocate a new monster.",
  /* effect-handler-general.c, the unresisted cold branch. */
  "Oops! It feels deathly cold!": "Oops!  It feels deathly cold!"
};
function miscStringFix(text) {
  return MISC_STRING_CORRECTIONS[text] ?? text;
}

// plugin.ts
var plugin_default = {
  api: 1,
  hooks(ctx) {
    const { flags, core } = ctx;
    const hooks = {};
    if (flags["bugfix.textAndHistory"] === true) {
      hooks.historyAdd = (entry) => !entry.duplicate;
      hooks.messageText = (raw) => miscStringFix(raw);
    }
    if (flags["bugfix.stateIntegrity"] === true) {
      hooks.saveNoiseScent = () => true;
      hooks.objectListTiebreak = (a, b) => Math.sign(a.dy - b.dy) || Math.sign(a.dx - b.dx);
      hooks.artifactCommit = (_aidx, alreadyCreated) => !alreadyCreated;
    }
    if (flags["bugfix.levelGeneration"] === true) {
      hooks.levelGenerated = (gen, quest) => ensureStairsReachable(gen, quest, core);
    }
    return hooks;
  }
};
export {
  plugin_default as default
};
