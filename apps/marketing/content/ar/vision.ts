import type { PackStage } from "../shared";

export const vision = {
  derja: "صوتي للعالم الكل",
  title: "تطبيق واحد. كل لغات الإشارة.",
  lead: "لغة الإشارة ليست لغة عالمية موحّدة. هناك أكثر من 300 لغة، ولمجتمع الصم في كل بلد لغته الخاصة. خطتنا: كل لغة جديدة حزمة إشارات تُضاف إلى التطبيق نفسه، لا تطبيق جديد.",
  stageLabels: {
    live: "متاحة اليوم",
    maghreb: "التالي: البلدان المغاربية",
    mena: "ثم: الشرق الأوسط",
    world: "والعالم",
  },
  /** Sign languages, grouped by rollout stage. Names are the translatable part. */
  packs: [
    { stage: "live" as PackStage, name: "لغة الإشارة التونسية" },
    { stage: "maghreb" as PackStage, name: "لغة الإشارة الجزائرية" },
    { stage: "maghreb" as PackStage, name: "لغة الإشارة المغربية" },
    { stage: "maghreb" as PackStage, name: "لغة الإشارة الليبية" },
    { stage: "mena" as PackStage, name: "لغة الإشارة المصرية" },
    { stage: "mena" as PackStage, name: "لغة الإشارة الأردنية" },
    { stage: "mena" as PackStage, name: "لغة الإشارة اللبنانية" },
    { stage: "mena" as PackStage, name: "لغة الإشارة السعودية" },
    { stage: "mena" as PackStage, name: "لغة الإشارة الإماراتية" },
    { stage: "world" as PackStage, name: "لغة الإشارة الفرنسية" },
    { stage: "world" as PackStage, name: "لغة الإشارة الأمريكية" },
    { stage: "world" as PackStage, name: "لغة الإشارة البريطانية" },
    { stage: "world" as PackStage, name: "لغة الإشارة البرازيلية" },
    { stage: "world" as PackStage, name: "لغة الإشارة الهندية" },
    { stage: "world" as PackStage, name: "لغة الإشارة الكينية" },
  ],
  morePacks: "ومئات اللغات الأخرى",
  packsNote: "لغة الإشارة التونسية هي الوحيدة المتاحة اليوم. اللغات الأخرى ضمن خطتنا، وكل واحدة منها ستُبنى مع مجتمع الصم الخاص بها.",
  howTitle: "كيف تُضاف لغة جديدة",
  how: [
    {
      title: "المجتمع يسجّل",
      body: "جمعية الصم في البلد تصوّر إشاراتها بنفسها. فتبقى لغتها بين يديها.",
    },
    {
      title: "صوتي يتعلّم",
      body: "يُدرَّب نموذج على لغة الإشارة تلك، ويُختبر مع من يستعملونها.",
    },
    {
      title: "الجميع ينزّلها مرة واحدة",
      body: "تُحفظ حزمة اللغة على الهاتف. وبعدها تعمل بدون إنترنت، في أي مكان.",
    },
  ],
  globeAlt: "كرة أرضية بسيطة مرسومة بخطوط ونقاط. نقطة خضراء تنبض تمثّل لغة الإشارة التونسية، المتاحة اليوم. ومنها تمتد مسارات منقّطة إلى نقاط أخرى: لغات الإشارة القادمة.",
};
