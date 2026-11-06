import type { MilestoneStatus } from "../shared";

export const roadmap = {
  derja: "وين ماشين؟",
  title: "Where we are going",
  lead: "From 33 signs in Tunisia to every sign language in the world. One step at a time, each step decided with deaf people.",
  statusLabels: {
    shipped: "Done",
    next: "Next",
    later: "After that",
    vision: "Vision",
  },
  /** Sticker on the milestone that is already shipped. */
  nowLabel: "We are here",
  milestones: [
    {
      status: "shipped" as MilestoneStatus,
      horizon: "Today",
      title: "Tunisian Sign Language, offline, on any phone",
      body: "The app is live: 33 signs, sentences built word by word, spoken in Tunisian Arabic, installable and fully offline.",
      points: ["33 signs", "Works offline", "Free and private"],
    },
    {
      status: "next" as MilestoneStatus,
      horizon: "Next 6 months",
      title: "Words chosen by deaf people",
      body: "Deaf people and their associations decide the next 50 signs, not us. We record them together, and pay signers for their time.",
      points: ["Co-design with deaf associations and interpreters", "More examples for every sign", "Higher accuracy, sign by sign"],
    },
    {
      status: "next" as MilestoneStatus,
      horizon: "Next 6 months",
      title: "Pilots in real public services",
      body: "Souty at real counters: social services, clinics, town halls. We measure one thing: can a deaf person get served without an interpreter?",
      points: ["Pilot sites with partner institutions", "Feedback from deaf users and staff", "A public impact report"],
    },
    {
      status: "later" as MilestoneStatus,
      horizon: "Within 12 months",
      title: "Signs in motion, with two hands",
      body: "A new model that reads movement over time, not one still image. It unlocks the many signs that move or need both hands.",
      points: ["Movement-based signs", "Two-handed signs", "Much larger vocabulary"],
    },
    {
      status: "later" as MilestoneStatus,
      horizon: "Within 12 months",
      title: "A real two-way conversation",
      body: "The answer comes back too: the agent speaks, and Souty shows the words on screen. Voice output in French and Standard Arabic as well.",
      points: ["Speech to text for the reply", "French and Standard Arabic voices", "A mode made for service counters"],
    },
    {
      status: "later" as MilestoneStatus,
      horizon: "Year 2",
      title: "Native apps for iPhone and Android",
      body: "Souty in the App Store and Google Play: easier to find, faster on the camera, and at home with each phone's accessibility settings.",
      points: ["App Store and Google Play", "Faster recognition on the device", "Still free, still offline"],
    },
    {
      status: "later" as MilestoneStatus,
      horizon: "Year 2",
      title: "Across the Maghreb and the Middle East",
      body: "Each country has its own sign language. We add them one by one, each built with that country's deaf community.",
      points: ["Algeria, Morocco, Libya", "Egypt and the Middle East", "One language pack per country"],
    },
    {
      status: "vision" as MilestoneStatus,
      horizon: "The goal",
      title: "Every sign language in the world",
      body: "More than 300 sign languages, one app. Any deaf community can record its signs and publish its own language pack.",
      points: ["A sign language pack for every country", "Open tools for communities", "Tunisia's idea, shared with the world"],
    },
  ],
  extrasTitle: "Also on our map",
  extrasLead: "More milestones we believe in. Their order will be decided with our users and partners.",
  extras: {
    studio: {
      title: "Souty Studio",
      body: "A simple recording tool, so any deaf association can film new signs and grow its language's vocabulary.",
    },
    institutions: {
      title: "Souty for institutions",
      body: "A counter mode with staff training for ministries, hospitals, banks and transport. Institutions pay; deaf people never do.",
    },
    emergency: {
      title: "Emergency and health mode",
      body: "The most urgent sentences in one tap, and a medical vocabulary built with health professionals.",
    },
    learn: {
      title: "Learn mode",
      body: "Families, classmates and staff learn basic signs from the same app, so understanding goes both ways.",
    },
    lowEnd: {
      title: "Made for entry-level phones",
      body: "Smaller, faster models so Souty runs well on the low-cost phones most people actually own.",
    },
    openData: {
      title: "Open sign datasets",
      body: "Recordings shared openly, with signers' consent, so researchers everywhere can build on them.",
    },
  },
};
