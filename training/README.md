# Custom gesture model training

Retrains the gesture recognizer beyond MediaPipe's stock 7 gestures, using
[MediaPipe Model
Maker](https://developers.google.com/edge/mediapipe/solutions/customization/gesture_recognizer)
on Kaggle, via [`kaggle_pipeline.ipynb`](kaggle_pipeline.ipynb) — upload it
directly to a Kaggle Notebook (File -> Upload Notebook), attach the
dataset it names, and run top to bottom. That notebook is fully
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

## Current vocabulary

| Label (model category) | Hand shape | Arabic word | Source |
|---|---|---|---|
| `Open_Palm` | flat open hand | عسلامة (hello) | stock model |
| `Closed_Fist` | closed fist | وقف (stop) | stock model |
| `Thumb_Up` | thumb up | ايه (yes) | stock model |
| `Thumb_Down` | thumb down | لا (no) | stock model |
| `Victory` | index+middle up | بالسلامة (bye) | stock model |
| `Pointing_Up` | index only up | استنى (wait) | stock model |
| `OK_Sign` | thumb+index circle, 3 fingers up | باهي (OK / good) | retrained on HaGRID |
| `Three_Fingers` | index+middle+ring up | 3 | retrained on HaGRID |
| `Four_Fingers` | 4 fingers up, thumb tucked | 4 | retrained on HaGRID |
| `Shaka_Sign` | thumb+pinky up | مبروك (congrats) | retrained on HaGRID — **experimental**, landmark shape is one finger away from the dropped `ILoveYou` gesture |

`ILoveYou` (thumb+index+pinky, from the stock model) is **not** in the
current trained model — [HaGRID](https://github.com/hukenovs/hagrid) (the
training data source, CC BY-SA 4.0) has no matching gesture. To bring it
back: upload your own ~100 photos of that hand shape as a separate Kaggle
Dataset, and uncomment the line already in the notebook's training script
cell that copies them in under `OUT_DIR / "ILoveYou"`.

Deliberately **excluded** from the vocabulary: finger counts for one/two/five
(identical hand shape to `Pointing_Up`/`Victory`/`Open_Palm` — the
classifier can't tell them apart), and the horns/rock and fig-sign
gestures (both are documented vulgar gestures in Mediterranean/North
African contexts — not worth the risk in an app for a Tunisian audience
regardless of how common they are elsewhere).

Renaming a label, or adding/removing one, means updating both the
notebook's `LABEL_MAP` **and** `GESTURE_WORD_MAP` in
[`../lib/gestureDictionary.ts`](../lib/gestureDictionary.ts) — the model's
output category name and the dictionary key must match exactly.

## Deploying a newly trained model

After the notebook finishes, download `gesture_recognizer.task` from
Kaggle's Output panel, then locally:

```bash
cp gesture_recognizer.task public/models/gesture_recognizer.task
```

No other code changes are needed — the app reads whatever categories the
`.task` file reports and looks each one up in `GESTURE_WORD_MAP`.
