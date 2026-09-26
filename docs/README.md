# Bug Fixes: quick reference

Opt-in fixes for bugs in Angband 4.2.6, in the style of an unofficial patch.

This page is the short version: every setting, what the mod asks the game for,
and where the longer material is. The account of why each of these exists is in
[the repository README](../README.md).

## Settings

Each one is a named toggle on the game's own Mods screen, which shows the full
description. The identifier is the name a save and another mod see; where a
switch has no flag of its own, the game knows it by its section id instead.

| Setting | Identifier | Default | What it does |
| --- | --- | --- | --- |
| State integrity fixes | `bugfix.stateIntegrity` | on | Keeps the game's own bookkeeping consistent with itself, including across a save and reload. |
| Level generation fixes | `bugfix.levelGeneration` | on | Fixes that change the layout of a level. |
| Text and history fixes | `bugfix.textAndHistory` | on | Corrects text the game shows you, with no change to game state. [TEXT_CHANGES.md](../TEXT_CHANGES.md) lists every change. |
| Borg Fixes | `bugfix.borgFixes` | on | Fixes for the Borg's own bookkeeping. |
| Fix magical armour pricing below plainer armour | `bugfix.armourValueFloor` | off | Floors an enchanted armour item's store price at the cheapest plain item of its own class that offers strictly more total AC, so enchantment can never make an item a worse buy than plainer, heavier armour on the same shelf (#179). |

## What it needs

- **Engine:** `>=1.2.0`
- **Shape:** `content`
- **Facets:** `content`, `plugin`
- **Capabilities:** `registry:tval` - only while "Fix magical armour pricing below plainer armour" is on, to install its store-value adjustment.

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
