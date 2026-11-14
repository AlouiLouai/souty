import { describe, expect, it } from "vitest";
import {
  HAND_LANDMARK_COUNT,
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
  // The sample sentence: nine reliable gestures standing in for its words (deliberate, not a refactor).
  Open_Palm: "مرحباً",
  Pointing_Up: "أنا",
  Shaka_Sign: "جوهر",
  Victory: "حلاق",
  Thumb_Down: "من سيدي بوزيد",
  Thumb_Up: "نحب",
  Three_Fingers: "نحل",
  OK_Sign: "باتيندة",
  Closed_Fist: "مبادر ذاتي",
  Four_Fingers: "4",
  // Added with the two-hand model. Draft words, marked toConfirm until ATILS confirms them.
  "3aslema": "عسلامة",
  demande: "مطلب",
  cv: "سي في",
  n3awnek: "نعاونك",
  nekteblk: "نكتبلك",
  t7eb: "تحب",
  enti: "إنتي",
  barnamjk: "برنامجك",
  ta9ra: "تقرا",
  ta3lim: "تعليم",
  se7a: "صحة",
  tha9afa: "ثقافة",
  chabeb: "شباب",
  radio: "راديو",
  telvza: "تلفزة",
  baladya: "بلدية",
  wzara: "وزارة",
  ma7kma: "محكمة",
  bousta: "بوسطة",
  banka: "بنكة",
  dar: "دار",
  om: "ماما",
  "3ayla": "عايلة",
  "5ou": "خو",
  o5t: "أخت",
  "5al-3am": "عمّ",
  lyoum: "اليوم",
  thleth: "الثلاثاء",
  erb3a: "الإربعاء",
  jom3a: "الجمعة",
  a7ad: "الأحد",
  taxi: "تاكسي",
};

describe("vocabulary", () => {
  it("matches the deployed model's label -> word contract exactly", () => {
    expect({ ...WORD_BY_LABEL }).toEqual(DEPLOYED_MODEL_CONTRACT);
  });

  it("has 65 signs: 55 Tunisian Sign Language + 10 universal", () => {
    expect(SIGN_COUNT).toBe(65);
    expect(TUNSL_SIGN_COUNT).toBe(55);
    expect(UNIVERSAL_SIGN_COUNT).toBe(10);
  });

  it("has unique model labels", () => {
    const labels = SIGNS.map((sign) => sign.label);
    expect(new Set(labels).size).toBe(labels.length);
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

  it("says what to check on every draft word", () => {
    for (const sign of SIGNS) {
      if (sign.toConfirm !== undefined) expect(sign.toConfirm.trim(), sign.label).not.toBe("");
    }
  });

  it("keeps universal gestures and the HaGRID source aligned", () => {
    for (const sign of SIGNS) {
      expect(sign.category === "universal", sign.label).toBe(sign.source === "hagrid");
    }
  });
});

describe("hand shapes", () => {
  const tunslLabels = SIGNS.filter((sign) => sign.source === "tunsl").map((sign) => sign.label);

  it("exist only for Tunisian Sign Language signs", () => {
    // Signs added after the shapes were generated have none yet; the
    // marketing site then shows no drawing. The training notebook exports
    // a shape for every sign (handshapes.ts in its export folder).
    const extra = Object.keys(TUNSL_HANDSHAPES).filter((label) => !tunslLabels.includes(label));
    expect(extra).toEqual([]);
  });

  it("exist for every confirmed Tunisian Sign Language sign", () => {
    const confirmed = SIGNS.filter((sign) => sign.source === "tunsl" && sign.toConfirm === undefined);
    const missing = confirmed.map((sign) => sign.label).filter((label) => !(label in TUNSL_HANDSHAPES));
    expect(missing).toEqual([]);
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
