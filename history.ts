/**
 * #6665 / 72aec1103ab8153911b503a10da5a1834c1e2b0a: user notes are stored in
 * their short, raw form and expanded only where history is displayed.
 *
 * The local types mirror the two core seams because the published core version
 * used to develop this mod predates them.  The plugin is compiled against the
 * public ModHooks type at release time; keeping this small structural boundary
 * here lets the mod's typecheck stay useful while its tests exercise the built
 * engine carrying the new API.
 */

import type { ModHooks } from "@rpgm-tools/neo-angband-core";

/** The writable portion of core's historyAdd request. */
export interface RawUserNoteWrite {
  what: string;
  readonly type: number;
  readonly duplicate: boolean;
  readonly rawUserInput?: string;
  expandUserInput?: true;
}

/** The persisted portion of core's historyDisplay request. */
export interface RawUserNoteDisplay {
  readonly what: string;
  readonly type: number;
  readonly expandUserInput?: true;
}

/** The two new members added to the core ModHooks surface. */
export interface RawUserNoteHooks {
  historyAdd?: (entry: RawUserNoteWrite) => boolean;
  historyDisplay?: (entry: RawUserNoteDisplay, playerName: string) => string;
}

/**
 * Expand only an entry that the write hook explicitly marked raw.  Saved notes
 * from faithful core have no marker, even though their type is USER_INPUT, so
 * enabling this later cannot reinterpret already-expanded history.
 */
export function expandRawUserNote(entry: RawUserNoteDisplay, playerName: string): string {
  if (entry.expandUserInput !== true) return entry.what;
  if (entry.what.startsWith("/say ")) return `-- ${playerName} says: "${entry.what.slice(5)}"`;
  if (entry.what.startsWith("/me")) return `-- ${playerName}${entry.what.slice(3)}`;
  return `-- Note: ${entry.what}`;
}

/**
 * The local public-core type plus the two seam members.  It is used only while
 * this repository's installed release predates the source engine under test.
 */
export type BugFixesHooks = Omit<ModHooks, "historyAdd"> & RawUserNoteHooks;
