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

| Toggle | Upstream issue | What it does |
|---|---|---|
| **Unique kill history** (`bugfix.uniqueKillHistory`) | [#4245](https://github.com/angband/angband/issues/4245) | A unique reached again through a shape-change or projection death path logs a second "Killed X" entry. Drops the duplicate. |
| **Save noise and scent** (`bugfix.noiseScentSave`) | [#4605](https://github.com/angband/angband/issues/4605) | The noise and scent heatmaps are transient upstream, so monsters track you differently after a reload than they would have without one. Writes them to the save. |
| **Object list order** (`bugfix.objectListOrder`) | [#4664](https://github.com/angband/angband/issues/4664) | Upstream's `compare_items` is not a strict weak order, so the list can come out unstable. Adds a deterministic geometric tiebreak — nearer-to-top first, then leftmost. PR #4668 was closed unmerged, so there is no accepted upstream fix to port instead. |
| **Duplicate artifacts** (`bugfix.duplicateArtifact`) | [#4510](https://github.com/angband/angband/issues/4510) | An object handed to `make_artifact` that already carries an artifact skips the created-scan, so committing it again copies the data and marks it created twice. Refuses, making the artifact state the single source of truth. |
| **Reachable staircases** (`bugfix.stairsReachable`) | — | `alloc_stairs` does not exclude vault interiors and `ensure_connectedness` runs with `allow_vault_disconnect` at five of its six sites, so a vault the tunneller never joined can swallow a staircase. **Measured on this port with the fix off: 53 stranded levels in 520 (10.2%)**, overwhelmingly the up stair, 37 of them inside `SQUARE_VAULT`. Places one reachable replacement, as close to the stranded original as the rules allow. |
| **Misc. string fixes** (`bugfix.miscStrings`) | — | Upstream's own cosmetic message warts, corrected at the host's single message sink. An exact-match table on purpose: messages arrive already interpolated, so a general rewrite would edit inscriptions and names you typed. |

All six default to on **once the mod is enabled** — which is not the same as on.

### The staircase fix draws no randomness, and that is load-bearing

It runs on every generated level, so if it took a single RNG draw every seed would stop
reproducing its dungeon. It takes none. A level that already satisfies the invariant —
the overwhelming majority — is bit-identical to one generated with no mod at all, and
only the stranded minority is touched, by one grid. The main repository's tests ratchet
that rather than trusting it.

## Installing

Two files: `manifest.json` and `plugin.js`. Any of:

- **In the game** — Mods → install, once this repository has a release tag the game
  ships a digest for. That path verifies the bytes against a hash built into the game,
  so a replaced tag or an intercepted download fails rather than runs.
- **A folder** — clone this repository into your mods directory, or point the browser
  build at it with **Load mod folder**.

`plugin.js` is generated from TypeScript in the main repository
(`packages/web/mods/bug-fixes/plugin.ts` plus `stairs.ts` and `strings.ts`, bundled
into one module by `packages/web/scripts/build-mod-plugins.mjs`). It is committed here
because that is what an install fetches. Edit the source, not this file — and if you
are reading it to decide whether to trust it, that is exactly why it ships unminified.

## A note on scores

A mod that changes gameplay flags the save, permanently. That is deliberate: a
character who played with fixes Angband does not have should not sit in a score list
beside one who did not.

## Where the tests are

In the main repository — `packages/web/mods/bug-fixes/plugin.test.ts`,
`stairs.test.ts` and `strings.test.ts`, about 1200 lines — where they run on every push
against the real engine, including full level generations for the staircase fix. A
round-trip test (`packages/web/src/mod-plugin-build.test.ts`) builds this `plugin.js`,
loads it through the game's own folder loader, and checks it installs the same hooks
the in-tree copy does. Tests that travel to a repository with no engine to test against
are tests that stop running.

## Licence

Same dual licence as Neo Angband and Angband — GPL v2 or the Angband licence. See
[LICENSE.md](LICENSE.md).

## Credits

Built by neostryder / RPGM Tools as part of Neo Angband. The bugs are upstream
Angband's and the issue numbers are theirs; the diagnosis of each one against the C is
in the main repository at `docs/modding/BUG_FIXES.md`. Angband is the work of Ben
Harrison, James E. Wilson, Robert A. Koeneke and the Angband contributors.
