import type { Dictionary } from "..";

export const product: Dictionary["product"] = {
  derja: "شنوّة خدمنا لتوّا؟",
  title: "Pas une maquette. Une application qui fonctionne, disponible dès aujourd'hui.",
  lead: "Tout ce que montre cette section est déjà construit et fonctionne. Ouvrez l'application sur n'importe quel téléphone et essayez-la.",
  openApp: "Ouvrir l'application",
  stats: [
    { value: "33", label: "signes reconnus" },
    { value: "0", label: "image envoyée à un serveur" },
    { value: "0,7 s", label: "de maintien pour valider un mot" },
    { value: "2", label: "mains suivies en même temps" },
  ],
  features: {
    onDevice: {
      title: "L'IA fonctionne sur le téléphone",
      body: "La reconnaissance se fait sur l'appareil lui-même. Les images de la caméra sont lues en mémoire, puis oubliées. Elles ne quittent jamais le téléphone.",
    },
    offline: {
      title: "Fonctionne sans Internet",
      body: "Installez l'application une fois, et elle continue de fonctionner en mode avion : le modèle et l'application sont enregistrés sur le téléphone.",
    },
    tunisian: {
      title: "La Tunisie d'abord",
      body: "De vrais signes de la langue des signes tunisienne, dits en arabe tunisien, avec un écran en arabe, de droite à gauche.",
    },
    twoHands: {
      title: "Deux mains à la fois",
      body: "Chaque main est suivie et reconnue séparément, en même temps que l'autre.",
    },
    accessible: {
      title: "Accessible dès la conception",
      body: "Une vibration quand un mot est validé, de grands boutons, une première utilisation guidée et un tracé de la main lisible sur toutes les couleurs de peau.",
    },
    free: {
      title: "Gratuit pour tous",
      body: "Pas de serveur, pas de compte, pas d'abonnement. Une seule mise en ligne suffit, quel que soit le nombre de personnes.",
    },
  },
  pipeline: {
    title: "Comment ça marche, en trente secondes",
    steps: [
      { title: "Caméra", body: "La caméra du téléphone filme les mains." },
      { title: "Suivi des mains", body: "21 points sont repérés sur chaque main, dans chaque image, sur le téléphone." },
      {
        title: "Reconnaissance du signe",
        body: "Un modèle entraîné sur de vraies données de langue des signes tunisienne identifie le signe.",
      },
      {
        title: "Maintien pour valider",
        body: "Le signe doit rester stable pendant 0,7 seconde : les mouvements involontaires sont ainsi ignorés.",
      },
      { title: "Voix", body: "Les mots forment une phrase, et le téléphone la dit en arabe tunisien." },
    ],
    techLabel: "Sous le capot",
    tech: [
      "Application web installable (PWA)",
      "Suivi des mains MediaPipe",
      "Modèle sur mesure à 34 classes, 8 Mo",
      "Service worker pour le hors ligne",
      "Synthèse vocale sur l'appareil",
    ],
  },
  vocabulary: {
    /** {count} is filled from the real sign list, so the number never drifts. */
    title: "Les {count} signes que Souty comprend aujourd'hui",
    /** {tunsl} and {universal} are filled from the real sign list. */
    lead: "{tunsl} signes de la langue des signes tunisienne et {universal} gestes universels de la main : les mots d'une vraie visite dans un service public.",
    /** The two chip colours in the list below. */
    legend: {
      tunsl: "Langue des signes tunisienne",
      universal: "Gestes universels",
    },
    /** Shown next to each group name. {count} is the number of signs in the group. */
    countLabel: "{count} signes",
    categories: {
      requests: "Demandes",
      family: "Famille",
      destinations: "Lieux",
      days: "Jours",
      transport: "Transport",
      universal: "Gestes universels",
    },
  },
  playground: {
    derja: "إيجا نلعبو!",
    title: "Essayez l'idée ici même",
    lead: "Choisissez quelques mots. La main fait les signes, la phrase se construit, puis vous faites parler le téléphone.",
    canvasLabel: "Une main dessinée qui fait des signes",
    disclaimer: "Ce dessin sert à expliquer l'idée. Les vrais signes viennent de la langue des signes tunisienne.",
    chooseDerja: "اختار كلمة",
    choose: "Choisissez un mot",
    /** Accessible name of the sentence strip. */
    sentenceLabel: "Votre phrase",
    empty: "Votre phrase apparaît ici",
    speakDerja: "انطق الجملة",
    speak: "Dire la phrase",
    reset: "Recommencer",
    pickFirst: "Choisissez d'abord un mot ou deux.",
    /** {sentence} is replaced with the translated words. */
    spoken: "Le téléphone dit : « {sentence} »",
    noVoice: "Pas de voix arabe sur cet appareil. La phrase veut dire : « {sentence} ».",
    /** Placed between the translated words inside {sentence}. Arabic uses "، ". */
    listSeparator: ", ",
    openApp: "Utiliser la vraie application avec votre caméra",
  },
  offline: {
    derja: "ما فماش إنترنت؟ ماثمّاش مشكل",
    title: "Pas d'Internet ? Pas de problème.",
    body: "Souty fait tout à l'intérieur du téléphone. Rien n'est envoyé sur Internet, et vos images ne quittent jamais l'appareil. Essayez : coupez le réseau.",
    toggle: "Mode avion",
    illustrationAlt: "Un téléphone souriant sous un ciel où flotte un symbole Wi-Fi",
    offDerja: "الشبكة خدّامة، وصوتي خدّام",
    off: "Le réseau fonctionne, et Souty aussi.",
    onDerja: "ما فماش شبكة… وصوتي مازال خدّام!",
    on: "Plus de réseau, et Souty traduit toujours. Rien n'avait besoin d'Internet.",
  },
  limits: {
    title: "Ce que Souty ne sait pas encore faire",
    lead: "Nous préférons vous le dire nous-mêmes.",
    items: [
      {
        title: "Des signes immobiles uniquement",
        body: "Le modèle actuel lit une seule image à la fois. Les signes qui demandent un mouvement ne sont pas encore reconnus.",
      },
      {
        title: "Une main par signe",
        body: "Les deux mains sont suivies, mais chacune est lue séparément. Les signes faits avec les deux mains ensemble ne sont pas encore reconnus.",
      },
    ],
    next: "Lever ces deux limites fait partie de notre feuille de route.",
    /** Link to the roadmap section, shown after `next`. */
    nextLink: "Voir la feuille de route",
  },
};
