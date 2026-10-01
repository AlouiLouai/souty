# Custom gesture model training

Retrains the gesture recognizer using [MediaPipe Model
Maker](https://developers.google.com/edge/mediapipe/solutions/customization/gesture_recognizer)
on Kaggle, via [`kaggle_pipeline.ipynb`](kaggle_pipeline.ipynb) — the only
file needed for training. Upload it directly to a Kaggle Notebook (File ->
Upload Notebook), attach the two datasets it names (the original,
unmodified `warcoder/tunisian-sign-language-dataset` — no need to
pre-clean or re-upload anything, the notebook flattens it on the fly),
and run top to bottom. Fully self-contained: it installs everything it
needs inline, no local Python setup required.

**Current vocabulary: 34 classes, two sources merged into one model.** 23
pruned, single-hand signs from the real Tunisian Sign Language dataset,
plus the original 10-class HaGRID vocabulary (stock-gesture equivalents +
`OK_Sign`/`Three_Fingers`/`Four_Fingers`/`Shaka_Sign`), plus `none`. Both
sources are trained together in one Model Maker run, since retraining
always replaces the whole classifier head — see
[Merging the old HaGRID vocabulary back in](#merging-the-old-hagrid-vocabulary-back-in).

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
gestures") — the notebook's `build_dataset()` step already produces
exactly this. The docs also confirm Model Maker runs its own hand
detector while loading and **silently drops any image with no hand
found** — `Dataset.size` (checked directly in the
[official source](https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/model_maker/python/vision/gesture_recognizer/dataset.py))
reflects the count that survives this, not the count handed to it.
`train_and_export()` prints the gap between images copied in and
`Dataset.size` explicitly, plus the actual train/validation/test split
sizes, so a silent loss isn't discovered only after a training run.

**Single-hand only, confirmed in the same source file:** the
`HandLandmarker` Model Maker runs internally during loading is configured
with `num_hands=1`, and only `hand_landmarks[0]` is ever read — any
second hand in a training photo is silently discarded. The live app
(`components/GestureScanner.tsx`) classifies each detected hand
independently too, with no concept of a joint two-hand shape. Neither
side can represent a genuinely two-handed sign, at any amount of data or
training time — see [Why only 23 of the 57 signs](#why-only-23-of-the-57-signs-not-all-of-them)
below.

**The train/test split was also leaking near-duplicate frames.** The
dataset's own bundled report says its images are OpenCV key frames
extracted from videos of signers, not independent photographs.
Perceptual-hash similarity confirms it directly: consecutively-numbered
files within a class average a Hamming distance of 1–7 (near-duplicate),
versus 7–28 for files far apart in the same class — filename order
preserves capture order. `Dataset.from_folder()` shuffles the full
example list with an unseeded `random.shuffle()` before `Dataset.split()`
takes a contiguous slice of that shuffled order (both confirmed in the
official source) — so a random split very likely puts near-identical
frames from the same capture session on both sides, letting the model
partly "pass" the test by recognizing a frame it has essentially already
seen rather than generalizing to a new hand. `kaggle_pipeline.ipynb` now
splits each class's own capture-ordered files into contiguous
train/validation/test blocks itself, before Model Maker ever sees them,
and loads three separate `Dataset` objects instead of using
`Dataset.split()`. This isn't a true signer-level holdout (no signer ID
is documented per image), but it's a meaningfully more honest estimate
than a random interleave.

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

Only **23 of these 57 signs** are actually used for training (see
[Why only 23 of the 57 signs](#why-only-23-of-the-57-signs-not-all-of-them)
below) — this table describes the full source dataset, not the trained
vocabulary.

[HaGRID](https://github.com/hukenovs/hagrid) supplies three things here:
the required negative (`none`) class, and — merged back in alongside
these TunSL signs, see the next section — the 10 old stock-gesture-
equivalent classes.

**No accuracy guarantee.** The first run trained all 57 signs and got
60.22% test accuracy — see
[Why only 23 of the 57 signs](#why-only-23-of-the-57-signs-not-all-of-them)
for why that number was hiding a structural problem rather than measuring
one worth chasing with more epochs. The pruned 23-sign run below removes
that architectural mismatch, but per-class image counts are still modest
(16–35 for the thinnest kept classes) and photo conditions vary. The
training script prints aggregate test accuracy, but that can hide a
badly-confused individual class — test every one of the 23 signs manually
after deploying (see [`../TESTING.md`](../TESTING.md)), and be prepared to
drop any sign the model still can't reliably distinguish.

## Why only 23 of the 57 signs, not all of them

Confirmed directly in Model Maker's own source
([`dataset.py`](https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/model_maker/python/vision/gesture_recognizer/dataset.py)):
its internal `HandLandmarker` is configured with `num_hands=1` and only
ever reads `hand_landmarks[0]` — any second hand in a training photo is
silently discarded. The live app classifies each detected hand
independently too (confirmed by testing: a two-handed sign is seen by the
app as two separate, independent single-hand guesses, never as one joint
shape). Neither training nor inference has any way to represent "these
two hands together are one sign" — a hard ceiling of this architecture,
not something more data or epochs can fix.

To find out how much of the vocabulary that actually breaks, every one of
the dataset's 4423 training photos was run through the real MediaPipe
`HandLandmarker` (2-hand mode) to count how many hands each photo
actually shows:

| Group | Signs | What it means |
|---|---|---|
| Majority two-handed | 28 of 57 (49%) | Can never be learned correctly by this architecture. `cv`, `demande`, `om`, `jom3a` are 100% two-handed in their own photos; `wzara`, `n3awnek`, `baladya`, `3aslema`, `se7a` are 70–91% two-handed. |
| Reliably single-hand (kept) | 23 of 57 (40%) | ≥75% single-hand purity among photos where a hand was detected at all, and ≥15 clean single-hand examples after that filter. These are what the pruned run trains on. |
| Dropped for thinness despite being clean | 2 of 57 (4%) | `mar7ba` (100% single-hand, only 13 clean images) and `karhba` (75% purity, only 9 clean images) — too few examples to trust regardless of purity. |
| Dropped for low purity | the remainder | Majority or near-majority two-handed, or too mixed to call reliably one-handed. |

The 23 kept signs (`non` is a deliberate exception at 74% purity — kept
anyway, with 48 clean examples, for basic yes/no symmetry with `oui`):

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
| `5adamet` | خدمات | services |
| `assam` | أصم | deaf |
| `labes` | لاباس | fine / OK |
| `non` | لا | no |
| `oui` | ايه | yes |
| `siye7a` | سياحة | tourism |
| `ta3raf` | تعرف | you know |

**Destinations**

| Label | Word (ar) | Gloss |
|---|---|---|
| `mostawsaf` | مستوصف | clinic |
| `sbitar` | سبيطار | hospital |

**Famille**

| Label | Word (ar) | Gloss |
|---|---|---|
| `bent` | بنت | daughter/girl |
| `bou` | بابا | dad |
| `eben` | ابن | son |
| `jad` | جد | grandfather |
| `jadda` | جدة | grandmother |
| `mar2a` | مرأة | woman/wife |
| `tfol` | طفل | child |

**Jours**

| Label | Word (ar) | Gloss |
|---|---|---|
| `5mis` | الخميس | Thursday |
| `sebt` | السبت | Saturday |
| `thnin` | الاثنين | Monday |

**Transport**

| Label | Word (ar) | Gloss |
|---|---|---|
| `car` | سيارة | car |
| `louage` | لواج | louage (shared taxi) |
| `metro` | مترو | metro |
| `train` | قطار | train |

Plus the required `none` class (from HaGRID, ignored in
`GESTURE_WORD_MAP` same as the existing `None`/`none` handling).

### Excluded signs (not trainable by a single-hand classifier, or too thin)

Kept here so a future attempt (e.g. after building a real two-hand
classifier) knows exactly what's missing and why, without re-running the
audit:

| Excluded | Word (ar) | Gloss | Why |
|---|---|---|---|
| `cv`, `demande`, `om`, `jom3a` | سيرة ذاتية, طلب, أم, الجمعة | CV/résumé, request, mother, Friday | 100% two-handed |
| `wzara`, `lyoum`, `a7ad`, `n3awnek`, `baladya`, `thleth`, `t7eb`, `taxi`, `3aslema`, `radio`, `dar`, `barnamjk`, `telvza`, `5ou`, `ma7kma`, `enti`, `se7a`, `ta9ra`, `3ayla`, `tha9afa`, `nekteblk`, `chabeb`, `erb3a`, `5al-3am` | — | — | ≥50% two-handed |
| `bousta`, `o5t`, `ta3lim`, `banka` | — | — | near-even two-hand/one-hand mix (54–62% two-handed) |
| `mar7ba` | مرحبا | welcome | 100% single-hand purity, but only 13 clean images — too thin to trust |
| `karhba` | كرهبة | car (Tunisian dialect) | 75% purity, but only 9 clean images — too thin to trust |

Data-quality notes from direct inspection: all 4423 images present, zero
corrupt files, uniform 224×224. `car` vs. `karhba` were visually
spot-checked and are genuinely distinct hand shapes (not an accidental
duplicate) — `karhba` was excluded only for thinness, not confusability.
One local-only encoding glitch was found and fixed defensively in the
pipeline: `metro`'s accented `é` got mangled on a Windows extraction —
`sanitize_label()` in the training script ASCII-folds it.

Renaming a label, or adding/removing one, means updating both the
notebook's `KEPT_SIGN_LABELS` **and** `GESTURE_WORD_MAP` in
[`../lib/gestureDictionary.ts`](../lib/gestureDictionary.ts) — the
model's output category name and the dictionary key must match exactly.

## Merging the old HaGRID vocabulary back in

Model Maker always replaces the whole classifier head on retrain — there
is no way to "add" classes to an already-deployed model without
retraining everything together. To get the old stock-gesture-equivalent
classes recognized again alongside the 23 TunSL signs, they're trained
together in the same run, in the same `_train.py`.

The mapping is reused exactly as proven in the original 10-class run
(commit `f1ca435`, 95.2% accuracy on that problem alone) rather than
re-derived: HaGRID's own gesture folders live under the *same* attached
dataset as `none` (`innominate817/hagrid-classification-512p-no-gesture`
— despite the `-no-gesture` slug, it also holds `palm`, `fist`, `like`,
`dislike`, `peace`, `one`, `ok`, `three`, `four`, and `call`), so no new
Kaggle dataset needs attaching.

| HaGRID folder | Class label | Word (ar) | Gloss |
|---|---|---|---|
| `palm` | `Open_Palm` | عسلامة | hello |
| `fist` | `Closed_Fist` | وقف | stop |
| `like` | `Thumb_Up` | ايه | yes |
| `dislike` | `Thumb_Down` | لا | no |
| `peace` | `Victory` | بالسلامة | bye / peace |
| `one` | `Pointing_Up` | استنى | wait |
| `ok` | `OK_Sign` | باهي | OK / good (Tunisian Derja, not Egyptian/Levantine تمام) |
| `three` | `Three_Fingers` | 3 | digit, not spelled out — matches finger count at a glance |
| `four` | `Four_Fingers` | 4 | digit, not spelled out |
| `call` | `Shaka_Sign` | مبروك | congrats |

**`ILoveYou` stays excluded.** HaGRID has no folder matching the
thumb+index+pinky shape, and that was true the first time this vocabulary
was built too (commit `f1ca435`'s message: "ILoveYou dropped - no HaGRID
equivalent, needs custom photos to bring back"). Nothing's changed on
that front — bringing it back for real needs ~100 of your own photos of
that hand shape in a new Kaggle dataset, not just a dictionary entry.

**Per-class cap:** HaGRID has 10k+ images per class, so each HaGRID
class is capped at `HAGRID_CLASS_CAP` (120) to keep the combined 34-class
problem reasonably balanced against the much smaller TunSL classes
(16–224 images) and keep the Kaggle session time reasonable.

**Untested as a combined 34-class problem.** Both halves were separately
proven (95.2% on the 10 HaGRID classes alone; the pruning/split fixes
above for the 23 TunSL signs), but training them together is new — some
TunSL/HaGRID pairs could turn out more confusable together than either
group was alone (e.g. `Pointing_Up` vs `assam`, both a single raised
finger near the body). Test every one of the 34 signs after deploying,
same as always.

## Deploying a newly trained model

After the notebook finishes, download `gesture_recognizer.task` from
Kaggle's Output panel, then locally:

```bash
cp gesture_recognizer.task public/models/gesture_recognizer.task
```

`lib/gestureDictionary.ts` already has the matching combined 34-class
mapping (23 TunSL + 10 HaGRID-derived) — a model swap alone is enough
this time, as long as the deployed `.task` file was trained from the
current `kaggle_pipeline.ipynb`.
