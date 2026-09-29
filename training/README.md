# Custom gesture model training

This retrains the gesture recognizer beyond MediaPipe's stock 7 gestures,
using your own photos, via [MediaPipe Model
Maker](https://developers.google.com/edge/mediapipe/solutions/customization/gesture_recognizer).

**Caveat:** Google marks Model Maker as "still available, but no longer
actively maintained." It works, but don't expect upstream fixes.

**Known install issue on Kaggle/Colab (as of early 2026):** plain
`pip install mediapipe-model-maker` fails on Python 3.12 (Kaggle/Colab's
current default) with a PyYAML build error — a live, unresolved upstream
bug ([mediapipe-samples#643](https://github.com/google-ai-edge/mediapipe-samples/issues/643)).
Confirmed workaround: install Python 3.10 alongside the default and run
under that instead — `kaggle_pipeline.ipynb` already does this.

## Vocabulary in this scaffold

| Label (folder name) | Hand shape | Arabic word | Status |
|---|---|---|---|
| `Open_Palm` | flat open hand | عسلامة (hello) | existing |
| `Closed_Fist` | closed fist | وقف (stop) | existing |
| `Thumb_Up` | thumb up | ايه (yes) | existing |
| `Thumb_Down` | thumb down | لا (no) | existing |
| `Victory` | index+middle up | بالسلامة (bye) | existing |
| `Pointing_Up` | index only up | استنى (wait) | existing |
| `ILoveYou` | thumb+index+pinky up | نحبك (I love you) | existing |
| `OK_Sign` | thumb+index circle, 3 fingers up | تمام (OK / all good) | new |
| `Three_Fingers` | index+middle+ring up | ثلاثة (three) | new |
| `Four_Fingers` | 4 fingers up, thumb tucked | أربعة (four) | new |
| `Shaka_Sign` | thumb+pinky up | مبروك (congrats) | **experimental** — landmark shape is one finger away from `ILoveYou`; verify with real test data that the model can tell them apart before trusting this in production |
| `none` | anything that isn't one of the above (relaxed hand, mid-motion, empty frame, other poses) | — (ignored) | **required** — Model Maker needs a negative class |

Deliberately **excluded**: finger counts for one/two/five (identical hand
shape to `Pointing_Up`/`Victory`/`Open_Palm` — the classifier can't tell
them apart), and the horns/rock and fig-sign gestures (both are documented
vulgar gestures in Mediterranean/North African contexts — not worth the
risk in an app for a Tunisian audience regardless of how common they are
elsewhere).

Renaming a label, or adding/removing one, means updating both the folder
name here **and** `GESTURE_WORD_MAP` in
[`../lib/gestureDictionary.ts`](../lib/gestureDictionary.ts) — the model's
output category name and the dictionary key must match exactly.

## Option A: train on Kaggle using HaGRID (no photos of your own needed)

[HaGRID](https://github.com/hukenovs/hagrid) is a large public hand-gesture
photo dataset (CC BY-SA 4.0, give it credit) that already has real images
for most of the vocabulary staged in `lib/gestureDictionary.ts`. Upload
[`kaggle_pipeline.ipynb`](kaggle_pipeline.ipynb) directly to a Kaggle
Notebook (File -> Upload Notebook) and run it top to bottom — it downloads
no data itself; you attach the `innominate817/hagrid-classification-512p-no-gesture`
Kaggle dataset and it builds the labeled folder structure for you.
([`kaggle_pipeline.py`](kaggle_pipeline.py) has the same code as plain
Python, if you'd rather paste cells in by hand or read it in a diff.)

Caveat: HaGRID has no gesture matching `ILoveYou` — you'd need to supply
your own ~100 photos for that one (Option B below), or drop it from the
retrain.

## Option B: collect your own photos

## 1. Collect photos

For each folder in `dataset/`, add photos of that hand shape:

- **~100+ images per class** is a reasonable starting point.
- Vary the person, hand (left/right), lighting, background, and distance
  from camera — a model trained on one person's hand in one lighting setup
  will not generalize to your actual users.
- For `none`, include relaxed hands, hands mid-transition between poses,
  other random hand shapes, and a few frames with no hand at all.
- Photos only — this is a still-frame classifier (see the "Known
  limitation" section in `../SPEC.md`); there's no benefit to recording
  video here.

None of this is committed to git (see `.gitignore`) — hand photos of real
people are personal data and don't belong in the repo.

## 2. Train

```bash
cd training
pip install -r requirements.txt
python train_gesture_model.py
```

Prints per-class counts, trains, then prints test accuracy. If accuracy on
a class is poor, or a class gets confused with another (check the printed
metrics), that pair of gestures is too visually similar for this
architecture — the fix is different photos or dropping that class, not
more epochs.

## 3. Deploy

```bash
cp exported_model/gesture_recognizer.task ../public/models/gesture_recognizer.task
```

Restart the dev server. No other code changes are needed — the app reads
whatever categories the `.task` file reports and looks each one up in
`GESTURE_WORD_MAP`.
