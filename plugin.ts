/**
 * The `bug-fixes` mod's behaviour, as the mod's OWN code.
 *
 * Nothing in this file is compiled into core. Delete this folder and every fix
 * below goes with it - there is no `bugfix.*` string, no staircase repair, no
 * duplicate-artifact guard and no message rewriter anywhere in packages/core.
 * That is the whole point of the mod being a mod (neostryder, 2026-07-29: "the whole
 * point of making them mods was to exclude them from the core game").
 *
 * Each patch cites its upstream issue; docs/modding/BUG_FIXES.md carries the
 * long form (issue / PR / commit per entry).
 *
 * ------------------------------------------------------------------
 * ENTRY POINT CONTRACT
 * ------------------------------------------------------------------
 *
 * The default export is a mod API 2 definition. The status presenter reads
 * remembered terrain through the consented engine domain. The other
 * `hooks` and `policies` are handed the mod's resolved rule flags and return
 * plain functions of plain data, or declarations the host interprets, so this
 * file imports the SDK for TYPES ONLY. A module fetched from a folder cannot
 * resolve a bare specifier, and a bundled copy of the SDK would only add a
 * second copy of its module state.
 *
 * THE MOD READS ITS OWN FLAGS. Core never sees a flag name. A rule that is off
 * contributes no hook and no declaration, so a switched-off fix is not merely
 * inert, it is absent: the game takes its faithful path.
 *
 * FOUR FIXES USE THE GAME'S OWN HOOKS. The staircase repair, the partial-stack
 * merge guard, the pack-overflow redirect and the duplicate-artifact guard
 * stand at points where the game hands over live objects, so API 2 has no hook
 * for them. `engineHooks` returns the game's own members by name and the game
 * calls them with the live arguments. That door opens only for a mod with the
 * engine domain, and the mod still reads no engine member of its own: the
 * engine arrives as an argument. The decisions are plain functions in
 * stairs.ts and state-rules.ts.
 */

import type { Api2Engine, Api2HookContext, Api2Hooks, Api2ModDefinition, Api2Policies, HudOwnership, ModApi2 } from "@rpgm-tools/neo-angband-mod-sdk";
import type { GameState } from "@rpgm-tools/neo-angband-core";
import { expandRawUserNote } from "./history";
import { ensureStairsReachable, type StairsCore } from "./stairs";
import { textAndHistoryMessage } from "./strings";
import { allowArtifactCommit, allowPartialStackMerge, packOverflowVictim } from "./state-rules";

/**
 * The nine armour tvals (reference/src/list-tvals.h order, the game's own
 * `tvalIsArmor` list), spelled out as literal numbers because this file
 * imports types only.
 */
const ARMOUR_TVALS = [10, 11, 12, 13, 14, 15, 16, 17, 18] as const;

interface StatusElement {
  readonly style: { cssText: string };
  hidden: boolean;
  textContent: string | null;
  appendChild(child: StatusElement): unknown;
  replaceChildren(): void;
  remove(): void;
}

interface StatusDocument {
  readonly body: StatusElement;
  createElement(tag: string): StatusElement;
}

let statusPanel: StatusElement | undefined;

