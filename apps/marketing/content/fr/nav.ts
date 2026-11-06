import type { Dictionary } from "..";

export const nav: Dictionary["nav"] = {
  skipToContent: "Aller au contenu",
  homeLabel: "Souty, retour en haut de page",
  sectionsLabel: "Sections",
  openMenu: "Ouvrir le menu",
  closeMenu: "Fermer le menu",
  /** Keep these short (about 14 letters at most): all five sit on one line in the header. */
  links: {
    problem: "Le problème",
    idea: "L'idée",
    product: "Ce qui existe",
    roadmap: "Les étapes",
    vision: "Vision",
  },
  /** Shortened to "appli" here only: this button shares the header bar with the five links. */
  openApp: "Ouvrir l'appli",
  languageLabel: "Langue",
  /** Read aloud by screen readers after a link that opens a new tab. Never shown. */
  newTab: "(s'ouvre dans un nouvel onglet)",
};
