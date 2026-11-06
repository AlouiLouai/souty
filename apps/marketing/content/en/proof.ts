export const proof = {
  derja: "والحكاية الحقيقية؟",
  title: "The first real trial",
  /** Split so the middle part can be highlighted. */
  quote: {
    before: "A deaf friend tried Souty. He cried when he heard ",
    highlight: "his own sentence",
    after: " come out of the phone. Then he asked for one thing: more words.",
  },
  body: "That is now our mission: add the words of everyday life, chosen with deaf people themselves. He prefers to stay anonymous, but he is helping the team build what comes next.",
  pointsTitle: "Why you can trust what you see",
  /** Keyed, not listed: each point has its own icon in the page. */
  points: {
    product: {
      title: "A product, not a slide",
      body: "Installable today and tested on real phones, with a written test protocol for the signs.",
    },
    honest: {
      title: "Honest machine learning",
      body: "We checked all 4,423 training images, sign by sign, and kept only the 23 signs this model can truly learn.",
    },
    results: {
      title: "Results we can stand behind",
      body: "We found near-identical video frames shared between training and test data in the source dataset, and fixed the split so accuracy is not inflated.",
    },
    data: {
      title: "Built on Tunisian data",
      body: "Signs are learned from the open Tunisian Sign Language Dataset, recorded with ATILS, the Tunisian association of sign language interpreters.",
    },
  },
  difference: {
    title: "Why Souty is different",
    criterionHeader: "What matters",
    othersHeader: "Typical sign-language tools",
    soutyHeader: "Souty",
    rows: [
      { criterion: "Language", others: "Mostly American or European sign languages", souty: "Tunisian Sign Language" },
      { criterion: "Result", others: "Text on a screen, often in English", souty: "Tunisian Arabic, spoken out loud" },
      { criterion: "Connection", others: "Usually need the Internet", souty: "Works fully offline" },
      { criterion: "Equipment", others: "Often special sensors or new devices", souty: "Any smartphone camera" },
      { criterion: "Privacy", others: "Video often sent to servers", souty: "Nothing leaves the phone" },
      { criterion: "Cost", others: "Often a subscription or licence", souty: "Free" },
    ],
  },
};
