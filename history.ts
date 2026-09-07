/**
 * #6665 / 72aec1103ab8153911b503a10da5a1834c1e2b0a: user notes are stored in
 * their short, raw form and expanded only where history is displayed.
 *
 * Core owns the history hook request types. This module uses those public
 * types directly so a seam change is caught by this mod's typecheck.
 */

import type { HistoryDisplayEntry } from "@rpgm-tools/neo-angband-core";

/**
 * Expand only an entry that the write hook explicitly marked raw.  Saved notes
 * from faithful core have no marker, even though their type is USER_INPUT, so
 * enabling this later cannot reinterpret already-expanded history.
 */
export function expandRawUserNote(entry: HistoryDisplayEntry, playerName: string): string {
  if (entry.expandUserInput !== true) return entry.what;
  if (entry.what.startsWith("/say ")) return `-- ${playerName} says: "${entry.what.slice(5)}"`;
  if (entry.what.startsWith("/me")) return `-- ${playerName}${entry.what.slice(3)}`;
  return `-- Note: ${entry.what}`;
}
