# Bug Fixes migration to API 2

The shipped plugin keeps API 1 and all its fixes. The schema 2 manifest admits API 1 with `api: ">=1.0.0 <2.0.0"` and `runtime: "in-process"`. API 2 folder loading, registry installation and four required hooks still need changes in Core.

`core-adapter-api2.ts` provides the API 2 adapter and hooks for tests. The shipped `plugin.ts` still uses API 1. `createAdapter(mod: ModApi2)` reads flags and calls the logger through `meta`. `createHooks(context)` accepts `{ id, flags }` from the SDK and uses only `flags` to choose the five supported hooks. The history write hook returns a decision. Both display hooks call `expandRawUserNote`. The remaining functions need an engine domain that the SDK does not provide.

The adapter and its callers use the 27 rows in this table. The `hooks(ctx)` definition row moves now. Eight rows have API 2 replacements that still need connections in `plugin.ts`: flags, logging, the five supported hooks and the history display type. The shared display function imports `Api2HistoryDisplay` today, while its API 2 hook remains outside the plugin. Eighteen rows need Core changes. Fields with the same replacement share a row.

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
| `hooks(ctx)` | Definition `hooks(context)` | The SDK context contains `{ id, flags }`; hook selection uses `flags`. |
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
| Core `HistoryDisplayEntry` type | SDK `Api2HistoryDisplay` | The display function imports this type today. Its API 2 hook awaits plugin wiring. |

The plugin has no controller or presentation members. It reads neither `ctx.state` nor `ctx.registries` and takes no raw snapshots. There are no event subscriptions, actions, storage calls or panels. The overflow hook receives state without using it. The Borg Fixes switch supplies a flag to the Borg mod and adds no engine read here. Content patches, defaults and legacy flag names survive the manifest conversion.

## Core requests

R1: The folder loader needs to pass API 2 definitions through `api2Plugin`. During composition, the host calls the hook factory. After setup, it calls `start`. The host's first-party list also needs Bug Fixes so this mod receives its engine domain. Folder loading supports all runtime tiers; the first-party list controls P-tier access.

R2: A versioned `mod.engine` domain needs SDK types and host bindings for the current `ctx.core`, `ctx.state` and `ctx.registries`. It keeps live engine access available during the move to policies. Its API version is separate from the game version in `meta.engine`. This domain belongs to P-tier in-process mods only.

R3: The stairs repair needs a level-generation declaration such as `content.declare({ kind: "reachableStairs", directions: "existing", movement: "passableDoorsRubble", neighbours: 8, placement: "nearestStranded", wallPreference: [3, 2, 1, 0], allowArrivalGrid: true, unrepairable: "rejectLevel" })`. The host checks each direction already present, skips chunks without an arrival grid and retains town, quest and maximum-depth placement rules. The repair takes no random draws. Remembered terrain from `view.level()` cannot answer the reachability question. A truth read also lacks the placement operation and generation timing. This declaration can serve other tiers with a policy grant. Its live-engine fallback needs P-tier R2.

R4: The pricing fix needs a per-tval policy such as `content.declare({ kind: "valueFloor", tvals: [10, 11, 12, 13, 14, 15, 16, 17, 18], appliesTo: "egoOrPositiveToA", comparison: "cheapestPlainSameTvalWithStrictlyGreaterAc", price: "objectValueReal" })`. The host builds minimised plain comparison objects from composed kinds using the same cleared fields as `plainObjectOf`. It prices them at the current quantity and keeps the larger of the incoming value and the cheapest eligible comparison. Plain candidates skip comparison, preventing recursion. Installation follows the flag and its reload requirement. `content.records("object")` offers a content lookup for inspection, but it cannot supply synchronous pricing or live flag methods. A granted declaration can serve other tiers. Direct registry access needs P-tier R2.

