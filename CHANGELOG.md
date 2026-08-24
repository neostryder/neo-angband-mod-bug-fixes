# Changelog

All notable changes to this mod are recorded here. Versions follow the mod's own
`manifest.json`, which is what the game reads, and each released version has a
matching git tag that an install pins itself to.

An entry has to matter to somebody running the mod. Documentation wording,
internal refactoring and test-only additions are not recorded here. Bug fixes
are, however small, which for this mod is most of the file.

## 0.19.1

### Fixed

- Reverted 0.19.0's Trident 'of Wrath' spelling correction. That change cited
  an accepted upstream commit (`f1b1626f6`), which puts it in scope for the
  `upstream-catchup` mod rather than this one - this mod covers defects with
  no accepted upstream fix. The description reads "Osse" again, matching
  Angband 4.2.6's own spelling, as it did before 0.19.0.

## 0.19.0

### Fixed

- **The Trident 'of Wrath' description spells the Maia's name "Ossë" again.**
  Angband 4.2.6 spells it "Osse", and Angband corrected that after the tag
  (commit `f1b1626f6`, 2026-07-26). Core keeps the tag's spelling, so the
  correction belongs here. This mod already rewrites that same description to
  drop a two-handed-weapon rule the game no longer has, and had been carrying
  the old spelling forward with it. Joins the existing Text and history toggle
  (`bugfix.textAndHistory`) rather than adding a switch of its own.

  **Retracted in 0.19.1: this belongs in the `upstream-catchup` mod, not
  here** - see that entry.

## 0.18.2

Added a Terms of Use and a shared Code of Conduct alongside the existing
LICENSE policy, and a README screenshot of the mod's enable prompt.

## 0.18.1

### Fixed

- The development lockfile resolved a `nanoid` version covered by an npm High
  advisory (custom generators can loop indefinitely when size is zero) through
  a transitive PostCSS dependency. `nanoid` is a development-only dependency
  not reachable from any shipped code path in this mod; the lockfile now
  resolves the fixed version.

## 0.18.0

### Changed

