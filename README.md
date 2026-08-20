# bug-fixes — an unofficial patch set

Fixes for bugs in upstream Angband, for
[Neo Angband](https://github.com/neostryder/neo-angband), as a mod.

**This is a mod.** It is off until you enable it, every fix inside it is a named switch
you can turn off on its own, and disabling the mod leaves the game bug-for-bug as
Angband 4.2.6 is.

## Why this is a mod and not a better port

Neo Angband is an exact-parity port. Its rule, in the owner's words: *"We can't fix
bugs in the port. Those will belong in the bug fixes mod... Core must retain all warts
of the reference code."* A port that quietly fixed things would stop being a port —
and worse, you could never tell which of its behaviours were Angband's and which were
someone's opinion.

So the engine reproduces each of these faults, on purpose, and the engine's own test
suite has CONTROL tests pinning them: move one of these fixes back into core and the
suite fails and says why.

Every fix here is also *absent* rather than switched off when you turn it off. There is
no `bugfix.*` string anywhere in the engine. A flag-gated fix compiled into core would
still be core shipping the fix; this ships nothing.

## What it fixes

One player-facing toggle per **class** of fix — not one per atomic fix. A player
can reason about each class without reading engine code.

| Toggle | What it covers | What it does |
|---|---|---|
| **Text and history** (`bugfix.textAndHistory`) | [#4245](https://github.com/angband/angband/issues/4245); misc. strings | What the game writes down or says — no game state changes. Drops a duplicate "Killed X" history entry when a unique is reached again through a shape-change or projection death path. Corrects upstream's own cosmetic message warts at the host's single message sink (exact-match table on purpose: messages arrive already interpolated, so a general rewrite would edit inscriptions and names you typed). |
| **State integrity** (`bugfix.stateIntegrity`) | [#4605](https://github.com/angband/angband/issues/4605), [#4664](https://github.com/angband/angband/issues/4664), [#4510](https://github.com/angband/angband/issues/4510) | The game's own bookkeeping staying consistent with itself, including across a save and reload. Writes the noise and scent heatmaps to the save so monsters track you identically after a reload. Adds a deterministic geometric tiebreak to the floor object list — nearer-to-top first, then leftmost — because upstream's `compare_items` is not a strict weak order. Refuses to commit an object that already carries a created artifact a second time. |
| **Level generation** (`bugfix.levelGeneration`) | reachable staircases | Anything that changes the layout a player walks around in — kept separate so a player who wants faithful layout is not forced to also give up the text and bookkeeping fixes. `alloc_stairs` does not exclude vault interiors and `ensure_connectedness` runs with `allow_vault_disconnect` at five of its six sites, so a vault the tunneller never joined can swallow a staircase. **Measured on this port with the fix off: 53 stranded levels in 520 (10.2%)**, overwhelmingly the up stair, 37 of them inside `SQUARE_VAULT`. Places one reachable replacement, as close to the stranded original as the rules allow. |

All three default to on **once the mod is enabled** — which is not the same as on.

### The staircase fix draws no randomness, and that is load-bearing

It runs on every generated level, so if it took a single RNG draw every seed would stop
reproducing its dungeon. It takes none. A level that already satisfies the invariant —
the overwhelming majority — is bit-identical to one generated with no mod at all, and
only the stranded minority is touched, by one grid. This repository's stairs tests
ratchet that against real generated levels rather than trusting it.

## Installing

Two files: `manifest.json` and `plugin.js`. Any of:

- **In the game** — Mods → **Install a mod...**, which fetches this repository at a
  release tag and checks every file against a SHA-256 that ships inside the game. A
  replaced tag or an intercepted download fails rather than runs. This is the path that
  works in every browser, including the ones with no directory picker.
- **A folder** — clone this repository into your mods directory, or point the browser
  build at it with **Load mod folder**.

`plugin.js` is generated from `plugin.ts`, `stairs.ts` and `strings.ts` in this
repository, bundled into one module. It is committed because
that is what an install fetches. Edit the source, not this file — and if you are
reading it to decide whether to trust it, that is exactly why it ships unminified.

## Working on it

The source lives here now, and so do the tests. They boot a **real game** against the
published engine (`@rpgm-tools/neo-angband-core`) rather than a fake, because a
staircase-reachability fix proven against a hand-built cave is a fix proven against a
fixture — the staircase tests generate real levels at real depths.

```bash
npm install
```

```bash
npm run verify
```

That typechecks, runs the tests, and confirms the committed `plugin.js` is a current
build of the source — the last one matters more than it looks. The catalogue's SHA-256
is taken **from** `plugin.js`, so a stale artefact verifies perfectly and is the file
players actually run.

One external dependency, and it is a checkout rather than a package: the game's content
pack (Angband 4.2.6 gamedata, which the tests generate levels from) and the plugin
builder both live in the game's repository. Clone
[neo-angband](https://github.com/neostryder/neo-angband) as a sibling of this
directory, or set `NEO_ANGBAND_REPO` to where it already is. The engine itself comes
from npm; only the pack and the build tool need the checkout.

```bash
npm run build     # rebuild plugin.js after editing plugin.ts
```

### Testing against an unreleased engine

By default the tests import the **published** engine from `node_modules` - the
version a player runs, which is the right default and the reason the dependency
is pinned rather than linked. When you need to run against an engine change that
has not shipped yet:

```bash
NEO_ANGBAND_LOCAL_CORE=1 npm test
```

That resolves `@rpgm-tools/neo-angband-core` to `packages/core/dist` in the sibling
checkout (build it first). It is a separate variable from `NEO_ANGBAND_REPO` on
purpose: nearly everyone here has the checkout already, so keying off its presence
would silently swap the engine under every run. If `NEO_ANGBAND_REPO` is set it is
authoritative - a wrong path fails rather than falling back to a checkout you did
not name.

## A note on scores

A mod that changes gameplay flags the save, permanently. That is deliberate: a
character who played with fixes Angband does not have should not sit in a score list
beside one who did not.

## Questions, or something wrong

[**The RPGM Tools Discord**](https://discord.gg/YegtwbHTBQ) is the fastest way
to ask anything - whether a behaviour is intended, how to get this installed,
or what you should try next. No GitHub account needed.

[Open an issue here](../../issues/new/choose) for a bug in **this mod**. Two
things belong against the game instead, and the forms will point you there: the
mod **system** (an install that fails, a load order that will not stick, a
conflict report that looks wrong), and the game **not matching Angband 4.2.6**
once this mod is switched off - changing the game is what a mod is for.

For anything that should not be public, including a security report:
**strider-angband (at) rpgm.tools**. See
[SECURITY.md](https://github.com/neostryder/neo-angband/blob/master/SECURITY.md).

Asking about AI use in this project? [AI_USAGE_POLICY.md](https://github.com/neostryder/neo-angband/blob/master/AI_USAGE_POLICY.md)
in the main repository is the complete answer.

## Licence

Same dual licence as Neo Angband and Angband — GPL v2 or the Angband licence. See
[LICENSE.md](LICENSE.md).

## Credits

Built by neostryder / RPGM Tools as part of Neo Angband. The bugs are upstream
Angband's and the issue numbers are theirs; the diagnosis of each one against the C is
in the main repository at `docs/modding/BUG_FIXES.md`. Angband is the work of Ben
Harrison, James E. Wilson, Robert A. Koeneke and the Angband contributors.
