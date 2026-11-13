import { describe, expect, it } from "vitest";
import { MIN_AGREEMENT, MIN_VOTES, isValidated, isVote, isVoterId, withOwnVote } from "./validation";

describe("FR-14 community validation", () => {
  it("validates a word only with enough votes and enough agreement", () => {
    expect(isValidated(undefined)).toBe(false);
    expect(isValidated({ yes: MIN_VOTES - 1, no: 0 })).toBe(false);
    expect(isValidated({ yes: MIN_VOTES, no: 0 })).toBe(true);
    expect(isValidated({ yes: 8, no: 2 })).toBe(8 / 10 >= MIN_AGREEMENT);
    expect(isValidated({ yes: 7, no: 3 })).toBe(false);
    expect(isValidated({ yes: 0, no: 50 })).toBe(false);
  });

  it("accepts only yes or no, from a random device id", () => {
    expect(isVote("yes")).toBe(true);
    expect(isVote("maybe")).toBe(false);
    expect(isVoterId("3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b")).toBe(true);
    expect(isVoterId("someone@example.com")).toBe(false);
    expect(isVoterId(undefined)).toBe(false);
  });

  it("counts this device's unsent vote once, replacing its earlier one", () => {
    expect(withOwnVote(undefined, undefined, "yes")).toEqual({ yes: 1, no: 0 });
    expect(withOwnVote({ yes: 4, no: 1 }, undefined, undefined)).toEqual({ yes: 4, no: 1 });
    expect(withOwnVote({ yes: 4, no: 1 }, "yes", "no")).toEqual({ yes: 3, no: 2 });
    expect(withOwnVote({ yes: 4, no: 1 }, "yes", "yes")).toEqual({ yes: 4, no: 1 });
  });
});
