import type { Dictionary } from "..";

export const proof: Dictionary["proof"] = {
  derja: "والحكاية الحقيقية؟",
  title: "Le premier vrai essai",
  /** Split so the middle part can be highlighted. */
  quote: {
    before: "Un ami sourd a essayé Souty. Il a pleuré en entendant ",
    highlight: "sa propre phrase",
    after: " sortir du téléphone. Puis il a demandé une seule chose : plus de mots.",
  },
  body: "C'est devenu notre mission : ajouter les mots de la vie de tous les jours, choisis avec les personnes sourdes elles-mêmes. Il préfère rester anonyme, mais il aide l'équipe à construire la suite.",
  pointsTitle: "Pourquoi vous pouvez vous fier à ce que vous voyez",
  /** Keyed, not listed: each point has its own icon in the page. */
  points: {
    product: {
      title: "Un produit, pas une diapositive",
      body: "Installable dès aujourd'hui et testé sur de vrais téléphones, avec un protocole de test écrit pour les signes.",
    },
    honest: {
      title: "Un apprentissage automatique honnête",
      body: "Nous avons vérifié les 4 423 images d'entraînement, signe par signe, et gardé uniquement les 23 signes que ce modèle peut vraiment apprendre.",
    },
    results: {
      title: "Des résultats que nous pouvons défendre",
      body: "Dans le jeu de données d'origine, nous avons trouvé des images vidéo presque identiques, présentes à la fois dans les données d'entraînement et dans les données de test. Nous avons corrigé cette répartition pour ne pas gonfler la précision.",
    },
    data: {
      title: "Construit sur des données tunisiennes",
      body: "Les signes sont appris à partir du Tunisian Sign Language Dataset, un jeu de données ouvert enregistré avec l'ATILS, l'Association tunisienne des interprètes en langue des signes.",
    },
  },
  difference: {
    title: "Ce qui rend Souty différent",
    criterionHeader: "Ce qui compte",
    othersHeader: "Outils habituels pour la langue des signes",
    soutyHeader: "Souty",
    rows: [
      {
        criterion: "Langue",
        others: "Surtout les langues des signes américaine ou européennes",
        souty: "Langue des signes tunisienne",
      },
      { criterion: "Résultat", others: "Du texte à l'écran, souvent en anglais", souty: "De l'arabe tunisien, dit à voix haute" },
      { criterion: "Connexion", others: "Ont généralement besoin d'Internet", souty: "Fonctionne entièrement hors ligne" },
      {
        criterion: "Matériel",
        others: "Souvent des capteurs spéciaux ou de nouveaux appareils",
        souty: "La caméra de n'importe quel smartphone",
      },
      { criterion: "Vie privée", others: "Vidéo souvent envoyée à des serveurs", souty: "Rien ne quitte le téléphone" },
      { criterion: "Coût", others: "Souvent un abonnement ou une licence", souty: "Gratuit" },
    ],
  },
};
