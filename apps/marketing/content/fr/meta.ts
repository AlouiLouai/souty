import type { Dictionary } from "..";

export const meta: Dictionary["meta"] = {
  /** Browser tab and search result title. */
  title: "Souty : vos mains parlent, votre téléphone leur donne une voix",
  description:
    "Souty transforme la langue des signes tunisienne en arabe tunisien parlé, sur tout smartphone. Tout se passe sur l'appareil, hors ligne, et c'est gratuit.",
  /**
   * Short line under the name on the social sharing image. Keep it under
   * 90 characters so it fits on two lines. Written without any punctuation
   * that needs a non-breaking space: the image renderer may not honor it.
   */
  ogTagline: "La langue des signes, dite à voix haute. Sur tout téléphone, hors ligne.",
  notFound: {
    title: "Cette page n'existe pas",
    body: "Il se peut que le lien soit ancien, ou que l'adresse contienne une faute de frappe.",
    action: "Retour à l'accueil",
  },
};
