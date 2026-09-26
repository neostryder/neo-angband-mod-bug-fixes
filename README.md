# Bug Fixes

An unofficial patch set fixing bugs in upstream Angband, for
[Neo Angband](https://github.com/neostryder/neo-angband), as a mod.

**This is a mod.** It is off until you enable it, every fix inside it is a named switch
you can turn off on its own, and disabling the mod leaves the game bug-for-bug as
Angband 4.2.6 is.

![The mod manager's confirmation screen for turning the patch set on](docs/img/bugfixes-enable.jpg)

## Why this is a mod and not a better port

Neo Angband is an exact-parity port. Bugs inherited from the reference code are out of scope for the port itself and belong in this mod, and core keeps every wart of the reference code. A port that quietly fixed things would stop being a port, and you could never tell which of its behaviours were Angband's and which were someone's opinion.

So the engine reproduces each of these faults, and its test suite has control tests pinning them: move one of these fixes back into core and the suite fails and says why.

When you turn a fix off, its code is absent from the game. There is no `bugfix.*` string anywhere in the engine. A flag-gated fix compiled into core would still be core shipping the fix; core ships none of these.

## What it fixes

Each toggle covers a **class** of fixes rather than a single fix, so you can decide on each class without reading engine code. The [settings reference](SETTINGS.md) lists every flag, its default, and when a change takes effect. The diagnosis of each bug against the C source is in [BUG_FIXES.md](https://github.com/neostryder/neo-angband/blob/master/docs/modding/BUG_FIXES.md) in the main repository.

| Toggle | What it covers | What it does |
|---|---|---|
| **Text and history** (`bugfix.textAndHistory`) | Weapon lore text; [#4245](https://github.com/angband/angband/issues/4245); [#6665](https://github.com/angband/angband/issues/6665); misc. strings; lore text | Changes what the game writes down or says, and never game state. Corrects four item descriptions still written for a two-handed-weapon rule Angband 4.2 dropped (the Two-Handed Great Flail, the Pike, the Trident "of Wrath" and "Mundwine"); this is text only, with no change to damage, weight or slot. Drops a duplicate "Killed X" history entry when a unique is reached again through a shape-change or projection death path. Keeps the raw text of player notes, so a long player name cannot truncate a full `/say` note in saved history or a character dump. Corrects typos, grammar and wrong facts in 40 more descriptions of monsters, items, spells and effects. Corrects upstream's own message slips (sentence spacing, a missing full stop, capital letter or apostrophe) at the single point where messages are shown, using exact-match rows, because messages arrive already filled in and a general rewrite would edit inscriptions and names you typed. [TEXT_CHANGES.md](TEXT_CHANGES.md) lists every text change, with the upstream line each one comes from. |
| **State integrity** (`bugfix.stateIntegrity`) | [#4605](https://github.com/angband/angband/issues/4605), [#4664](https://github.com/angband/angband/issues/4664), [#4510](https://github.com/angband/angband/issues/4510), #6355, [#4666](https://github.com/angband/angband/issues/4666) | Keeps the game's own bookkeeping consistent with itself, including across a save and reload. Writes the noise and scent heatmaps to the save so monsters track you the same way after a reload. Adds a deterministic geometric tiebreak to the floor object list (nearer the top first, then leftmost), because upstream's item comparison does not produce a consistent order. Refuses to commit an object that already carries a created artifact a second time. Refuses to merge a partial stack of wands or staves into an already-full stack, which stops charges drifting between the two on repeated drop and pickup. When a pack overflow follows an inscription change, drops the item that actually left your quiver instead of an unrelated one. |
| **Level generation** (`bugfix.levelGeneration`) | reachable staircases | Anything that changes the layout you walk around in. It is a separate toggle so you can keep faithful layout without giving up the text and bookkeeping fixes. Upstream's stair placement does not exclude vault interiors, and its connectivity pass lets vaults stay disconnected at five of its six call sites, so a vault the tunneller never joined can swallow a staircase. The engine found 22 stranded levels in 15,000 (0.15%), almost always the up stair, because a level gets 3-4 down stairs against only 1-2 up, so one bad roll strands the floor. A fresh sweep here at engine 0.24.0, 520 levels across depths 5 to 90, found 4 stranded, all four the up stair. An earlier version of this section cited 10.2%; that figure was real, but most of its non-vault cases came from a defect in the port's own streamer code, since fixed in the engine. It is a rare wart. The fix places one reachable replacement stair as close to the stranded original as the rules allow. |
| **Borg Fixes** (`bugfix.borgFixes`) | Borg buff-timer bookkeeping | Corrects the Borg mod's own behaviour, not core's. The Borg mod ports upstream Angband's own autoplayer, so a defect in how it tracks its own state belongs here like everything else in this list. Checks the Borg's message-based buff tracking against the player's real buff timers as the engine reports them, so a missed or garbled message cannot leave a buff flag stuck on after the buff has expired. **Greyed out and forced off unless the Borg mod is installed**, since it has nothing to patch without it. |
| **Fix magical armour pricing below plainer armour** (`bugfix.armourValueFloor`) | [neostryder/neo-angband#179](https://github.com/neostryder/neo-angband/issues/179) | Angband 4.2.6's store-pricing formula can price an enchanted armour below a plain armour of the same class with strictly more total AC, because a point of AC from a magical to-AC bonus is priced on a flatter scale than a point of the item's base AC. A magical Studded Leather Armour (+2 AC, 14 total AC) costs 266 gold, while a plain Hard Leather Armour (16 AC, no bonus) costs 336. This fix raises an enchanted item's price to at least that of the cheapest plain item of its class with strictly more total AC, using the engine's real pricing formula on a synthetic plain object instead of a hand-written approximation. Uses the `registry:tval` capability. **Off by default**, separately from the other fixes: it changes store buy and sell prices, and a player who wants faithful 4.2.6 store economics should not have to give up the rest of this mod to keep them. |

The first four toggles default to on **once the mod is enabled**; the mod itself starts off. The armour price floor defaults to off, because it changes store economics instead of correcting a bookkeeping or layout defect. The weapon lore text corrections come under **Text and history** instead of getting their own toggle, since that toggle only answers whether the game's text is corrected, whatever the mechanism: a runtime message patch and a gamedata content patch are the same class of fix from the player's side.

### The staircase fix uses no randomness

It runs on every generated level, so if it took a single RNG draw every seed would stop
reproducing its dungeon. It takes none. A level that already satisfies the invariant
(the overwhelming majority) is bit-identical to one generated with no mod at all, and
only the stranded minority is touched, by one grid. This repository's stairs tests
ratchet that against real generated levels rather than trusting it.

## Installing

Two files: `manifest.json` and `plugin.js`. Any of:

- **In the game** - Mods -> **Install a mod...**, which fetches this repository at a
  release tag, never a branch, so what arrives cannot change under you afterwards. The
  install records a SHA-256 of every byte that arrived, which is what lets the manager
  answer later whether the copy on your machine has changed. It cannot tell you whether
  what arrived is what was published here, there being nothing to compare a first
  download against. This is the path that works in every browser, including the ones
  with no directory picker.
- **A folder** - clone this repository into your mods directory, or point the browser
  build at it with **Load mod folder**.

`plugin.js` is generated from `plugin.ts`, `stairs.ts`, `strings.ts` and `armour-value.ts` in this repository, bundled into one module. It is committed because that is what an install fetches. Edit the source, not this file. It ships unminified so you can read it before deciding whether to trust it.

## Working on it

The source and the tests live in this repository. The tests boot a **real game** against the published engine (`@rpgm-tools/neo-angband-core`) instead of a fake, so the staircase tests generate real levels at real depths; a reachability fix checked only against a hand-built cave would only show that it works on that cave.

```bash
pnpm install --frozen-lockfile
```

```bash
pnpm verify
```

That typechecks, runs the tests, and checks that the committed `plugin.js` is a current build of the source. The last check matters because an install fetches the committed `plugin.js` from a pinned tag and runs it as it is, with no rebuild on the way in. A stale build would pass every other check and still be the file players actually run, and `pnpm check` is the only step that catches it.

No checkout of the game is needed. The engine, the content pack (Angband 4.2.6 gamedata, which the tests generate levels from) and the plugin builder are all published packages, so `pnpm install --frozen-lockfile` is the whole setup, and the suite tests this mod against exactly what a third-party author would install. To develop against an engine change that has not reached the registry yet, use a sibling checkout of [neo-angband](https://github.com/neostryder/neo-angband) or set `NEO_ANGBAND_REPO` to point at one.

```bash
pnpm build     # rebuild plugin.js after editing plugin.ts
```

### Testing against an unreleased engine

By default the tests import the **published** engine from `node_modules`, which is the version a player runs; that is why the dependency is pinned rather than linked. To run against an engine change that has not shipped yet:

```bash
NEO_ANGBAND_LOCAL_CORE=1 pnpm test
```

That resolves `@rpgm-tools/neo-angband-core` to `packages/core/dist` in the sibling checkout (build it first). It is a separate variable from `NEO_ANGBAND_REPO` because nearly everyone working here already has the checkout, so keying off its presence would silently swap the engine under every run. If `NEO_ANGBAND_REPO` is set it takes precedence, and a wrong path fails instead of falling back to a checkout you did not name.

## A note on scores

A mod that changes gameplay flags the save, permanently, so a character who played with fixes does not sit in a score list beside one who did not.

## Releasing

A tag matching `vX.Y.Z` is the release; there is no separate publish step. A minor or major bump automatically posts an announcement to the RPGM Tools Discord's Neo Angband announcements forum, built from the matching [CHANGELOG.md](CHANGELOG.md) heading. A patch-only bump posts nothing.

## Questions, or something wrong

[**The RPGM Tools Discord**](https://discord.gg/YegtwbHTBQ) is the fastest way
to ask anything - whether a behaviour is intended, how to get this installed,
or what you should try next. No GitHub account needed.

[Open an issue here](https://github.com/neostryder/neo-angband-mod-bug-fixes/issues/new/choose) for a bug in **this mod**. Two
things belong against the game instead, and the forms will point you there: the
mod **system** (an install that fails, a load order that will not stick, a
conflict report that looks wrong), and the game **not matching Angband 4.2.6**
once this mod is switched off - changing the game is what a mod is for.

For anything that should not be public, including a security report:
**strider-angband (at) rpgm.tools**. See
[SECURITY.md](https://github.com/neostryder/neo-angband/blob/master/SECURITY.md).

Asking about AI use in this project? [AI_USAGE_POLICY.md](AI_USAGE_POLICY.md) is
the complete answer.

[TERMS.md](TERMS.md) covers use of this mod. The core repository's
[PRIVACY.md](https://github.com/neostryder/neo-angband/blob/master/PRIVACY.md)
covers what is stored and what network requests the game makes. Project
participation is subject to the shared [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Licence

Same dual licence as Neo Angband and Angband: GPL v2 or the Angband licence. See
[LICENSE.md](LICENSE.md).

## Credits

Built by neostryder / RPGM Tools as part of Neo Angband. The bugs are upstream
Angband's and the issue numbers are theirs; the diagnosis of each one against the C is
in the main repository at `docs/modding/BUG_FIXES.md`. Angband is the work of Ben
Harrison, James E. Wilson, Robert A. Koeneke and the Angband contributors.
