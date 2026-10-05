/**
 * #6665 / 72aec1103ab8153911b503a10da5a1834c1e2b0a: user notes are stored in
 * their short, raw form and expanded only where history is displayed.
 *
 * The SDK's plain history entry type lets both adapters use the same display rule.
 */

import type { Api2HistoryDisplay } from "@rpgm-tools/neo-angband-mod-sdk";

/**
 * Expand only an entry that the write hook explicitly marked raw.  Saved notes
 * from faithful core have no marker, even though their type is USER_INPUT, so
 * enabling this later cannot reinterpret already-expanded history.
 */
export function expandRawUserNote(entry: Api2HistoryDisplay, playerName: string): string {
  if (entry.expandUserInput !== true) return entry.what;
  if (entry.what.startsWith("/say ")) return `-- ${playerName} says: "${entry.what.slice(5)}"`;
  if (entry.what.startsWith("/me")) return `-- ${playerName}${entry.what.slice(3)}`;
  return `-- Note: ${entry.what}`;
}
