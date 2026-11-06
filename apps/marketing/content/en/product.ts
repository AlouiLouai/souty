export const product = {
  derja: "شنوّة خدمنا لتوّا؟",
  title: "Not a mockup. A working app, live today.",
  lead: "Everything in this section is already built and running. Open it on any phone and try it.",
  openApp: "Open the live app",
  stats: [
    { value: "33", label: "signs recognized" },
    { value: "0", label: "images sent to a server" },
    { value: "0.7 s", label: "hold to confirm a word" },
    { value: "2", label: "hands followed at once" },
  ],
  features: {
    onDevice: {
      title: "The AI runs on the phone",
      body: "Recognition happens on the device itself. Camera images are read in memory, then forgotten. They never leave the phone.",
    },
    offline: {
      title: "Works with no Internet",
      body: "Install it once and it keeps working in airplane mode: the model and the app are stored on the phone.",
    },
    tunisian: {
      title: "Tunisian first",
      body: "Real Tunisian Sign Language signs, spoken in Tunisian Arabic, with an Arabic right-to-left screen.",
    },
    twoHands: {
      title: "Two hands at once",
      body: "Each hand is followed and recognized on its own, at the same time.",
    },
    accessible: {
      title: "Accessible by design",
      body: "A vibration when a word locks in, large buttons, a guided first use, and an overlay you can read on any skin tone.",
    },
    free: {
      title: "Free for everyone",
      body: "No server, no account, no subscription. One deployment serves any number of people.",
    },
  },
  pipeline: {
    title: "How it works, in thirty seconds",
    steps: [
      { title: "Camera", body: "The phone's camera films the hands." },
      { title: "Hand tracking", body: "21 points on each hand are located in every image, on the phone." },
      { title: "Sign recognition", body: "A model trained on real Tunisian Sign Language data names the sign." },
      { title: "Hold to confirm", body: "The sign must stay steady for 0.7 seconds, so stray movements are ignored." },
      { title: "Voice", body: "Words build a sentence, and the phone says it in Tunisian Arabic." },
    ],
    techLabel: "Under the hood",
    tech: [
      "Installable web app (PWA)",
      "MediaPipe hand tracking",
      "Custom 34-class model, 8 MB",
      "Service worker for offline use",
      "On-device text-to-speech",
    ],
  },
  vocabulary: {
    /** {count} is filled from the real sign list, so the number never drifts. */
    title: "The {count} signs Souty understands today",
    /** {tunsl} and {universal} are filled from the real sign list. */
    lead: "{tunsl} signs from Tunisian Sign Language and {universal} universal hand gestures: the words of a real visit to a public service.",
    /** The two chip colours in the list below. */
    legend: {
      tunsl: "Tunisian Sign Language",
      universal: "Universal gestures",
    },
    /** Shown next to each group name. {count} is the number of signs in the group. */
    countLabel: "{count} signs",
    categories: {
      requests: "Requests",
      family: "Family",
      destinations: "Places",
      days: "Days",
      transport: "Transport",
      universal: "Universal gestures",
    },
  },
  playground: {
    derja: "إيجا نلعبو!",
    title: "Try the idea right here",
    lead: "Pick some words. The hand signs them, the sentence builds, then you make the phone speak.",
    canvasLabel: "A drawn hand that makes signs",
    disclaimer: "This is a drawing to explain the idea. The real signs come from Tunisian Sign Language.",
    chooseDerja: "اختار كلمة",
    choose: "Choose a word",
    /** Accessible name of the sentence strip. */
    sentenceLabel: "Your sentence",
    empty: "Your sentence appears here",
    speakDerja: "انطق الجملة",
    speak: "Speak the sentence",
    reset: "Start over",
    pickFirst: "Pick a word or two first.",
    /** {sentence} is replaced with the translated words. */
    spoken: "The phone says: “{sentence}”",
    noVoice: "No Arabic voice on this device. The sentence means: “{sentence}”.",
    /** Placed between the translated words inside {sentence}. Arabic uses "، ". */
    listSeparator: ", ",
    openApp: "Use the real app with your camera",
  },
  offline: {
    derja: "ما فماش إنترنت؟ ماثمّاش مشكل",
    title: "No Internet? No problem.",
    body: "Souty does everything inside the phone. Nothing is sent online, and your images never leave the device. Try it: cut the network.",
    toggle: "Airplane mode",
    illustrationAlt: "A smiling phone under a sky with a Wi-Fi symbol",
    offDerja: "الشبكة خدّامة، وصوتي خدّام",
    off: "The network is on, and so is Souty.",
    onDerja: "ما فماش شبكة… وصوتي مازال خدّام!",
    on: "No network, and Souty still translates. Nothing needed the Internet.",
  },
  limits: {
    title: "What it cannot do yet",
    lead: "We would rather tell you ourselves.",
    items: [
      {
        title: "Still hand shapes only",
        body: "Today's model reads one image at a time. Signs that need movement are not recognized yet.",
      },
      {
        title: "One hand per sign",
        body: "Both hands are followed, but each one is read separately. Signs made with two hands together are not recognized yet.",
      },
    ],
    next: "Solving both is on our roadmap.",
    /** Link to the roadmap section, shown after `next`. */
    nextLink: "See the roadmap",
  },
};
