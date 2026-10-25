/**
 * The decisions of the three bookkeeping fixes that wait on the game's mod API 2
 * (gap register rows BF-2, BF-3 and BF-4).
 *
 * Each is a pure function of the plain facts the game would hand over, with no
 * engine read and no random draw. The mod does not install them: API 2 has no
 * hook for the point where they apply. They stay here with their tests as the
 * specification the game's additions must match, and plugin.ts logs that the
 * fix is on and waiting.
 */

/** The part of a stack the merge guard reads. */
export interface StackCounts {
  readonly number: number;
  readonly kind: { readonly base: { readonly maxStack: number } };
}

/**
 * #6355 residual "Charges drift between wand/staff stacks on repeated drop and
 * pickup" (neostryder/neo-angband#115). combinePack's uneven-stack merge swaps
 * the two stacks' counts whenever the destination is not already at its
 * per-stack limit, and distribute_charges then truncates a charge fraction on
 * every swap, so repeated drop/pickup drifts charges in one direction.
 * Contributor draconisPW proposed this exact guard upstream on 2025-10-08 and
 * it was never submitted: refuse the merge when the SOURCE stack (`drained`)
 * is itself already at its per-stack limit. Returns true to allow the merge.
 */
export function allowPartialStackMerge(drained: StackCounts): boolean {
  return drained.number !== drained.kind.base.maxStack;
}

/**
 * #4666 "Re-inscribing a quiver item with a full pack drops an unrelated item
 * for free" (neostryder/neo-angband#116). packOverflow's no-victim path sheds
 * the trailing pack entry, which need not be the item that actually caused the
 * overflow: a note-only change can displace an item out of the quiver, and the
 * trailing entry can be something else entirely. The game already computes
 * which single handle just left the quiver and passes it as `departedQuiver`;
 * the whole fix is accepting that redirect. Returning null (or declining)
 * falls back to the game's faithful selection.
 */
export function packOverflowVictim(departedQuiver: number | null): number | null {
  return departedQuiver;
}

/**
 * #4510 "Duplicate artifacts". The shared ArtifactState already makes
 * duplication impossible for freshly selected artifacts. This closes the
 * remaining window: an object handed to make_artifact that ALREADY carries an
 * artifact skips that scan, so committing it again would copy the artifact
 * data and mark it created a second time. Refusing makes ArtifactState the
 * single source of truth. Returns true to allow the commit.
 */
export function allowArtifactCommit(alreadyCreated: boolean): boolean {
  return !alreadyCreated;
}
