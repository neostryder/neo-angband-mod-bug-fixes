# Bug Fixes migration to API 2

The shipped plugin keeps API 1 and all its fixes. The schema 2 manifest admits API 1 with `api: ">=1.0.0 <2.0.0"` and `runtime: "in-process"`. API 2 folder loading, registry installation and four required hooks still need changes in Core.

`core-adapter-api2.ts` is ready for typechecking and tests. It stays out of `plugin.ts`. Its `createAdapter(mod: ModApi2)` provides flags and logging with the existing `meta` interface. Its `createHooks({ id, flags })` builds the five supported hooks before the game starts. The history write hook returns a decision, and the display hook shares `expandRawUserNote` with API 1. The SDK has no engine domain for the remaining adapter functions.

The table covers 27 rows found in the adapter and the code it serves. One row moves now, eight have API 2 implementations awaiting wiring, and eighteen require Core changes. Related live fields share a row when the same replacement covers them.

| Old member | API 2 home or Core request | Notes |
| --- | --- | --- |
| `ctx.flags` | `meta.flags`, composition `flags` | The twin reads flags from the running API and from the hook factory's argument. |
| `ctx.log` | `meta.log(message)` | The twin calls the host logger as a method. The API 1 logger remains optional. |
| `ctx.core.FEAT` | R2, R3 | Terrain constants identify each staircase direction. |
| `ctx.core.loc` | R2, R3 | Grid construction supports the reachability walk. |
| `ctx.core.placeStairs` | R2, R3 | Placement applies the game's restrictions on staircase direction. |
| `ctx.core.squareIsEmpty` | R2, R3 | The repair tests whether a grid can hold stairs. |
| `ctx.core.squareIsNoStairs` | R2, R3 | Some grids forbid staircase placement. |
| `ctx.core.squareNumWallsAdjacent` | R2, R3 | The candidate search prefers corners and alcoves. |
| `ctx.core.objectValueReal` | R2, R4 | Comparison prices come from the game's formula. |
| `register(host, ctx)` | R1, R4 | `start(mod)` lacks the registry host. |
| `host.tval.valueAdjust.set` | R2, R4 | Armour pricing registers a handler for each tval from 10 to 18. |
| `hooks(ctx)` | Definition `hooks({ id, flags })` | The twin accepts the smaller SDK hook context. |
| `hooks.messageText` | `Api2Hooks.messageText` | The same tables correct messages in both forms. No declaration is needed. |
| `hooks.historyAdd` | `Api2Hooks.historyAdd` | The decision drops duplicates or preserves the raw note with its expansion marker. |
| `hooks.historyDisplay` | `Api2Hooks.historyDisplay` | The display function stays the same. |
| `hooks.saveNoiseScent` | `Api2Hooks.saveNoiseScent` | The state integrity switch requests heatmaps in the save. |
| `hooks.objectListTiebreak` | `Api2Hooks.objectListTiebreak` | Signed `dy` and then signed `dx` order tied entries. |
| `hooks.levelGenerated` | R3 | An unrepaired level is rejected for generation to try again. |
| `hooks.partialStackMerge` | R5 | A full source stack prevents a partial merge. |
| `hooks.packOverflowVictim` | R6 | The result is the departed quiver handle or null. The state argument is unused. |
| `hooks.artifactCommit` | R7 | An already-created artifact is refused before copying its data. |
| `Gen.c`, `Gen.playerSpot` | R2, R3 | Reachability starts at the arrival grid in the assembled level. |
| `Chunk.width`, `height`, `inBounds`, `isPassable`, `isDoor`, `isRubble`, `feat` | R2, R3 | The walk reads actual terrain, including doors and rubble. |
| `reg.kinds` and kind base stats | R2, R4 | Composed content is available as JSON, while this handler needs live kinds and synchronous prices. |
| `template.flags.clone()/wipe()`, `modifiers`, `elInfo` and item fields | R2, R4 | Each comparison object clears enchantments without changing the template. |
| `drained.number`, `drained.kind.base.maxStack` | R2, R5 | These counts determine whether the source stack is full. |
| Core `HistoryDisplayEntry` type | SDK `Api2HistoryDisplay`, moved | The shared display function now imports the plain SDK type. |

The plugin has no controller or presentation members. It reads neither `ctx.state` nor `ctx.registries` and takes no raw snapshots. There are no event subscriptions, actions, storage calls or panels. The overflow hook receives state without using it. The Borg Fixes switch supplies a flag to the Borg mod and adds no engine read here. Content patches, defaults and legacy flag names survive the manifest conversion.

## Core requests

R1: API 2 folder loading needs the loader to wrap a definition with the existing `api2Plugin` shim. The builder needs to accept its API range instead of requiring an integer, and the host needs to call the hook factory during composition and `start` after setup. Bug Fixes also needs recognition in the first-party list so the host supplies its engine domain. Folder loading serves all runtime tiers. First-party recognition serves P-tier mods.

