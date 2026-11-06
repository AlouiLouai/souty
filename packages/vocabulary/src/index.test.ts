import { describe, expect, it } from "vitest";
import {
  HAND_LANDMARK_COUNT,
  NEGATIVE_LABELS,
  SIGNS,
  SIGN_CATEGORIES,
  SIGN_COUNT,
  TUNSL_HANDSHAPES,
  TUNSL_SIGN_COUNT,
  UNIVERSAL_SIGN_COUNT,
  WORD_BY_LABEL,
  signsByCategory,
} from "./index";

/**
 * The label -> word mapping the deployed model was validated against.
 * This is a contract with the trained classifier: a diff here must be a
 * deliberate retrain, never a refactoring accident.
 */
const DEPLOYED_MODEL_CONTRACT: Record<string, string> = {
  assam: "أصم",
  labes: "لاباس",
  oui: "ايه",
  non: "لا",
  siye7a: "سياحة",
  ta3raf: "تعرف",
  "5adamet": "خدمات",
  mostawsaf: "مستوصف",
  sbitar: "سبيطار",
  bent: "بنت",
  bou: "بابا",
  eben: "ابن",
  jad: "جد",
  jadda: "جدة",
  mar2a: "مرأة",
  tfol: "طفل",
  "5mis": "الخميس",
  sebt: "السبت",
  thnin: "الاثنين",
  car: "سيارة",
  louage: "لواج",
  metro: "مترو",
  train: "قطار",
  Open_Palm: "عسلامة",
  Closed_Fist: "وقف",
  Thumb_Up: "ايه",
  Thumb_Down: "لا",
  Victory: "بالسلامة",
  Pointing_Up: "استنى",
  OK_Sign: "باهي",
  Three_Fingers: "3",
  Four_Fingers: "4",
  Shaka_Sign: "مبروك",
};

describe("vocabulary", () => {
  it("matches the deployed model's label -> word contract exactly", () => {
    expect({ ...WORD_BY_LABEL }).toEqual(DEPLOYED_MODEL_CONTRACT);
  });

  it("has 33 signs: 23 Tunisian Sign Language + 10 universal", () => {
    expect(SIGN_COUNT).toBe(33);
    expect(TUNSL_SIGN_COUNT).toBe(23);
    expect(UNIVERSAL_SIGN_COUNT).toBe(10);
  });

  it("has unique model labels", () => {
    const labels = SIGNS.map((sign) => sign.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("never maps a negative label to a word", () => {
    for (const label of NEGATIVE_LABELS) {
      expect(WORD_BY_LABEL[label]).toBeUndefined();
    }
  });

  it("gives every sign a word and both glosses", () => {
    for (const sign of SIGNS) {
      expect(sign.word.trim(), sign.label).not.toBe("");
      expect(sign.gloss.en.trim(), sign.label).not.toBe("");
      expect(sign.gloss.fr.trim(), sign.label).not.toBe("");
    }
  });

  it("lists every category exactly once, covering all signs", () => {
    expect(new Set(SIGN_CATEGORIES).size).toBe(SIGN_CATEGORIES.length);
    const grouped = SIGN_CATEGORIES.flatMap((category) => signsByCategory(category));
    expect(grouped).toHaveLength(SIGNS.length);
  });

  it("keeps universal gestures and the HaGRID source aligned", () => {
    for (const sign of SIGNS) {
      expect(sign.category === "universal", sign.label).toBe(sign.source === "hagrid");
    }
  });
});

describe("negative labels", () => {
  it("include the empty name the model gives its no-gesture class", () => {
    expect(NEGATIVE_LABELS.has("")).toBe(true);
    expect(NEGATIVE_LABELS.has("none")).toBe(true);
    expect(NEGATIVE_LABELS.has("None")).toBe(true);
  });
});

describe("hand shapes", () => {
  const tunslLabels = SIGNS.filter((sign) => sign.source === "tunsl").map((sign) => sign.label);

  it("exist for every Tunisian Sign Language sign, and for nothing else", () => {
    expect(Object.keys(TUNSL_HANDSHAPES).sort()).toEqual([...tunslLabels].sort());
  });

  it("each have 21 finite landmarks, a unit palm, and a sane size", () => {
    for (const [label, shape] of Object.entries(TUNSL_HANDSHAPES)) {
      expect(shape, label).toHaveLength(HAND_LANDMARK_COUNT);
      for (const point of shape) {
        expect(point, label).toHaveLength(3);
        for (const value of point) expect(Number.isFinite(value), label).toBe(true);
      }
      const wrist = shape[0];
      const middleKnuckle = shape[9];
      if (!wrist || !middleKnuckle) throw new Error(`${label} is missing landmarks`);
      const palm = Math.hypot(middleKnuckle[0] - wrist[0], middleKnuckle[1] - wrist[1]);
      expect(palm, label).toBeCloseTo(1, 2);
      for (const [x, y] of shape) {
        expect(Math.abs(x), label).toBeLessThan(4);
        expect(Math.abs(y), label).toBeLessThan(4);
      }
    }
  });
});
