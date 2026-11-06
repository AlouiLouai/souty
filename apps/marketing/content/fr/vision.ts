import type { Dictionary } from "..";
import type { PackStage } from "../shared";

export const vision: Dictionary["vision"] = {
  derja: "صوتي للعالم الكل",
  title: "Une seule application. Toutes les langues des signes.",
  lead: "La langue des signes n'est pas universelle. Il en existe plus de 300, et la communauté sourde de chaque pays a la sienne. Notre plan : chaque nouvelle langue sera un pack de signes ajouté à la même application, pas une nouvelle application.",
  stageLabels: {
    live: "Disponible aujourd'hui",
    maghreb: "Ensuite : le Maghreb",
    mena: "Puis : le Moyen-Orient",
    world: "Et le monde entier",
  },
  /** Sign languages, grouped by rollout stage. Names are the translatable part. */
  packs: [
    { stage: "live" as PackStage, name: "Langue des signes tunisienne" },
    { stage: "maghreb" as PackStage, name: "Langue des signes algérienne" },
    { stage: "maghreb" as PackStage, name: "Langue des signes marocaine" },
    { stage: "maghreb" as PackStage, name: "Langue des signes libyenne" },
    { stage: "mena" as PackStage, name: "Langue des signes égyptienne" },
    { stage: "mena" as PackStage, name: "Langue des signes jordanienne" },
    { stage: "mena" as PackStage, name: "Langue des signes libanaise" },
    { stage: "mena" as PackStage, name: "Langue des signes saoudienne" },
    { stage: "mena" as PackStage, name: "Langue des signes émirienne" },
    { stage: "world" as PackStage, name: "Langue des signes française" },
    { stage: "world" as PackStage, name: "Langue des signes américaine" },
    { stage: "world" as PackStage, name: "Langue des signes britannique" },
    { stage: "world" as PackStage, name: "Langue des signes brésilienne" },
    { stage: "world" as PackStage, name: "Langue des signes indienne" },
    { stage: "world" as PackStage, name: "Langue des signes kényane" },
  ],
  morePacks: "et des centaines d’autres",
  packsNote: "Seule la langue des signes tunisienne est disponible aujourd'hui. Les autres langues sont notre plan, et chacune sera construite avec sa propre communauté sourde.",
  /** A plan, like the rest of this section: the three steps are written in the future tense. */
  howTitle: "Comment une nouvelle langue sera ajoutée",
  how: [
    {
      title: "La communauté enregistre",
      body: "L'association de personnes sourdes d'un pays filmera ses propres signes. Sa langue restera entre ses mains.",
    },
    {
      title: "Souty apprend",
      body: "Un modèle sera entraîné pour cette langue des signes, puis testé avec les personnes qui l'utilisent.",
    },
    {
      title: "Chacun le télécharge une seule fois",
      body: "Le pack de langue sera enregistré sur le téléphone. Ensuite, il fonctionnera hors ligne, partout.",
    },
  ],
  globeAlt: "Un globe simple, dessiné avec des lignes et des points. Un point vert palpite pour la langue des signes tunisienne, disponible aujourd'hui. Des chemins en pointillé partent de ce point vers d'autres points : les langues des signes à venir.",
};
