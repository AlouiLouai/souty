import type { Dictionary } from "..";

export const problem: Dictionary["problem"] = {
  derja: "وين المشكل؟",
  title: "Une personne sourde ne peut pas demander de l'aide dans sa propre langue.",
  lead: "Au guichet des services sociaux, au dispensaire ou à la municipalité, très peu de gens comprennent la langue des signes. Une demande simple comme « mon fils a besoin d'un médecin jeudi » tourne au jeu de devinettes.",
  /** Read to screen readers as the name of the list of numbers. */
  statsLabel: "La perte auditive et les langues des signes en chiffres",
  /**
   * Each card reads as one sentence: value, unit, label.
   * `value` is the big number; keep it to a few characters.
   *
   * The links point to the official French version of each source page, and
   * the wording follows those pages. The United Nations page says "environ
   * 70 millions" in French (the English page says "more than 70 million"),
   * so the second card stays on the careful side: "70", not "70+".
   */
  stats: [
    {
      value: "430",
      unit: "millions de personnes",
      label: "dans le monde ont besoin de services de réadaptation pour une perte auditive incapacitante.",
      source: "Organisation mondiale de la Santé",
      href: "https://www.who.int/fr/news-room/fact-sheets/detail/deafness-and-hearing-loss",
    },
    {
      value: "70",
      unit: "millions de personnes sourdes",
      label: "vivent dans le monde, selon les estimations.",
      source: "Nations Unies",
      href: "https://www.un.org/fr/observances/sign-languages-day",
    },
    {
      value: "300+",
      unit: "langues des signes",
      label: "existent dans le monde. La Tunisie a la sienne.",
      source: "Nations Unies",
      href: "https://www.un.org/fr/observances/sign-languages-day",
    },
  ],
  /** Shown right before the linked name of the source. */
  sourceLabel: "Source :",
  /** Read to screen readers after every link that leaves the site. */
  newTabHint: "(s'ouvre dans un nouvel onglet)",
  barriersTitle: "Trois murs, chaque jour",
  /** Order matters: each wall has its own icon (staff, writing, dependence). */
  barriers: [
    {
      title: "Le personnel ne connaît pas la langue des signes",
      body: "Agents d'accueil, guichetiers et infirmiers ont rarement appris la langue des signes tunisienne.",
    },
    {
      title: "L'écrit n'est pas une solution",
      body: "Pour beaucoup de personnes sourdes, la langue des signes est la première langue. L'arabe écrit vient en second : le papier et le stylo sont un obstacle de plus.",
    },
    {
      title: "Toujours dépendre de quelqu'un",
      body: "Sans un proche ou un interprète, même une demande simple peut échouer : un rendez-vous manqué, un besoin que personne n'a compris.",
    },
  ],
  /** First panel of Sami's three-panel comic. Panels 2 and 3 live in the idea slice. */
  story: {
    titleDerja: "تعرّف على سامي",
    title: "Voici Sami",
    intro: "Sami est un personnage inventé, mais son histoire est celle de beaucoup de personnes sourdes.",
    derja: "سامي أصم. جا للإدارة باش يطلب خدمة… والموظّف ما فهموش.",
    caption: "Sami est sourd. Au guichet, l'agent ne comprend pas sa langue des signes.",
    alt: "À un guichet, un agent a l'air perplexe pendant que Sami lui parle en langue des signes.",
    /** Drawn above the puzzled agent. Arabic uses the mirrored mark: ؟ */
    questionMark: "?",
    /** Link that scrolls down to the rest of the comic. */
    continues: "Voir la suite",
  },
};