- **The weapon-lore text corrections (Two-Handed Great Flail, Pike, Trident "of
  Wrath" and "Mundwine") now honor the Text and history toggle
  (`bugfix.textAndHistory`) instead of always applying.** They were previously
  filed under their own section with no flag of its own, on the reasoning that
  four sentences were too minor to be worth a switch. A player who turns off
  Text and history now also reverts these four descriptions to upstream's
  wording, matching every other textual correction this mod makes: whether the
  game's text is being corrected is one decision, not several.

## 0.17.0

### Added

- **Two Tolkien-lore text corrections join the Text and history toggle.** The
  Priest spell Light of Manwë is renamed Light of Varda, and the blessed melee
  property's description changes "the gods" to "the Valar". Reported by
  `u/Dranikos`.

## 0.16.2

### Fixed

- **`manifest.json`'s own Level generation toggle still cited the old 10% figure.**
  0.16.1 corrected the README, `stairs.ts` and `plugin.ts` to the engine-measured
  0.15%, but missed the same sentence in the manifest description the player
  actually reads when deciding whether to turn the toggle on.

## 0.16.1

### Fixed

- **The Level generation section claimed the defect it repairs is 13 times more
  common than it is.** The README, `stairs.ts` and `plugin.ts` all cited 10.2% of
  floors, 53 stranded in 520, measured when this repository was created. The
  engine has since measured the same thing over 15,000 levels and found 22, or
  0.15%, all of them carrying the mechanism's signature. The old figure was real
  and did not describe inherited behaviour: its non-vault majority was the port's
  own streamer code bricking up secret doors, since fixed in the engine. A fresh
  sweep of 520 levels across depths 5 to 90 at engine 0.24.0 found 4 stranded,
  all four the up stair, which is consistent with the engine's number.
- What the section does is unchanged, and so is the reason to have it: a stranded
  floor is unwinnable without a scroll or a tunnel. It is a rare wart rather than
  a common one, and the toggle a player is deciding about now says so.

### Changed

- `plugin.js` is byte-identical to 0.16.0. All three corrections are comments or
  prose, and the build strips comments.

## 0.16.0

### Added

- **Text corrections**, a new section, on by default. Angband 4.2 has one weapon
  slot and no two-handed rule, so nothing stops a character wielding a Pike and a
  shield, and four gamedata descriptions still say otherwise: the Two-Handed
  Great Flail, the Pike, the Trident of Wrath and Mundwine. The core game keeps
  upstream's text exactly, so the correction lives here. Text only, and no
  weapon's damage, weight or slot changes.
- The section owns the whole class of defect, "the description says something the
  game no longer does", so a future correction joins it rather than adding
  another row to the options menu.
- The test derives each record reference from the real content pack rather than
  mirroring the naming rules, and asserts both directions: that the core game
  still makes the claim, and that the replacement drops it. Without the first
  half this would keep passing after core dropped the wording on its own, leaving
  a section advertising a fix it no longer performs.

### Fixed

- The install section claimed the game checks every file against a SHA-256 that
  ships inside it, and that a replaced tag or an intercepted download therefore
  fails rather than runs. The game does not do that. It records a digest of the
  bytes that arrived, which answers whether the copy on your machine has changed
  since it was installed, and cannot answer whether what arrived is what was
  published here. What the install does give is a pinned tag rather than a branch,
  so what arrived cannot change under you afterwards.
- The build section said the game's content pack and plugin builder come from a
  checkout of the game rather than from npm. Both have been published packages
  since 0.12.0, so `npm ci` is the whole setup. A sibling checkout is an override
  for developing against an engine change that has not reached the registry yet,
  and the builder's own documentation had the same order backwards.

### Changed

- Tested against engine and content 0.24.0 rather than 0.19.0. A mod tested
  against an engine five release lines older than the one it installs onto has
  been tested against the wrong thing.
- The four pinned stranded-floor seeds were re-measured and replaced. Two came
  back healthy under 0.24.0's level generation and a third changed direction,
  which is the staleness this table has always been expected to accumulate. Only
  the control assertion can detect it, because a healthy floor passes the repair
  assertion trivially, so three of the four rows had quietly stopped testing
  anything. Each replacement is measured in both directions, and spares are
  recorded next to the table so the next reseal needs no scan.

## 0.15.0 - 2026-08-15

### Fixed

- **The miscellaneous-strings toggle described itself backwards.** Its
  player-facing description said 38 messages put two spaces after a sentence
  which it collapsed to one, and gave an example. The table does the opposite: it
  holds four rows, each normalising a single space up to the double space Angband
  4.2.6 uses everywhere else, and the quoted example was not one of them. Three
  wrong facts in the one paragraph most players will ever read about this fix. A
  test now reads the row count out of the table and requires the description to
  name it, rejects the word that described the wrong direction, and checks that
  every quoted example is a real key.

### Changed

- **Six per-bug toggles became three, one per class of fix.** Choosing between
  individual defects in the C original is not a question a player can answer.
  They are now "Text and history fixes", "State integrity fixes" and "Level
  generation fixes", which is the question somebody actually has, and a whole
  class can still be switched off.
- A player who had set one of the six retired flags keeps their choice. The
  retirement is declared to the host's rule-flag rename mechanism, which folds
  the old flags into the new one with the same meaning: a class comes up on if
  anything in it was on. Turning a fix off by default would reintroduce a bug the
  player had deliberately removed, which is the larger surprise of the two.

## 0.14.0 - 2026-08-06

### Added

- `manifest.json` declares its `repository`. This is the field an import reads:
  install the mod from a `.zip` and the copy on disk pins itself to the
  repository its own manifest names. Without it an imported copy binds to
  `file:import`, and the update check has no repository to ask, so the one
  install route that does not start at a repository produced the one copy that
  could never be updated.

### Changed

- `author` is `neostryder` rather than `neostryder (RPGM Tools)`. The mod list
  already trimmed the parenthesis, and the detail pane printed the full string,
  where it read as two names for one person.

## 0.13.0 - 2026-08-01

### Changed

- The description is rewritten as short paragraphs. The previous one was long
  enough to squeeze the mod manager's list down to a single visible row with no
  way to scroll it. Nothing about what the mod does changed. The manager's own
  half of that problem is fixed in the game: the pane is capped, and a "Read the
  full description" row opens the whole thing in a viewer that scrolls.

## 0.12.0 - 2026-08-01

### Changed

- The gamedata and the plugin builder come from npm rather than from a sibling
  checkout of the game. The test suite now proves this mod against exactly what a
  third-party author would install, and `plugin.js` is built from a pinned copy
  of the builder rather than from whatever is in a neighbouring working tree,
  which is how a shipped artefact stops being reproducible.

## 0.11.0 - 2026-07-31

### Fixed

- `engine` was `4.2.x`, the upstream Angband baseline this port tracks, in a field
  that ranges over the port's own version. The game never evaluated the field, so
  the mistake was invisible; it does now, and the manifest as written would be
  refused, which means installing this mod from a fresh game would have failed.
  Now `>=0.10.0`, kept permissive on purpose: `modApi` is the exact-match gate for
  the plugin ABI, which is what makes a loose engine range the right shape here.

## 0.10.0 - 2026-07-31

### Changed

- **The mod is no longer bundled inside the game, and its source lives here.**
  The game used to ship this mod inside its own build with only the built
  `plugin.js` copied to this repository, which made this repository a publishing
  target rather than the mod's home: nothing here could be built, tested or
  typechecked on its own. The repository root is the mod folder, so
  `manifest.json` and `plugin.js` sit beside the source they come from, which is
  the pair the game fetches.
- The version was `1.0.0`, ahead of a game at `0.10.0`, and the description still
  called the mod bundled. Both corrected.

### Fixed

- The mod had never been typechecked. Its previous home was outside the game's
  `tsconfig` include list, so it was transpiled, which strips types without
  checking them. A reference to a type with no import had been sitting in the
  test the whole time.
