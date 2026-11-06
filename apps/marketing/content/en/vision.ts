import type { PackStage } from "../shared";

export const vision = {
  derja: "صوتي للعالم الكل",
  title: "One app. Every sign language.",
  lead: "Sign language is not universal. There are more than 300 of them, and each country's deaf community has its own. Our plan: every new language is a pack of signs added to the same app, not a new app.",
  stageLabels: {
    live: "Live today",
    maghreb: "Next: the Maghreb",
    mena: "Then: the Middle East",
    world: "And the world",
  },
  /** Sign languages, grouped by rollout stage. Names are the translatable part. */
  packs: [
    { stage: "live" as PackStage, name: "Tunisian Sign Language" },
    { stage: "maghreb" as PackStage, name: "Algerian Sign Language" },
    { stage: "maghreb" as PackStage, name: "Moroccan Sign Language" },
    { stage: "maghreb" as PackStage, name: "Libyan Sign Language" },
    { stage: "mena" as PackStage, name: "Egyptian Sign Language" },
    { stage: "mena" as PackStage, name: "Jordanian Sign Language" },
    { stage: "mena" as PackStage, name: "Lebanese Sign Language" },
    { stage: "mena" as PackStage, name: "Saudi Sign Language" },
    { stage: "mena" as PackStage, name: "Emirati Sign Language" },
    { stage: "world" as PackStage, name: "French Sign Language" },
    { stage: "world" as PackStage, name: "American Sign Language" },
    { stage: "world" as PackStage, name: "British Sign Language" },
    { stage: "world" as PackStage, name: "Brazilian Sign Language" },
    { stage: "world" as PackStage, name: "Indian Sign Language" },
    { stage: "world" as PackStage, name: "Kenyan Sign Language" },
  ],
  morePacks: "and hundreds more",
  packsNote: "Only Tunisian Sign Language is live today. The other languages are our plan, and each one will be built with its own deaf community.",
  howTitle: "How a new language is added",
  how: [
    {
      title: "The community records",
      body: "A country's deaf association films its own signs. Its language stays in its hands.",
    },
    {
      title: "Souty learns",
      body: "A model is trained for that sign language and tested with the people who use it.",
    },
    {
      title: "Everyone downloads it once",
      body: "The language pack is saved on the phone. After that, it works offline, anywhere.",
    },
  ],
  globeAlt: "A simple globe drawn with lines and dots. One green dot pulses for Tunisian Sign Language, live today. Dotted paths lead from it to more dots: the sign languages still to come.",
};
