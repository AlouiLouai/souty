export const problem = {
  derja: "وين المشكل؟",
  title: "A deaf person cannot ask for help in their own language.",
  lead: "At a social services desk, a clinic or a town hall, very few people understand sign language. A simple request like “my son needs a doctor on Thursday” turns into guesswork.",
  /** Read to screen readers as the name of the list of numbers. */
  statsLabel: "Hearing loss and sign languages in numbers",
  /**
   * Each card reads as one sentence: value, unit, label.
   * `value` is the big number; keep it to a few characters.
   */
  stats: [
    {
      value: "430",
      unit: "million people",
      label: "in the world need rehabilitation for disabling hearing loss.",
      source: "World Health Organization",
      href: "https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss",
    },
    {
      value: "70+",
      unit: "million deaf people",
      label: "live around the world.",
      source: "United Nations",
      href: "https://www.un.org/en/observances/sign-languages-day",
    },
    {
      value: "300+",
      unit: "sign languages",
      label: "exist in the world. Tunisia has its own.",
      source: "United Nations",
      href: "https://www.un.org/en/observances/sign-languages-day",
    },
  ],
  /** Shown right before the linked name of the source. */
  sourceLabel: "Source:",
  /** Read to screen readers after every link that leaves the site. */
  newTabHint: "(opens in a new tab)",
  barriersTitle: "Three walls, every single day",
  /** Order matters: each wall has its own icon (staff, writing, dependence). */
  barriers: [
    {
      title: "Staff do not sign",
      body: "Receptionists, agents and nurses rarely know Tunisian Sign Language.",
    },
    {
      title: "Writing is not a way out",
      body: "For many deaf people, sign language is the first language. Written Arabic comes second, so pen and paper is one more barrier.",
    },
    {
      title: "Always depending on someone",
      body: "Without a relative or an interpreter, even a simple request can fail: a missed appointment, a need nobody understood.",
    },
  ],
  /** First panel of Sami's three-panel comic. Panels 2 and 3 live in the idea slice. */
  story: {
    titleDerja: "تعرّف على سامي",
    title: "Meet Sami",
    intro: "Sami is a made-up character, but his story is the story of many deaf people.",
    derja: "سامي أصم. جا للإدارة باش يطلب خدمة… والموظّف ما فهموش.",
    caption: "Sami is deaf. At the service desk, the agent does not understand his sign language.",
    alt: "At a service desk, an agent looks puzzled while Sami signs to him.",
    /** Drawn above the puzzled agent. Arabic uses the mirrored mark: ؟ */
    questionMark: "?",
    /** Link that scrolls down to the rest of the comic. */
    continues: "See what happens next",
  },
};
