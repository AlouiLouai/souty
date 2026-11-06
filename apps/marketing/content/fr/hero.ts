import type { Dictionary } from "..";

export const hero: Dictionary["hero"] = {
  /** Tunisian Arabic headline, split so the middle part can be highlighted. Same in every language. */
  derja: { before: "يديك تحكي… ", highlight: "وصوتي", after: " يسمّع الكلام" },
  title: "Vos mains parlent. Souty les fait entendre.",
  lead: "Souty est une application qui regarde les signes d'une personne sourde et les dit à voix haute, en arabe tunisien. Elle fonctionne sur n'importe quel téléphone, même sans Internet.",
  badges: ["Gratuit", "Fonctionne hors ligne", "Rien ne quitte le téléphone"],
  primaryCta: "Ouvrir l'application",
  secondaryCta: "Voir comment ça marche",
  /** Followed by the app's address as a link. */
  liveNote: "Disponible dès aujourd'hui sur",
  mascotAlt: "Souty, un téléphone souriant qui fait bonjour d'une main",
  /** What the mascot says, in Tunisian Arabic ("hello!"). */
  bubble: "عسلامة!",
  sayHi: {
    idle: "Faire parler Souty",
    /** Spoken aloud: "Hello! I am Souty". */
    utterance: "عسلامة! أنا صوتي",
    /** Shown on the button while the phone speaks. Tunisian Arabic. */
    spoken: "عسلامة!",
    /** Shown on the button when the device has no Arabic voice. Keep it short. */
    noVoice: "Pas de voix arabe ici",
  },
};