R5: A stacking policy needs `kind: "partialStackMerge"` and `rejectWhen: "sourceAtMaxStack"`. Core evaluates it before charge redistribution. A plain hook with `{ sourceCount, sourceMaxStack }` and a boolean answer is another small replacement. Neither form needs the receiving object or random draws. The declared policy can serve other tiers. Until it exists, the source stack read stays behind the P-tier engine adapter.

R6: Pack overflow needs `kind: "packOverflowVictim"` with `prefer: "departedQuiver"`. Null keeps the game's ordinary victim selection. A synchronous hook taking `{ departedQuiver: number | null }` and returning a handle or null also covers the fix without handing over state. This policy can serve other tiers. API 1 keeps its current callback while Core adds the replacement.

R7: Artifact generation needs `kind: "artifactCommit"` with `rejectWhen: "alreadyCreated"`, applied before the data copy and its random draws. A synchronous hook taking `{ artifactIndex, alreadyCreated }` and returning a boolean also suffices. `artifactIdentified` happens too late to prevent the duplicate. This policy can serve other tiers. The API 1 commit callback remains in use.

## SDK build tool

The SDK builder needs to read the API range in an API 2 definition. Its current check requires an integer.

The builder calls `manifestFields` in `readManifestId` but has no import for that function. The catch block replaces the failed read with the folder name, so this worktree's plugin banner contains `overhaul-api2`. The bundle keeps that banner because the build check compares its bytes with the builder's output. The missing import affects mods in every tier.

## Removals and retained exports

`history.ts` replaces its Core type import with `Api2HistoryDisplay`. No runtime read, grant or development dependency is removable without changing a fix or its verification. The required `core` content dependency also stays. `registry:tval` is the sole capability and belongs to the SDK vocabulary for first-party in-process mods. The overflow callback has no state read to remove.

The API 2 twin supplies `createAdapter`'s `meta` group plus `createHooks`. `StairsCore`, `AdapterEngine.stairs` and `level` wait on R2/R3. R2/R4 cover `PricingCore`, `HostLike`, `AdapterEngine.pricing` and `setValueAdjust`. `StackLike` and `stackIsFull` need R2/R5. `HookCtx` stays the API 1 input type, and the full `Adapter` and `AdapterEngine` types remain there. Swapping the adapter alone cannot finish the plugin until Core supplies these operations and the missing hooks.

The changelog's exclusion of internal refactoring and test additions applies to this pass, so no entry is added.

## Checks

`pnpm verify` runs `tsc --noEmit`, Vitest and a byte comparison of `plugin.js` with a fresh build. Both recorded runs exit with code 0: 188 tests in 11 files before these fixes and 204 tests in 11 files after them. The build check reports `overhaul-api2: ok, and the committed plugin.js is current (9.7 KiB, api 1)`. These test and documentation edits leave the bundle unchanged.

The flags comparison uses a separate input map for each adapter, with equal entries. Each of the 16 switch combinations has an expected hook member list that both adapters must match. Other tests compare the logger calls and results from the five supported hooks. The history test applies the API 2 decision to a copy, then compares the saved entry and displayed text with API 1. Frozen inputs catch changes to the original entry.

The existing staircase suite checks repair seeds, unmodified healthy levels and random state. Its control still generates stranded stairs with the patch off. The plugin suite drives saves, artifact generation, stack merges and overflow against Core, and checks that disabled fixes install no hooks or pricing handlers. The armour suite checks real prices with and without the handler. The repository has no separate parity or rendering command for these changes.

The boundary test follows context aliases through declarations and assignments. It checks destructuring and reads through members such as `this.ctx`, including casts and string keys. Core imports, re-exports and dynamic loads fail the scan. The load checks include `require` and `import = require` for the package and its subpaths. A name ending in `engine` must come from `createAdapter` in the same scope. The API 2 adapter cannot use a `ctx` identifier. Fixtures also check that type imports, comments and quoted examples pass. Each temporary source violation fails the repository scan, and the source returns to its original bytes afterward.
