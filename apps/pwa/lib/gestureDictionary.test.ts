import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseSignModelMeta } from "@souty/sign-model";
import { SIGNS } from "@souty/vocabulary";
import { gestureToWord, hasWord } from "./gestureDictionary";

const meta = parseSignModelMeta(
  JSON.parse(readFileSync(new URL("../public/models/sign_model.meta.json", import.meta.url), "utf8"))
);

describe("FR-7 spoken vocabulary", () => {
  it("only speaks labels that have a vocabulary word", () => {
    expect(hasWord("sbitar")).toBe(true);
    expect(gestureToWord("sbitar")).toBe("سبيطار");
    expect(hasWord(meta.negative_label)).toBe(false);
    expect(hasWord("not_a_model_class")).toBe(false);
  });

  it("has a word for every sign the shipped model knows", () => {
    const silent = meta.labels.filter((label) => label !== meta.negative_label && !hasWord(label));
    expect(silent).toEqual([]);
  });

  it("never resolves a label through Object.prototype", () => {
    for (const label of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      expect(hasWord(label), label).toBe(false);
    }
  });

  it("shows an unknown label readably instead of a blank", () => {
    expect(gestureToWord("Some_New_Sign")).toBe("Some New Sign");
  });

  it("maps every vocabulary entry to a class the shipped model can output", () => {
    const classes = new Set(meta.labels);
    const orphans = SIGNS.map((sign) => sign.label).filter((label) => !classes.has(label));
    expect(orphans).toEqual([]);
  });

  it("never gives the model's negative class a word", () => {
    expect(SIGNS.some((sign) => sign.label === meta.negative_label)).toBe(false);
  });
});

describe("demo script", () => {
  it("only uses signs the shipped model can output", async () => {
    const { DEMO_WORDS } = await import("./demoScript");
    const classes = new Set(meta.labels);
    expect(Object.keys(DEMO_WORDS).filter((label) => !classes.has(label))).toEqual([]);
  });

  it("covers every word of the demo sentence", async () => {
    const { DEMO_WORDS } = await import("./demoScript");
    const sentence = "مرحباً أنا جوهر حلاق من سيدي بوزيد نحب نحل باتيندة مبادر ذاتي";
    const spoken = [...new Set(Object.values(DEMO_WORDS))].join(" ");
    for (const word of sentence.split(" ")) expect(spoken, word).toContain(word);
  });

  it("stays off unless asked for", () => {
    expect(gestureToWord("Victory")).toBe("بالسلامة");
  });
});
