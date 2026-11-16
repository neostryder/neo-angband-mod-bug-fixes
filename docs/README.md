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
| Combat fixes | `bugfix.combatFixes` | on | Monsters prefer archery only when their innate spell frequency is above 25 percent, FORCE explosions push targets away from the blast center instead of the caster, and item information uses the inspected loadout's bow and throwing skills for critical hits. |
| Level generation fixes | `bugfix.levelGeneration` | on | Fixes that change the layout of a level. |
| Text and history fixes | `bugfix.textAndHistory` | on | Corrects text the game shows you, with no change to game state. [TEXT_CHANGES.md](../TEXT_CHANGES.md) lists every change. |
| Borg Fixes | `bugfix.borgFixes` | on | Fixes for the Borg's own bookkeeping. |
| Fix magical armour pricing below plainer armour | `bugfix.armourValueFloor` | off | Floors an enchanted armour item's store price at the cheapest plain item of its own class that offers strictly more total AC, so an enchanted item never costs less than the cheapest plainer item of its class with more total AC (#179). |

## What it needs

- **Engine:** `>=1.23.0-beta.1`
- **Mod API:** `>=2.4.0 <3.0.0`
- **Shape:** `content`
- **Facets:** `content`, `plugin`
- **Capabilities:** `engine:access` - only while "Level generation fixes" or "State integrity fixes" is on, to reach the game's own hooks for those fixes. `registry:tval` - only while "Fix magical armour pricing below plainer armour" is on, to install its store-value adjustment. `registry:command` - only while "State integrity fixes" is on, to wrap the rest action and to schedule experience updates so only a level change triggers a full recalculation. `registry:monster` - only while "Combat fixes" or "State integrity fixes" is on, to apply the monster archery, monster lore completeness, and theft count fixes. `registry:projection` - only while "Combat fixes" or "State integrity fixes" is on, to push FORCE knockback out from the blast center and to forget unlit impassable terrain. `registry:rune` - only while "State integrity fixes" is on, to make flag intersections report removed bits and to restore object knowledge and noise when a save loads. `registry:effect-info` - only while "Combat fixes" is on, to take bow and throwing skills from the inspected character state in missile critical figures on the item information screen. `registry:room` - only while "Level generation fixes" is on, to apply the forced-descent stair rules.

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
