export const problem = {
  derja: "وين المشكل؟",
  title: "لا يستطيع الشخص الأصم أن يطلب المساعدة بلغته.",
  lead: "في مكتب الشؤون الاجتماعية أو المستوصف أو البلدية، قليلون جدًا من يفهمون لغة الإشارة. طلب بسيط مثل «ابني يحتاج إلى طبيب يوم الخميس» يتحول إلى تخمين.",
  /** Read to screen readers as the name of the list of numbers. */
  statsLabel: "فقدان السمع ولغات الإشارة بالأرقام",
  /**
   * Each card reads as one sentence: value, unit, label.
   * The links point to the official Arabic versions of the same pages.
   */
  stats: [
    {
      value: "430",
      unit: "مليون شخص",
      label: "في العالم يحتاجون إلى التأهيل لمعالجة فقدان السمع المسبب للإعاقة.",
      source: "منظمة الصحة العالمية",
      href: "https://www.who.int/ar/news-room/fact-sheets/detail/deafness-and-hearing-loss",
    },
    {
      value: "70+",
      unit: "مليون شخص أصم",
      label: "يعيشون في أنحاء العالم.",
      source: "الأمم المتحدة",
      href: "https://www.un.org/ar/observances/sign-languages-day",
    },
    {
      value: "300+",
      unit: "لغة إشارة",
      label: "موجودة في العالم. ولتونس لغتها الخاصة.",
      source: "الأمم المتحدة",
      href: "https://www.un.org/ar/observances/sign-languages-day",
    },
  ],
  /** Shown right before the linked name of the source. */
  sourceLabel: "المصدر:",
  /** Read to screen readers after every link that leaves the site. */
  newTabHint: "(يفتح في تبويب جديد)",
  barriersTitle: "ثلاثة جدران، كل يوم",
  /** Order matters: each wall has its own icon (staff, writing, dependence). */
  barriers: [
    {
      title: "الموظفون لا يعرفون لغة الإشارة",
      body: "موظفو الاستقبال وأعوان الإدارة والممرضون قلّما يعرفون لغة الإشارة التونسية.",
    },
    {
      title: "الكتابة ليست حلًّا",
      body: "لغة الإشارة هي اللغة الأولى لكثير من الصم، والعربية المكتوبة تأتي بعدها. لذلك تصبح الورقة والقلم حاجزًا إضافيًا.",
    },
    {
      title: "الاعتماد الدائم على شخص آخر",
      body: "من دون قريب أو مترجم، قد يفشل حتى أبسط طلب: موعد يضيع، أو حاجة لم يفهمها أحد.",
    },
  ],
  /** First panel of Sami's three-panel comic. Panels 2 and 3 live in the idea slice. */
  story: {
    titleDerja: "تعرّف على سامي",
    title: "تعرّف على سامي",
    intro: "سامي شخصية خيالية، لكن قصته هي قصة كثير من الصم.",
    derja: "سامي أصم. جا للإدارة باش يطلب خدمة… والموظّف ما فهموش.",
    caption: "سامي أصم. أمام شبّاك الخدمات، لا يفهم الموظف لغة الإشارة التي يتكلم بها.",
    alt: "أمام شبّاك الخدمات، موظف يبدو حائرًا وسامي يخاطبه بالإشارة.",
    /** Drawn above the puzzled agent. Arabic uses the mirrored mark. */
    questionMark: "؟",
    /** Link that scrolls down to the rest of the comic. */
    continues: "شاهد ما يحدث بعد ذلك",
  },
};
