/**
 * What a text-to-speech voice is told to say for each recordable label:
 * the word with its short vowels, in Tunisian pronunciation where that
 * differs from standard Arabic. Used by `voice generate` (scripts/voice.ts).
 *
 * Only the pronunciation lives here. The app still shows and speaks the
 * plain word from the vocabulary; `voiceText.test.ts` checks that each entry,
 * once its vowel marks are removed, is exactly that word.
 *
 * These are a first draft. A Tunisian speaker should listen to the result
 * and correct any word in this file, then run `voice generate <label>` again.
 */
export const VOICED: Readonly<Record<string, string>> = {
  // Requests
  assam: "أَصَمّ",
  labes: "لَابَاس",
  oui: "إِيهْ",
  non: "لَا",
  siye7a: "سِيَاحَة",
  ta3raf: "تَعْرِفْ",
  "5adamet": "خِدْمَات",
  "3aslema": "عَسْلَامَة",
  demande: "مَطْلَب",
  cv: "سِي فِي",
  n3awnek: "نْعَاوْنِكْ",
  nekteblk: "نِكْتِبْلَكْ",
  t7eb: "تْحِبّ",
  enti: "إِنْتِي",
  barnamjk: "بَرْنَامْجِكْ",
  ta9ra: "تِقْرَا",
  ta3lim: "تَعْلِيم",
  se7a: "صِحَّة",
  tha9afa: "ثَقَافَة",
  chabeb: "شَبَاب",
  radio: "رَادْيُو",
  telvza: "تِلْفِزَة",
  // Places
  mostawsaf: "مُسْتَوْصَف",
  sbitar: "سْبِيطَار",
  baladya: "بَلَدِيَّة",
  wzara: "وِزَارَة",
  ma7kma: "مَحْكْمَة",
  bousta: "بُوسْطَة",
  banka: "بَنْكَة",
  dar: "دَار",
  // Family
  bent: "بِنْت",
  bou: "بَابَا",
  eben: "اِبْن",
  jad: "جَدّ",
  jadda: "جَدَّة",
  mar2a: "مَرْأَة",
  tfol: "طِفْل",
  om: "مَامَا",
  "3ayla": "عَايْلَة",
  "5ou": "خُو",
  o5t: "أُخْت",
  "5al-3am": "عَمّ",
  // Days
  "5mis": "الخَمِيس",
  sebt: "السَّبْت",
  thnin: "الِاثْنِين",
  lyoum: "اليَوْم",
  thleth: "الثُّلَاثَاء",
  erb3a: "الإِرْبِعَاء",
  jom3a: "الجُمْعَة",
  a7ad: "الأَحَد",
  // Transport
  car: "سَيَّارَة",
  louage: "لُوَاج",
  metro: "مِتْرُو",
  train: "قِطَار",
  taxi: "تَاكْسِي",
  // Universal gestures: the nine words of the sample sentence, and the digit 4
  Open_Palm: "مَرْحْبَا",
  Pointing_Up: "أَنَا",
  Shaka_Sign: "جَوْهَر",
  Victory: "حَلَّاق",
  Thumb_Down: "مِنْ سِيدِي بُوزِيد",
  Thumb_Up: "نْحِبّ",
  Three_Fingers: "نْحِلّ",
  OK_Sign: "بَاتِينْدَة",
  Closed_Fist: "مُبَادِر ذَاتِي",
  Four_Fingers: "أَرْبَعَة",
};
