import type { Dictionary } from "..";
import type { MilestoneStatus } from "../shared";

/*
 * Everything after the first milestone is a plan. The French says so with
 * the future tense, so no planned step can be read as something done.
 */
export const roadmap: Dictionary["roadmap"] = {
  derja: "وين ماشين؟",
  title: "Où nous allons",
  lead: "De 33 signes en Tunisie à toutes les langues des signes du monde. Une étape à la fois, chaque étape décidée avec les personnes sourdes.",
  statusLabels: {
    shipped: "Réalisé",
    next: "Prochaine étape",
    later: "Ensuite",
    vision: "Vision",
  },
  /** Sticker on the milestone that is already shipped. */
  nowLabel: "Nous sommes ici",
  milestones: [
    {
      status: "shipped" as MilestoneStatus,
      horizon: "Aujourd'hui",
      title: "La langue des signes tunisienne, hors ligne, sur n'importe quel téléphone",
      body: "L'application est disponible : 33 signes, des phrases construites mot à mot et dites en arabe tunisien, le tout installable et entièrement hors ligne.",
      points: ["33 signes", "Fonctionne hors ligne", "Gratuit et confidentiel"],
    },
    {
      status: "next" as MilestoneStatus,
      horizon: "Les 6 prochains mois",
      title: "Des mots choisis par les personnes sourdes",
      body: "Ce sont les personnes sourdes et leurs associations qui choisiront les 50 prochains signes, pas nous. Nous les enregistrerons ensemble, et les signeurs seront rémunérés pour leur temps.",
      points: [
        "Co-conception avec les associations de personnes sourdes et les interprètes",
        "Plus d'exemples pour chaque signe",
        "Une meilleure précision, signe par signe",
      ],
    },
    {
      status: "next" as MilestoneStatus,
      horizon: "Les 6 prochains mois",
      title: "Des essais pilotes dans de vrais services publics",
      body: "Souty à de vrais guichets : services sociaux, dispensaires, municipalités. Nous mesurerons une seule chose : une personne sourde peut-elle être servie sans interprète ?",
      points: [
        "Des sites pilotes avec des institutions partenaires",
        "Les retours des utilisateurs sourds et du personnel",
        "Un rapport d'impact public",
      ],
    },
    {
      status: "later" as MilestoneStatus,
      horizon: "D'ici 12 mois",
      title: "Des signes en mouvement, à deux mains",
      body: "Un nouveau modèle qui lira le mouvement dans le temps, et non une seule image fixe. Il ouvrira la voie aux nombreux signes qui bougent ou qui demandent les deux mains.",
      points: ["Signes en mouvement", "Signes à deux mains", "Un vocabulaire bien plus large"],
    },
    {
      status: "later" as MilestoneStatus,
      horizon: "D'ici 12 mois",
      title: "Une vraie conversation dans les deux sens",
      body: "La réponse reviendra elle aussi : l'agent parlera, et Souty affichera ses mots à l'écran. La voix sera également proposée en français et en arabe standard.",
      points: [
        "La réponse orale transcrite en texte",
        "Voix en français et en arabe standard",
        "Un mode pensé pour les guichets",
      ],
    },
    {
      status: "later" as MilestoneStatus,
      horizon: "Année 2",
      title: "Des applications natives pour iPhone et Android",
      body: "Souty sur l'App Store et Google Play : plus facile à trouver, plus rapide avec la caméra, et bien intégré aux réglages d'accessibilité de chaque téléphone.",
      points: ["App Store et Google Play", "Une reconnaissance plus rapide sur l'appareil", "Toujours gratuit, toujours hors ligne"],
    },
    {
      status: "later" as MilestoneStatus,
      horizon: "Année 2",
      title: "Dans tout le Maghreb et au Moyen-Orient",
      body: "Chaque pays a sa propre langue des signes. Nous les ajouterons une à une, chacune construite avec la communauté sourde du pays.",
      points: ["Algérie, Maroc, Libye", "Égypte et Moyen-Orient", "Un pack de langue par pays"],
    },
    {
      status: "vision" as MilestoneStatus,
      horizon: "L'objectif",
      title: "Toutes les langues des signes du monde",
      body: "Plus de 300 langues des signes, une seule application. Toute communauté sourde pourra enregistrer ses signes et publier son propre pack de langue.",
      points: [
        "Un pack de langue des signes pour chaque pays",
        "Des outils ouverts pour les communautés",
        "Une idée née en Tunisie, partagée avec le monde",
      ],
    },
  ],
  extrasTitle: "Également dans nos plans",
  extrasLead: "D'autres étapes auxquelles nous croyons. Leur ordre sera décidé avec nos utilisateurs et nos partenaires.",
  extras: {
    studio: {
      title: "Souty Studio",
      body: "Un outil d'enregistrement simple, pour que toute association de personnes sourdes puisse filmer de nouveaux signes et enrichir le vocabulaire de sa langue.",
    },
    institutions: {
      title: "Souty pour les institutions",
      body: "Un mode guichet, avec une formation du personnel, pour les ministères, les hôpitaux, les banques et les transports. Les institutions paient ; les personnes sourdes, jamais.",
    },
    emergency: {
      title: "Mode urgence et santé",
      body: "Les phrases les plus urgentes en un seul appui, et un vocabulaire médical construit avec des professionnels de santé.",
    },
    learn: {
      title: "Mode apprentissage",
      body: "Pour que les familles, les camarades de classe et le personnel apprennent les signes de base dans la même application, et que la compréhension aille dans les deux sens.",
    },
    lowEnd: {
      title: "Pensé pour les téléphones d'entrée de gamme",
      body: "Des modèles plus petits et plus rapides, pour que Souty fonctionne bien sur les téléphones à petit prix que la plupart des gens possèdent vraiment.",
    },
    openData: {
      title: "Des jeux de données de signes ouverts",
      body: "Des enregistrements partagés librement, avec l'accord des signeurs, pour que les chercheurs du monde entier puissent s'en servir.",
    },
  },
};
