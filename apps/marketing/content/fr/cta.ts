import type { Dictionary } from "..";

export const cta: Dictionary["cta"] = {
  derja: "جرّب صوتي وشاركها",
  title: "Essayez Souty maintenant, et parlez-en à quelqu'un qui en a besoin.",
  lead: "Ouvrez le lien sur un téléphone, autorisez la caméra et faites un signe. Vous connaissez une personne sourde, une famille, une association ? Envoyez-leur le lien.",
  qr: {
    title: "Scannez pour ouvrir l'application",
    alt: "Code QR qui ouvre l'application Souty",
    hint: "Pointez la caméra de votre téléphone vers le code.",
  },
  openApp: "Ouvrir Souty",
  /** Read by screen readers after the "Open Souty" link. */
  newTab: "s'ouvre dans un nouvel onglet",
  /** Three short facts shown as stickers under the link. */
  facts: ["Gratuit", "Sans compte", "Fonctionne hors ligne"],
  copy: {
    idle: "Copier le lien",
    done: "Copié",
    selected: "Sélectionné",
  },
  support: {
    title: "Ce que votre soutien rend possible",
    lead: "Souty fonctionne sur le téléphone lui-même : il n'y a donc aucun serveur à payer. Le soutien va aux personnes et aux preuves.",
    /** Keep the order: each item has a matching icon. */
    items: [
      {
        title: "Enregistrer des signes avec la communauté",
        body: "De nouvelles séances d'enregistrement avec des signeurs sourds et leurs associations. Les signeurs seront rémunérés pour leur travail.",
      },
      {
        title: "Des essais pilotes dans les services publics",
        body: "Des téléphones, de la logistique et la formation du personnel, pour tester Souty à de vrais guichets et mesurer le résultat.",
      },
      {
        title: "La recherche sur les signes en mouvement",
        body: "Le travail sur le prochain modèle, pour que Souty puisse lire le mouvement et les signes faits à deux mains.",
      },
    ],
  },
  partner: {
    title: "Travaillons ensemble",
    body: "Vous dirigez un service public, une association ou un programme d'inclusion ? Menons ensemble un essai pilote de Souty.",
    action: "Écrire à l'équipe",
    /** Email subject line for the contact link. A plain space before the colon: mail apps handle it best. */
    subject: "Souty : partenariat",
  },
};
