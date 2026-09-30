# Custom gesture model training

Retrains the gesture recognizer using [MediaPipe Model
Maker](https://developers.google.com/edge/mediapipe/solutions/customization/gesture_recognizer)
on Kaggle, via [`kaggle_pipeline.ipynb`](kaggle_pipeline.ipynb) — upload it
directly to a Kaggle Notebook (File -> Upload Notebook), attach the two
datasets it names, and run top to bottom. That notebook is fully
self-contained: it installs everything it needs inline, no local Python
setup required.

**Caveat:** Google marks Model Maker as "still available, but no longer
actively maintained." It works, but don't expect upstream fixes.

**Known install issue on Kaggle/Colab (as of early 2026):** plain
`pip install mediapipe-model-maker` fails on Python 3.12 (Kaggle/Colab's
current default) with a PyYAML build error — a live, unresolved upstream
bug ([mediapipe-samples#643](https://github.com/google-ai-edge/mediapipe-samples/issues/643)).
Confirmed workaround: install Python 3.10 alongside the default and run
under that instead — the notebook already does this.

**Dataset format, verified against the [official docs](https://developers.google.com/edge/mediapipe/solutions/customization/gesture_recognizer):**
required layout is flat, `<dataset_path>/<label_name>/<img_name>.*`, with
exactly one label folder literally named `none` ("the none label
represents any gesture that isn't classified as one of the other
gestures") — `kaggle_pipeline.py`'s `build_dataset()` already produces
exactly this. The docs also confirm Model Maker runs its own hand
detector while loading and **silently drops any image with no hand
found** — `Dataset.size` (checked directly in the
[official source](https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/model_maker/python/vision/gesture_recognizer/dataset.py))
reflects the count that survives this, not the count handed to it.
`train_and_export()` prints the gap between images copied in and
`Dataset.size` explicitly, plus the actual train/validation/test split
sizes, so a silent loss isn't discovered only after a 40-epoch run —
worth watching closely given `mar7ba` starts at just 15 images.

## Current data source: real Tunisian Sign Language

[Tunisian Sign Language Dataset](https://www.kaggle.com/datasets/warcoder/tunisian-sign-language-dataset)
(Chakroun & Jerbi, 2023 — Mendeley Data, DOI `10.17632/fbjjgzgv7f.1`,
collected with **ATILS**, the Tunisian Association of Sign Language
Interpreters, as part of a SUP'COM P2M project). CC BY 4.0 — credit it if
you mention the training data anywhere public. The dataset also bundles
the students' own project report (PDF), which independently confirms the
Arabic gloss for most of these signs — used below alongside standard
Tunisian Derja transliteration conventions.

4423 images, 57 real Tunisian signs, 7 signers, across 5 categories:

| Category | Signs | Images |
|---|---|---|
| Demandes | 24 | 1400 |
| Destinations | 8 | 608 |
| Famille | 12 | 1748 |
| Jours | 7 | 365 |
| Transport | 6 | 302 |

This replaced the earlier HaGRID-based generic-gesture vocabulary
(`OK_Sign`/`Three_Fingers`/`Four_Fingers`/`Shaka_Sign` and the original
stock 7) entirely — once a model trained on this dataset is deployed,
none of those previous categories are recognized anymore.
[HaGRID](https://github.com/hukenovs/hagrid) is still used, but only for
its `no_gesture` folder, as the required negative ("none") class Model
Maker needs.

**No accuracy guarantee.** 57 classes with a modest, imbalanced image
count per class (~78 images/class on average, Transport as low as
~50/class, the thinnest single class only 15) is a harder problem than
the earlier 10-class HaGRID run. It's also unknown whether any of these
57 signs are inherently two-handed or motion-based — this architecture
(single-hand, single-frame classifier) fundamentally cannot represent
those well, per [`../SPEC.md`](../SPEC.md)'s Known Limitation. The
training script prints aggregate test accuracy, but that can hide a
badly-confused individual class — test every one of the 57 signs
manually after deploying (see [`../TESTING.md`](../TESTING.md)), and be
prepared to drop any sign the model can't reliably distinguish. Classes
under ~30 images (`mar7ba`, `karhba`, `labes`, `5adamet`) are the most
likely to need it.

## Confirmed vocabulary (folder name -> class label -> Arabic word)

Verified by inspecting a local copy of the dataset directly — not
guessed. Folder names are Tunisian Derja in Franco-Arabic transliteration
(digits stand in for letters with no Latin equivalent: `3`=ع, `5`=خ,
`7`=ح, `9`=ق, `2`=ء). These exact names become the model's output
category names, so they're also the `GESTURE_WORD_MAP` keys once a
trained model is deployed.

**Demandes**

| Label | Word (ar) | Gloss |
|---|---|---|
| `3aslema` | عسلامة | hello |
| `5adamet` | خدمات | services |
| `assam` | أصم | deaf |
| `barnamjk` | برنامجك | your schedule |
| `chabeb` | شباب | youth |
| `cv` | سيرة ذاتية | CV / résumé |
| `demande` | طلب | request |
| `enti` | انت | you |
| `labes` | لاباس | fine / OK |
| `lyoum` | اليوم | today |
| `mar7ba` | مرحبا | welcome |
| `n3awnek` | نعاونك | I'll help you |
| `nekteblk` | نكتبلك | I'll write to you |
| `non` | لا | no |
| `oui` | ايه | yes |
| `radio` | راديو | radio |
| `se7a` | صحة | health |
| `siye7a` | سياحة | tourism |
| `t7eb` | تحب | you like/want |
| `ta3lim` | تعليم | education |
| `ta3raf` | تعرف | you know |
| `ta9ra` | تقرا | you read |
| `telvza` | تلفزة | television |
| `tha9afa` | ثقافة | culture |

**Destinations**

| Label | Word (ar) | Gloss |
|---|---|---|
| `baladya` | بلدية | municipality |
| `banka` | بنك | bank |
| `bousta` | بوسطة | post office |
| `dar` | دار | house |
| `ma7kma` | محكمة | court |
| `mostawsaf` | مستوصف | clinic |
| `sbitar` | سبيطار | hospital |
| `wzara` | وزارة | ministry |

**Famille**

| Label | Word (ar) | Gloss |
|---|---|---|
| `3ayla` | عائلة | family |
| `5al-3am` | خال / عم | uncle |
| `5ou` | خو | brother |
| `bent` | بنت | daughter/girl |
| `bou` | بابا | dad |
| `eben` | ابن | son |
| `jad` | جد | grandfather |
| `jadda` | جدة | grandmother |
| `mar2a` | مرأة | woman/wife |
| `o5t` | اخت | sister |
| `om` | أم | mother |
| `tfol` | طفل | child |

**Jours**

| Label | Word (ar) | Gloss |
|---|---|---|
| `5mis` | الخميس | Thursday |
| `a7ad` | الأحد | Sunday |
| `erb3a` | الأربعاء | Wednesday |
| `jom3a` | الجمعة | Friday |
| `sebt` | السبت | Saturday |
| `thleth` | الثلاثاء | Tuesday |
| `thnin` | الاثنين | Monday |

**Transport**

| Label | Word (ar) | Gloss |
|---|---|---|
| `car` | سيارة | car |
| `karhba` | كرهبة | car (Tunisian dialect term — distinct hand shape from `car`, verified) |
| `louage` | لواج | louage (shared taxi) |
| `metro` | مترو | metro |
| `taxi` | تاكسي | taxi |
| `train` | قطار | train |

Plus the required `none` class (from HaGRID, ignored in
`GESTURE_WORD_MAP` same as the existing `None`/`none` handling).

Data-quality notes from direct inspection: all 4423 images present, zero
corrupt files, uniform 224×224. `car` vs. `karhba` were visually
spot-checked and are genuinely distinct hand shapes (not an accidental
duplicate). One local-only encoding glitch was found and fixed defensively
in the pipeline: `metro`'s accented `é` got mangled on a Windows
extraction — `sanitize_label()` in the training script ASCII-folds it.

Renaming a label, or adding/removing one, means updating both the
notebook's `EXPECTED_SIGN_LABELS` **and** `GESTURE_WORD_MAP` in
[`../lib/gestureDictionary.ts`](../lib/gestureDictionary.ts) — the
model's output category name and the dictionary key must match exactly.

## Deploying a newly trained model

After the notebook finishes, download `gesture_recognizer.task` from
Kaggle's Output panel, then locally:

```bash
cp gesture_recognizer.task public/models/gesture_recognizer.task
```

Also update `lib/gestureDictionary.ts` with the table above — a model
swap alone is not enough this time, since the entire vocabulary changed,
not just a few added classes.
