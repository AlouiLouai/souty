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

## Current data source: real Tunisian Sign Language

[Tunisian Sign Language Dataset](https://www.kaggle.com/datasets/warcoder/tunisian-sign-language-dataset)
(Chakroun & Jerbi, 2023 — Mendeley Data, DOI `10.17632/fbjjgzgv7f.1`,
collected with **ATILS**, the Tunisian Association of Sign Language
Interpreters). CC BY 4.0 — credit it if you mention the training data
anywhere public.

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

**Two-phase workflow — read before running:** the class *labels* Model
Maker trains on are whatever this dataset's own folder names actually are
("named in Tunisian dialect" per its own description — exact
script/spelling unknown until the notebook's `build_dataset()` step
prints the discovered list). `lib/gestureDictionary.ts` cannot be filled
in with real Arabic-word mappings until that list is in hand — this is
the same discover-then-refine pattern the HaGRID mount-path issue needed
earlier. Run the notebook, get the printed class list, then come back and
update the dictionary around the real names.

**No accuracy guarantee.** 57 classes with a modest, imbalanced image
count per class (~78 images/class on average, Transport as low as
~50/class) is a harder problem than the earlier 10-class HaGRID run. It's
also unknown whether any of these 57 signs are inherently two-handed or
motion-based — this architecture (single-hand, single-frame classifier)
fundamentally cannot represent those well, per [`../SPEC.md`](../SPEC.md)'s
Known Limitation. The training script prints aggregate test accuracy, but
that can hide a badly-confused individual class — test every one of the
57 signs manually after deploying (see [`../TESTING.md`](../TESTING.md)),
and be prepared to drop any sign the model can't reliably distinguish.

Renaming a label, or adding/removing one, means updating both the
notebook's `TUNSL_ROOT`/`find_leaf_class_dirs()` output **and**
`GESTURE_WORD_MAP` in [`../lib/gestureDictionary.ts`](../lib/gestureDictionary.ts)
— the model's output category name and the dictionary key must match
exactly.

## Deploying a newly trained model

After the notebook finishes, download `gesture_recognizer.task` from
Kaggle's Output panel, then locally:

```bash
cp gesture_recognizer.task public/models/gesture_recognizer.task
```

Also update `lib/gestureDictionary.ts` to match the new class list — a
model swap alone is not enough this time, since the entire vocabulary
changed, not just a few added classes.
