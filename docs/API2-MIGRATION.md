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

R1: The folder loader has to send API 2 definitions through `api2Plugin`, so the host can call the hook factory during composition and then `start` after setup. Bug Fixes also goes on the host's first-party list, since that is how this mod gets its engine domain. Folder loading works for any runtime tier, and P-tier access is decided by the first-party list.

R2: Live engine access has to stay available during the move to policies, which means a versioned `mod.engine` domain with SDK types and host bindings for the current `ctx.core`, `ctx.state` and `ctx.registries`. That domain carries its own API version, separate from the game version in `meta.engine`, and only P-tier in-process mods get it.

R3: To repair stairs, the mod needs a level-generation declaration along the lines of `content.declare({ kind: "reachableStairs", directions: "existing", movement: "passableDoorsRubble", neighbours: 8, placement: "nearestStranded", wallPreference: [3, 2, 1, 0], allowArrivalGrid: true, unrepairable: "rejectLevel" })`. The host would check each direction already present, skip any chunk without an arrival grid and keep the town, quest and maximum-depth placement rules, all without a single random draw. `view.level()` only knows remembered terrain, and that can't tell whether stairs are reachable. A truth read doesn't help either, because it has no placement operation and doesn't run at generation time. A policy grant would open the declaration to other tiers. The live-engine fallback needs P-tier R2.

R4: For pricing, the fix needs a per-tval policy like `content.declare({ kind: "valueFloor", tvals: [10, 11, 12, 13, 14, 15, 16, 17, 18], appliesTo: "egoOrPositiveToA", comparison: "cheapestPlainSameTvalWithStrictlyGreaterAc", price: "objectValueReal" })`. From the composed kinds, the host builds minimised plain comparison objects with the same fields cleared as `plainObjectOf`, prices them at the current quantity, and keeps the incoming value or the cheapest eligible comparison, whichever is larger. Plain candidates skip the comparison, so there's no recursion. The flag decides installation, and its reload requirement applies. Content can be inspected through `content.records("object")`, but that lookup can't price synchronously and has no live flag methods. Other tiers can use the declaration once it is granted, and direct registry access needs P-tier R2.

R5: Stacking would use a policy with `kind: "partialStackMerge"` and `rejectWhen: "sourceAtMaxStack"`, checked by Core before charges are redistributed. A plain hook would also make a small replacement: give it `{ sourceCount, sourceMaxStack }` and it returns a boolean. Neither one needs the receiving object or random draws. Once the declared policy exists, other tiers can use it. Until then the source stack read stays behind the P-tier engine adapter.

R6: For pack overflow, a policy with `kind: "packOverflowVictim"` and `prefer: "departedQuiver"` does the job, and null keeps the game's ordinary victim selection. A synchronous hook works too if it takes `{ departedQuiver: number | null }` and returns a handle or null, and no state gets handed over that way. The policy is usable from other tiers. API 1 keeps its current callback while Core adds the replacement.

R7: Artifact generation needs a policy with `kind: "artifactCommit"` and `rejectWhen: "alreadyCreated"` that runs before the data copy and its random draws. A synchronous hook taking `{ artifactIndex, alreadyCreated }` and returning a boolean would be enough as well. Hooking `artifactIdentified` comes too late to prevent the duplicate. Other tiers could use the policy, and in the meantime the API 1 commit callback remains in use.

## SDK build tool

The SDK builder needs to read the API range in an API 2 definition. Its current check requires an integer.

The builder calls `manifestFields` in `readManifestId` but has no import for that function. The catch block replaces the failed read with the folder name, so this worktree's plugin banner contains `overhaul-api2`. The bundle keeps that banner because the build check compares its bytes with the builder's output. The missing import affects mods in every tier.

## Removals and retained exports

`history.ts` now imports `Api2HistoryDisplay` in place of its Core type. None of the runtime reads, grants or development dependencies can go without changing a fix or the way it is verified, and the required `core` content dependency stays as well. `registry:tval` is the mod's one capability, and it is part of the SDK vocabulary for first-party in-process mods. The overflow callback reads no state, so there's nothing to take out of it.

On the API 2 side, the twin provides `createHooks` and the `meta` group from `createAdapter`. The stairs pieces (`StairsCore`, `AdapterEngine.stairs` and `level`) wait on R2/R3. Pricing's `PricingCore`, `HostLike`, `AdapterEngine.pricing` and `setValueAdjust` wait on R2/R4, and `StackLike` with `stackIsFull` waits on R2/R5. `HookCtx` is still the API 1 input type, and the complete `Adapter` and `AdapterEngine` types live there too. Swapping the adapter by itself won't finish the plugin until Core supplies these operations and the hooks that are missing.

No changelog entry goes in for this pass, since the changelog doesn't list internal refactoring or added tests.

## Checks

`pnpm verify` runs `tsc --noEmit`, Vitest and a byte comparison of `plugin.js` with a fresh build. Both recorded runs exit with code 0: 188 tests in 11 files before these fixes and 204 tests in 11 files after them. The build check reports `overhaul-api2: ok, and the committed plugin.js is current (9.7 KiB, api 1)`. These test and documentation edits leave the bundle unchanged.

The flags comparison uses a separate input map for each adapter, with equal entries. Each of the 16 switch combinations has an expected hook member list that both adapters must match. Other tests compare the logger calls and results from the five supported hooks. The history test applies the API 2 decision to a copy, then compares the saved entry and displayed text with API 1. Frozen inputs catch changes to the original entry.

The existing staircase suite checks repair seeds, unmodified healthy levels and random state. Its control still generates stranded stairs with the patch off. The plugin suite drives saves, artifact generation, stack merges and overflow against Core, and checks that disabled fixes install no hooks or pricing handlers. The armour suite checks real prices with and without the handler. The repository has no separate parity or rendering command for these changes.

The boundary test follows context aliases through declarations and assignments. It checks destructuring and reads through members such as `this.ctx`, including casts and string keys. Core imports, re-exports and dynamic loads fail the scan. The load checks include `require` and `import = require` for the package and its subpaths. A name ending in `engine` must come from `createAdapter` in the same scope. The API 2 adapter cannot use a `ctx` identifier. Fixtures also check that type imports, comments and quoted examples pass. Each temporary source violation fails the repository scan, and the source returns to its original bytes afterward.
