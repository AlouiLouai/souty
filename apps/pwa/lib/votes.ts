/**
 * This device's side of community validation (SPEC.md, FR-14): its own
 * votes, kept on the device and sent when there is a network, and the last
 * tallies it received, kept so the blue marks also show offline.
 */
import { isVote, withOwnVote, type Tally, type Vote } from "./validation";

const API = "/api/votes";
const STORAGE_KEY = "souty.votes";

interface Stored {
  /** Random id of this device; names no person. */
  voter: string;
  /** Tallies last received from the server. */
  tallies: Record<string, Tally>;
  /** This device's votes the server has. */
  synced: Record<string, Vote>;
  /** This device's votes still to send. */
  pending: Record<string, Vote>;
}

export interface VotesSnapshot {
  /** False when voting is switched off: the server has no vote store. */
  readonly enabled: boolean;
  readonly mine: Readonly<Record<string, Vote>>;
  readonly tallies: Readonly<Record<string, Tally>>;
}

const DISABLED: VotesSnapshot = { enabled: false, mine: {}, tallies: {} };

let stored: Stored | null = null;
/** False once the server said it has no vote store. */
let available = true;
let snapshot: VotesSnapshot = DISABLED;
let started = false;
let flushing = false;
const listeners = new Set<() => void>();

function newVoterId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function voteMap(value: unknown): Record<string, Vote> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, Vote] => isVote(entry[1])));
}

function load(): Stored {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Stored> | null;
    if (saved && typeof saved.voter === "string") {
      return {
        voter: saved.voter,
        tallies: saved.tallies && typeof saved.tallies === "object" ? saved.tallies : {},
        synced: voteMap(saved.synced),
        pending: voteMap(saved.pending),
      };
    }
  } catch {
    // Unreadable or blocked storage: start fresh, in memory.
  }
  return { voter: newVoterId(), tallies: {}, synced: {}, pending: {} };
}

function publish() {
  if (!stored) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage blocked: votes last for this visit only.
  }
  const { tallies, synced, pending } = stored;
  const labels = new Set([...Object.keys(tallies), ...Object.keys(pending)]);
  snapshot = {
    enabled: available,
    mine: { ...synced, ...pending },
    tallies: Object.fromEntries([...labels].map((label) => [label, withOwnVote(tallies[label], synced[label], pending[label])])),
  };
  listeners.forEach((listener) => listener());
}

async function refresh() {
  if (!stored) return;
  try {
    const response = await fetch(API);
    if (response.status === 503) available = false;
    if (response.ok) {
      const body = (await response.json()) as { tallies?: Record<string, Tally> };
      if (body.tallies && typeof body.tallies === "object") stored.tallies = body.tallies;
    }
  } catch {
    // Offline: keep the tallies we have.
  }
  publish();
}

async function flush() {
  if (!stored || flushing || !available) return;
  const sending = { ...stored.pending };
  const votes = Object.entries(sending).map(([label, vote]) => ({ label, vote }));
  if (votes.length === 0) return;
  flushing = true;
  try {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voter: stored.voter, votes }),
    });
    if (response.status === 503) available = false;
    // 400: the server refuses these votes for good (a sign it no longer has).
    if (response.ok || response.status === 400) {
      for (const [label, vote] of Object.entries(sending)) {
        if (response.ok) {
          // Fold the accepted vote into the cached tally, so the count is right until the next refresh.
          stored.tallies[label] = withOwnVote(stored.tallies[label], stored.synced[label], vote);
          stored.synced[label] = vote;
        }
        if (stored.pending[label] === vote) delete stored.pending[label];
      }
    }
  } catch {
    // Offline: the votes stay pending and go out on the next "online" event.
  } finally {
    flushing = false;
    publish();
  }
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  stored = load();
  publish();
  void refresh().then(flush);
  window.addEventListener("online", () => void refresh().then(flush));
}

export function subscribeVotes(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export const getVotesSnapshot = (): VotesSnapshot => snapshot;
export const getServerVotesSnapshot = (): VotesSnapshot => DISABLED;

/** Records this device's vote on a sign's word; it is sent now, or later if offline. */
export function castVote(label: string, vote: Vote) {
  start();
  if (!stored || !snapshot.enabled) return;
  if (stored.synced[label] === vote) delete stored.pending[label];
  else stored.pending[label] = vote;
  publish();
  void flush();
}