R2: A versioned `mod.engine` domain needs SDK types and host bindings for the current `ctx.core`, `ctx.state` and `ctx.registries`. It keeps live engine access available during the move to policies. Its API version is separate from the game version in `meta.engine`. This domain belongs to P-tier in-process mods only.

R3: The stairs repair needs a level-generation declaration such as `content.declare({ kind: "reachableStairs", directions: "existing", movement: "passableDoorsRubble", neighbours: 8, placement: "nearestStranded", wallPreference: [3, 2, 1, 0], allowArrivalGrid: true, unrepairable: "rejectLevel" })`. The host checks each direction already present, skips chunks without an arrival grid and retains town, quest and maximum-depth placement rules. The repair takes no random draws. Remembered terrain from `view.level()` cannot answer the reachability question. A truth read also lacks the placement operation and generation timing. This declaration can serve other tiers with a policy grant. Its live-engine fallback needs P-tier R2.

R4: The pricing fix needs a per-tval policy such as `content.declare({ kind: "valueFloor", tvals: [10, 11, 12, 13, 14, 15, 16, 17, 18], appliesTo: "egoOrPositiveToA", comparison: "cheapestPlainSameTvalWithStrictlyGreaterAc", price: "objectValueReal" })`. The host builds minimised plain comparison objects from composed kinds using the same cleared fields as `plainObjectOf`. It prices them at the current quantity and keeps the larger of the incoming value and the cheapest eligible comparison. Plain candidates skip comparison, preventing recursion. Installation follows the flag and its reload requirement. `content.records("object")` offers a content lookup for inspection, but it cannot supply synchronous pricing or live flag methods. A granted declaration can serve other tiers. Direct registry access needs P-tier R2.

R5: A stacking policy needs `kind: "partialStackMerge"` and `rejectWhen: "sourceAtMaxStack"`. Core evaluates it before charge redistribution. A plain hook with `{ sourceCount, sourceMaxStack }` and a boolean answer is another small replacement. Neither form needs the receiving object or random draws. The declared policy can serve other tiers. Until it exists, the source stack read stays behind the P-tier engine adapter.

R6: Pack overflow needs `kind: "packOverflowVictim"` with `prefer: "departedQuiver"`. Null keeps the game's ordinary victim selection. A synchronous hook taking `{ departedQuiver: number | null }` and returning a handle or null also covers the fix without handing over state. This policy can serve other tiers. API 1 keeps its current callback while Core adds the replacement.

R7: Artifact generation needs `kind: "artifactCommit"` with `rejectWhen: "alreadyCreated"`, applied before the data copy and its random draws. A synchronous hook taking `{ artifactIndex, alreadyCreated }` and returning a boolean also suffices. `artifactIdentified` happens too late to prevent the duplicate. This policy can serve other tiers. The API 1 commit callback remains in use.

R8: The builder needs an import of `manifestFields` from the built SDK. `readManifestId` currently calls it without an import, catches the reference error and substitutes the folder basename. The resulting banner in this worktree reads `overhaul-api2`. The committed bundle retains that builder output for the build check. This correction applies to every tier.

## Removals and retained exports

`history.ts` replaces its Core type import with `Api2HistoryDisplay`. No runtime read, grant or development dependency is removable without changing a fix or its verification. The required `core` content dependency also stays. `registry:tval` is the sole capability and belongs to the SDK vocabulary for first-party in-process mods. The overflow callback has no state read to remove.

The API 2 twin supplies `createAdapter`'s `meta` group plus `createHooks`. `StairsCore`, `AdapterEngine.stairs` and `level` wait on R2/R3. R2/R4 cover `PricingCore`, `HostLike`, `AdapterEngine.pricing` and `setValueAdjust`. `StackLike` and `stackIsFull` need R2/R5. `HookCtx` stays the API 1 input type, and the full `Adapter` and `AdapterEngine` types remain there. Swapping the adapter alone cannot finish the plugin until Core supplies these operations and the missing hooks.

The changelog's exclusion of internal refactoring and test additions applies to this pass, so no entry is added.

## Checks

The repository runs `pnpm build` before `pnpm verify`. Verification includes `tsc --noEmit`, Vitest and the committed plugin comparison. The new tests compare flags and log calls against API 1, exercise every rule-switch combination and compare the five supported hooks. History decisions are applied to a copy before saved and displayed entries are compared. Frozen inputs test that the twin leaves its arguments alone.

The existing staircase suite checks repair seeds, unmodified healthy levels and random state. Its control still generates stranded stairs with the patch off. The plugin suite drives saves, artifact generation, stack merges and overflow against Core, and checks that disabled fixes install no hooks or pricing handlers. The armour suite checks real prices with and without the handler. The repository has no separate parity or rendering command for these changes.

The TypeScript syntax scan rejects context reads hidden by casts, parentheses, non-null assertions or spacing. It covers string keys, engine imports, engine re-exports and dynamic engine loads. Identifier reads ending in `engine` need a binding from `createAdapter` in the same scope. Any `ctx` identifier is forbidden in the twin. Fixtures cover the accepted type imports and inert strings as well as violations. Temporary edits in the source files test that the repository scan fails before the original bytes are restored.
