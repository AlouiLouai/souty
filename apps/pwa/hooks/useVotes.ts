"use client";

import { useSyncExternalStore } from "react";
import { getServerVotesSnapshot, getVotesSnapshot, subscribeVotes } from "@/lib/votes";

/** Community votes: this device's own, and the tallies behind the blue marks. */
export function useVotes() {
  return useSyncExternalStore(subscribeVotes, getVotesSnapshot, getServerVotesSnapshot);
}
