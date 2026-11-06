export const idea = {
  derja: "الفكرة",
  title: "The phone already in his pocket becomes his voice.",
  lead: "No special device. No Internet. No waiting for someone to translate. Sami signs in front of the camera, and the phone says his words out loud.",
  /** The two comic panels that finish Sami's story from the problem section. */
  comic: {
    signing: {
      derja: "سامي حلّ صوتي وبدا يشير قدّام الكاميرا.",
      caption: "Sami opens Souty and signs in front of the camera.",
      alt: "Sami signs in front of a phone running Souty.",
    },
    speaking: {
      derja: "التليفون نطق بصوت عالي… والموظّف فهم!",
      caption: "The phone speaks out loud. The agent understands, and can help Sami.",
      alt: "The phone speaks out loud and the agent smiles.",
    },
  },
  /** Shown in the last panel's speech bubble: "deaf · hospital". Keep it in Tunisian Arabic. */
  comicBubble: "أصم · سبيطار",
  stepsTitle: "Three gestures, that is all",
  stepsLead: "Try the second one yourself: press the button and hold it.",
  steps: {
    point: {
      derja: "وجّه الكاميرا",
      title: "Point the camera",
      body: "Stand the phone in front of you, with the camera facing your hands.",
    },
    hold: {
      derja: "أشّر واستنى",
      title: "Hold your sign",
      body: "Keep your sign still for a moment. The ring fills up, and the word is locked in.",
    },
    speak: {
      derja: "اضغط ويتكلّم",
      title: "Tap, and it speaks",
      body: "One touch, and the phone says your sentence out loud.",
    },
  },
  /** The press-and-hold button of step 2. */
  hold: {
    label: "Press and hold to lock in a sign",
    idleDerja: "اضغط وأمسك",
    idle: "press and hold",
    holdingDerja: "أمسك…",
    holding: "keep going",
    locked: "locked in!",
    statusHolding: "Hold it… hold it…",
    statusSuccess: "Well done! The word is locked in.",
    statusTooShort: "A little longer!",
  },
  /** The round speaker button of step 3. */
  speak: {
    label: "Make the phone speak",
    /** Spoken aloud and shown under the button. Keep it in Tunisian Arabic. */
    utterance: "أصم، بابا، سبيطار، الخميس",
    /** What the spoken words mean, for readers who do not read Arabic. */
    meaning: "deaf, dad, hospital, Thursday",
    noVoice: "This device has no Arabic voice, so you will not hear it here.",
  },
};
