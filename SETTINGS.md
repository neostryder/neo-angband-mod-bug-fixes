# Settings reference

Rules apply immediately, except State integrity fixes, which needs a reload. Sections always require a reload because the content is recomposed.

| Flag | Default | What it does | Reload required |
| --- | --- | --- | --- |
| `bugfix.stateIntegrity` | on | Keeps saved tracking, item ordering, artifact creation, stack charges, quiver overflow, unlit terrain memory, monster lore completeness, and theft counts consistent, and marks the steps that continue a rest so pressing n repeats the rest you entered (not yet in the web client). | Yes, rest fix installs at game start. |
| `bugfix.combatFixes` | on | Monsters prefer archery only when their innate spell frequency is above 25 percent, and FORCE explosions push targets away from the blast center. | No, hooks side. |
| `bugfix.levelGeneration` | on | Replaces a staircase stranded inside an unreachable vault. | No, hooks side. |
| `bugfix.textAndHistory` | on | Corrects selected text, history, and lore descriptions. | Yes, section. |
| `bugfix.borgFixes` | on | Checks Borg buff tracking against the engine's actual buff timers. | Yes, section. |
| `bugfix.armourValueFloor` | off | Floors an enchanted armour item's price at the cheapest plain item of its own class with strictly more total AC. | Yes, registry:tval install. |
