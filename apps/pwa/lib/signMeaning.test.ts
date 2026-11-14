import { describe, expect, it } from "vitest";
import { SIGNS, shapeForSign } from "@souty/vocabulary";
import { MEANING_ICONS } from "./signMeaning";

describe("sign guide pictures for signs without a hand drawing", () => {
  it("gives every sign that has no drawing a picture of its meaning", () => {
    const missing = SIGNS.filter((sign) => !shapeForSign(sign.label) && !MEANING_ICONS[sign.label]).map((sign) => sign.label);
    expect(missing).toEqual([]);
  });

  it("only names signs that exist and have no drawing (a drawn sign shows its hand)", () => {
    for (const label of Object.keys(MEANING_ICONS)) {
      expect(SIGNS.some((sign) => sign.label === label), label).toBe(true);
      expect(shapeForSign(label), label).toBeNull();
    }
  });
});
