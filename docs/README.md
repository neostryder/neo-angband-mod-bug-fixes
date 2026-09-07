# Bug Fixes: quick reference

Opt-in fixes for bugs in Angband 4.2.6, in the model of an unofficial patch.

This page is the short version: every setting, what the mod asks the game for,
and where the longer material is. The account of why each of these exists is in
[the repository README](../README.md).

## Settings

Each one is a named toggle on the game's own Mods screen, which shows the full
description. The identifier is the name a save and another mod see; where a
switch has no flag of its own, the game knows it by its section id instead.

| Setting | Identifier | Default | What it does |
| --- | --- | --- | --- |
| State integrity fixes | `bugfix.stateIntegrity` | on | The game's own bookkeeping staying consistent with itself, including across a save and reload. |
| Level generation fixes | `bugfix.levelGeneration` | on | Anything that changes the layout a player walks around in. |
| Text and history fixes | `bugfix.textAndHistory` | on | Item and monster descriptions, and anything else the game writes down or says, that say something the game no longer does or no longer means - no game state changes. |
| Borg Fixes | `bugfix.borgFixes` | on | Corrections to the Borg's own bookkeeping - the Borg mod ports upstream Angband's own autoplayer, so a defect in how it tracks its own state is the same kind of fix as everything else here, just living in a different mod. |

## What it needs

- **Engine:** `>=1.2.0`
- **Shape:** `content`
- **Facets:** `content`, `plugin`
- **Capabilities:** none. It contributes records and nothing else.

What a capability string permits, and what a mod that asks for one cannot do
without it, is in [the mod lifecycle
document](https://github.com/neostryder/neo-angband/blob/master/docs/modding/MOD_LIFECYCLE.md).

## Elsewhere

- [README](../README.md), the full account
- [Changelog](../CHANGELOG.md), what changed in each version
- [What belongs in this mod, and
  why](https://github.com/neostryder/neo-angband/blob/master/docs/modding/BUG_FIXES.md),
  in the game's own repository
- [Installing a
  mod](https://github.com/neostryder/neo-angband/blob/master/docs/MODS.md), the
  route every mod installs by
