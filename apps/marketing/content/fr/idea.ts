import type { Dictionary } from "..";

export const idea: Dictionary["idea"] = {
  derja: "الفكرة",
  title: "Le téléphone qu'il a déjà en poche devient sa voix.",
  lead: "Pas d'appareil spécial. Pas d'Internet. Pas besoin d'attendre que quelqu'un traduise. Sami fait ses signes devant la caméra, et le téléphone dit ses mots à voix haute.",
  /** The two comic panels that finish Sami's story from the problem section. */
  comic: {
    signing: {
      derja: "سامي حلّ صوتي وبدا يشير قدّام الكاميرا.",
      caption: "Sami ouvre Souty et fait ses signes devant la caméra.",
      alt: "Sami fait des signes devant un téléphone où Souty est ouvert.",
    },
    speaking: {
      derja: "التليفون نطق بصوت عالي… والموظّف فهم!",
      caption: "Le téléphone parle à voix haute. L'agent comprend, et peut aider Sami.",
      alt: "Le téléphone parle à voix haute et l'agent sourit.",
    },
  },
  /** Shown in the last panel's speech bubble: "deaf · hospital". Keep it in Tunisian Arabic. */
  comicBubble: "أصم · سبيطار",
  stepsTitle: "Trois gestes, c'est tout",
  stepsLead: "Essayez le deuxième vous-même : appuyez sur le bouton et maintenez-le.",
  steps: {
    point: {
      derja: "وجّه الكاميرا",
      title: "Orientez la caméra",
      body: "Posez le téléphone debout devant vous, la caméra tournée vers vos mains.",
    },
    hold: {
      derja: "أشّر واستنى",
      title: "Maintenez votre signe",
      body: "Gardez votre signe immobile un instant. L'anneau se remplit, et le mot est validé.",
    },
    speak: {
      derja: "اضغط ويتكلّم",
      title: "Appuyez, et il parle",
      body: "Un seul appui, et le téléphone dit votre phrase à voix haute.",
    },
  },
  /** The press-and-hold button of step 2. */
  hold: {
    label: "Maintenez appuyé pour valider un signe",
    idleDerja: "اضغط وأمسك",
    idle: "maintenez appuyé",
    holdingDerja: "أمسك…",
    holding: "continuez",
    locked: "validé !",
    statusHolding: "Maintenez… maintenez…",
    statusSuccess: "Bravo ! Le mot est validé.",
    statusTooShort: "Encore un peu !",
  },
  /** The round speaker button of step 3. */
  speak: {
    label: "Faire parler le téléphone",
    /** Spoken aloud and shown under the button. Keep it in Tunisian Arabic. */
    utterance: "أصم، بابا، سبيطار، الخميس",
    /** What the spoken words mean, for readers who do not read Arabic. */
    meaning: "sourd, papa, hôpital, jeudi",
    noVoice: "Cet appareil n'a pas de voix arabe : vous ne l'entendrez donc pas ici.",
  },
};
