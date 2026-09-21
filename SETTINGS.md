# Settings reference

Rules are rebuilt as live hooks, so their changes apply immediately. Sections always require a reload because the content is recomposed.

| Flag | Default | What it does | Reload required |
| --- | --- | --- | --- |
| `bugfix.stateIntegrity` | on | Keeps saved tracking, item ordering, artifact creation, stack charges, and quiver overflow consistent. | No, hooks side. |
| `bugfix.levelGeneration` | on | Replaces a staircase stranded inside an unreachable vault. | No, hooks side. |
| `bugfix.textAndHistory` | on | Corrects selected text, history, and lore descriptions. | Yes, section. |
| `bugfix.borgFixes` | on | Checks Borg buff tracking against the engine's actual buff timers. | Yes, section. |
| `bugfix.armourValueFloor` | off | Floors an enchanted armour item's price at the cheapest plain item of its own class with strictly more total AC. | Yes, registry:tval install. |