export default {
  api: ">=2.0.0 <3.0.0",

  presentation: {
    hud(mod: ModApi2): HudOwnership | undefined {
      if (mod.meta.flags["bugfix.stateIntegrity"] !== true || !mod.engine) return undefined;
      const doc = (globalThis as { document?: StatusDocument }).document;
      if (!doc) return undefined;
      const engine = mod.engine;
      const core = engine.core as typeof import("@rpgm-tools/neo-angband-core");
      statusPanel?.remove();
      const panel = statusPanel = doc.createElement("div");
      panel.hidden = true;
      doc.body.appendChild(panel);
      return {
        status: {
          present(section, frame): void {
            panel.hidden = true;
            panel.replaceChildren();
            const region = section.region;
            const pixels = region?.pixels;
            if (!region || !pixels || region.cells.cols <= 0 || region.cells.rows <= 0) return;
            const clip = section.clip;
            if (frame.stack && frame.stack.length > 0) {
              const at = frame.stack.findIndex((r) => r.id === region.name);
              if (at < 0 || frame.stack.slice(at + 1).some(({ cells: r }) =>
                r.col < clip.col + clip.cols && clip.col < r.col + r.cols &&
                r.row < clip.row + clip.rows && clip.row < r.row + r.rows)) return;
            }
            const width = pixels.width / region.cells.cols;
            const height = pixels.height / region.cells.rows;
            panel.style.cssText = `position:fixed;pointer-events:none;overflow:hidden;z-index:10;left:${pixels.x + (clip.col - region.cells.col) * width}px;top:${pixels.y + (clip.row - region.cells.row) * height}px;width:${clip.cols * width}px;height:${clip.rows * height}px;font:${height}px/${height}px monospace;white-space:pre`;
            for (const entry of section.entries) {
              let runs = entry.runs;
              if (!frame.targeting && entry.key === "terrain") {
                const state = engine.state as GameState | undefined;
                if (!state) return;
                const grid = state.actor.grid;
                const remembered = core.knownFeat(state, grid);
                let feat = state.chunk.features.get(remembered < 0 ? 0 : remembered);
                if (feat.mimic !== null) feat = state.chunk.features.get(feat.mimic);
                /* Upstream 0107bbad9 hides leftover traps when terrain was forgotten. */
                const trap = remembered > 0 ? core.squareKnownTraps(state.known, grid)[0] : undefined;
                const name = trap?.name ?? feat.name;
                const color = core.colorCharToAttr(trap?.color ?? feat.dAttr);
                runs = [{ text: `${name.charAt(0).toUpperCase()}${name.slice(1)} `, color, css: core.colorToCss(color) }];
              }
              let col = entry.screen.col;
              for (const run of runs) {
                for (const ch of run.text) {
                  const cell = doc.createElement("span");
                  cell.textContent = ch;
                  cell.style.cssText = `position:absolute;left:${(col++ - clip.col) * width}px;top:${(entry.screen.row - clip.row) * height}px;width:${width}px;height:${height}px;color:${run.css}`;
                  panel.appendChild(cell);
                }
              }
            }
            panel.hidden = false;
          },
        },
      };
    },
  },

  hooks({ flags }: Api2HookContext): Api2Hooks {
    const hooks: Api2Hooks = {};

    /*
     * bugfix.textAndHistory - what the game WRITES DOWN or SAYS. No game state.
     * Folds #4245 (unique kill history), #6665 (user notes) and the misc.
     * string table; the same flag also gates its lore-text content patches.
     */
    if (flags["bugfix.textAndHistory"] === true) {
      /*
       * #4245 "Killing a unique twice logs it twice". Core reports whether THIS
       * entry is a duplicate and holds no opinion about it; dropping it is the fix.
       *
       * #6665 retains an unexpanded note in the same decision. The raw text is at
       * most the command's input limit, so history's 79-character storage cannot
       * cut off a long player name, the note's tail, or its quote.
       */
      hooks.historyAdd = (entry) => {
        if (entry.duplicate) return { keep: false };
        if (entry.rawUserInput !== undefined) {
          return { keep: true, what: entry.rawUserInput, expandUserInput: true };
        }
        return { keep: true };
      };

      /* The display half of #6665: one expansion rule for the live history page and the character dump. */
      hooks.historyDisplay = expandRawUserNote;

      /*
       * Misc. string fixes: upstream's own cosmetic string warts, corrected at
       * the host's single message sink. An exact-match table on purpose
       * (strings.ts): messages arrive interpolated, so a general rewrite would
       * edit inscriptions and names the player typed.
       */
      hooks.messageText = textAndHistoryMessage;
    }

    /*
     * bugfix.stateIntegrity - the game's own bookkeeping staying consistent with
     * itself, including across a save and reload.
     */
    if (flags["bugfix.stateIntegrity"] === true) {
      /*
       * #4605 "Noise and scent are not saved". The heatmaps are transient
       * upstream, so monsters track the player differently after a save/reload.
       * Asking for them in the save is the whole fix.
       */
      hooks.saveNoiseScent = (): boolean => true;

      /*
       * #4664 "Object list is not always correctly ordered". Adds a deterministic
       * geometric total key (nearer-to-top first, then leftmost), so the order is
       * a strict TOTAL order that holds even under a non-stable sort. PR #4668
       * was closed unmerged, so there is no accepted upstream fix to port.
       */
      hooks.objectListTiebreak = (a, b): number => Math.sign(a.dy - b.dy) || Math.sign(a.dx - b.dx);
    }

    return hooks;
  },

  policies({ flags }: Api2HookContext): Api2Policies | undefined {
    /*
     * bugfix.armourValueFloor (#179): an enchanted armour item is never priced
     * below the cheapest ordinary item of its own class with strictly more
     * total AC. The host runs the comparison with the game's own pricing, which
     * is what armour-value.ts specifies. `requiresReload` on the manifest rule
     * is why the declaration is read once at load.
     */
    if (flags["bugfix.armourValueFloor"] !== true) return undefined;
    return {
      valueFloor: {
        kind: "valueFloor",
        tvals: ARMOUR_TVALS,
        appliesTo: "egoOrPositiveToA",
        comparison: "cheapestPlainSameTvalWithStrictlyGreaterAc",
        price: "objectValueReal",
      },
    };
  },

  /*
   * The hooks API 2 has no form for: the game's own members, called with live
   * arguments. Each one is declared only while its flag is on.
   */
  engineHooks({ flags, engine }: Api2HookContext & { readonly engine: Api2Engine }): Readonly<Record<string, (...args: never[]) => unknown>> {
    const hooks: Record<string, (...args: never[]) => unknown> = {};

    /*
     * bugfix.levelGeneration - "always a reachable up and down staircase". The
     * hook receives the whole generated level and returns false to make the game
     * generate another; stairs.ts holds the repair and its long account.
     */
    if (flags["bugfix.levelGeneration"] === true) {
      hooks["levelGenerated"] = (gen: Parameters<typeof ensureStairsReachable>[0], quest: boolean): boolean => ensureStairsReachable(gen, quest, engine.core as StairsCore);
    }

    /* bugfix.stateIntegrity - the three guards that need the game's live state. */
    if (flags["bugfix.stateIntegrity"] === true) {
      hooks["artifactCommit"] = (_aidx: number, alreadyCreated: boolean): boolean => allowArtifactCommit(alreadyCreated);
      hooks["partialStackMerge"] = (drained: Parameters<typeof allowPartialStackMerge>[0]): boolean => allowPartialStackMerge(drained);
      hooks["packOverflowVictim"] = (_state: unknown, departedQuiver: number | null): number | null => packOverflowVictim(departedQuiver);
    }

    return hooks;
  },

  start(mod: ModApi2): void {
    if (mod.meta.flags["bugfix.armourValueFloor"] === true) mod.meta.log("armour value floor declared (#179)");
  },

  stop(): void {
    statusPanel?.remove();
    statusPanel = undefined;
  },
} satisfies Api2ModDefinition;
