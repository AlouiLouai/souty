/**
 * Community validation of the vocabulary: users say whether the word shown
 * for a sign is right, and a sign with enough agreeing votes earns the blue
 * "validated" mark. Shared by the page and the vote API, so both apply the
 * same rules.
 */

export type Vote = "yes" | "no";

/** Votes for one sign's word. */
export interface Tally {
  readonly yes: number;
  readonly no: number;
}

/** A sign needs at least this many votes before it can be validated. */
export const MIN_VOTES = 10;
/** ...and at least this share of them saying the word is right. */
export const MIN_AGREEMENT = 0.8;

export function isValidated(tally: Tally | undefined): boolean {
  if (!tally) return false;
  const total = tally.yes + tally.no;
  return total >= MIN_VOTES && tally.yes / total >= MIN_AGREEMENT;
}

export function isVote(value: unknown): value is Vote {
  return value === "yes" || value === "no";
}

/** An anonymous, random per-device id (a UUID). It names no person. */
export function isVoterId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
}

/**
 * The tally to show on this device: the server's count, corrected for this
 * device's vote when it has not reached the server yet (or replaced one).
 */
export function withOwnVote(server: Tally | undefined, synced: Vote | undefined, pending: Vote | undefined): Tally {
  const tally = { yes: server?.yes ?? 0, no: server?.no ?? 0 };
  if (!pending || pending === synced) return tally;
  if (synced) tally[synced] = Math.max(0, tally[synced] - 1);
  tally[pending] += 1;
  return tally;
}
