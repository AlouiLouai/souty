# Sign model training

[`kaggle_pipeline.ipynb`](kaggle_pipeline.ipynb) trains Souty's sign model
on Kaggle. It is the only file needed. Upload it to a Kaggle Notebook
(File → Import Notebook), turn on **GPU** and **Internet** in Settings,
attach the datasets listed below, and Run All. It installs everything it
needs inline.

## What changed: two hands and motion

The previous pipeline used MediaPipe Model Maker's gesture recognizer. It
had two limits that Model Maker's own
[`dataset.py`](https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/model_maker/python/vision/gesture_recognizer/dataset.py)
hard-codes, so no amount of data or tuning could get around them:

- **One hand.** Its hand detector runs with `num_hands=1`, so the second
  hand of every two-handed sign was silently dropped. 28 of the 57 TunSL
  signs had to be excluded for this reason. They include the most useful
  ones for public services: `baladya` (municipality), `demande`
  (request), `wzara` (ministry), `cv`, `n3awnek` (I help you), and
  `3aslema` (hello).
- **One still frame.** It classifies a single frame, so it has no notion
  of movement. That is why the app makes the user freeze a hand shape for
  700 ms.

The new pipeline replaces Model Maker entirely:

| Stage | Tooling | Output |
|---|---|---|
| Landmarks | MediaPipe Tasks `HandLandmarker`, `num_hands=2`, in an isolated Python 3.11 venv | `(frames, 2, 21, 3)` per image or clip, NaN = missing hand; video sampled at 15 fps |
| Features | NumPy | 32-frame window (about 2 s) → `32 × 132`: per hand, shape relative to its wrist plus wrist position relative to the window's anchor, i.e. both hands **and** their motion |
| Model | PyTorch | temporal conv net over position + velocity, about 0.2 M parameters |
| Export | ONNX | `sign_model.onnx` + `sign_model.meta.json` + `parity_fixtures.json` + the `hand_landmarker.task` used |

The exact feature contract is documented in the notebook's step 6 and
written into `sign_model.meta.json`. `parity_fixtures.json` holds raw test
windows with the expected features and probabilities, so the browser-side
port of the preprocessing can be unit-tested against the Python one.

The isolated venv also removes the old Python 3.10 workaround. That was
needed because `mediapipe-model-maker` pinned `pyyaml<6`, and that pin no
longer applies.

## Data sources

| Dataset (Kaggle) | Role | Licence |
|---|---|---|
| [`warcoder/tunisian-sign-language-dataset`](https://www.kaggle.com/datasets/warcoder/tunisian-sign-language-dataset) | 57 real TunSL signs, 4423 images, 7 signers (Chakroun & Jerbi 2023, with ATILS, Mendeley DOI `10.17632/fbjjgzgv7f.1`) | CC BY 4.0, credit it publicly |
| [`innominate817/hagrid-classification-512p-no-gesture`](https://www.kaggle.com/datasets/innominate817/hagrid-classification-512p-no-gesture) | the 10 universal gestures already in the app (`palm` → `Open_Palm`, …) and `no_gesture` → `none` | see dataset page |
| your own clips (`RECORDED_SLUG`, default `souty-sign-clips`) | real movement, new signs, more signers | yours |

**All 57 TunSL signs are trainable now.** The images show the signer's
torso with both hands, and the face cropped. Only classes with fewer than
`MIN_SAMPLES` (15) usable images after hand detection are dropped, and
the notebook prints which ones. The contiguous capture-order split from
the previous pipeline is kept. The TunSL photos were taken in sequence
with laptop cameras, so neighbouring files are near-duplicates, and a
random split would leak them into the test set.

### Is there a better free dataset?

Not for Tunisian signs. Checked on Kaggle and the web (November 2026):

- **No public video dataset of Tunisian Sign Language exists for
  training.** The TunSL dataset above is still photos "taken in different
  environments using laptop cameras" (its README); no video of it was
  published. The other Tunisian resources found:
  - a SooSL online dictionary of about 279 LST signs, and a "Corpus LS
    Tunisienne" (CLARIN) and a 10-narrative LST corpus from Tunis
    (ORTOLANG, DOI `10.82270/lst`): video, but under no-derivatives or
    unstated licences, so not usable for training without permission;
  - a student project recording medical-consultation signs on video from
    the AVST medical dictionary and ATILS interpreters
    (`dhiaabdelli12/tunisian-sign-language-seq-classification-dataset-building`
    on GitHub): its videos are on a private drive, not released;
  - a 12-sign static two-handed dataset (*Nafath*, 2023) and several
    GitHub projects with self-recorded webcam clips: images, or not
    released with a licence.
- Kaggle has large **motion** datasets in other sign languages: Google's
  ISLR competition (`asl-signs`, 250 ASL signs, about 94k MediaPipe
  landmark sequences, competition rules), KArSL-502 (Saudi/unified Arabic
  SL; `tfmohamedyahia/kars502-pose-75` has it as pose landmarks, CC BY-SA),
  Isharah-1000 (Saudi SL, NC licence), and several small Egyptian ArSL
  video sets. **They are different languages.** Training Souty on them
  would teach signs Tunisian Deaf people don't use. Their only sensible
  use is pre-training this network before fine-tuning on Tunisian data.
  That's a possible later optimisation, not a replacement.

So the TunSL images are the right base, and **recording clips** is the
only route to real movement. The pipeline already accepts clips with no
code change. The recording protocol and a proposed municipality and
daily-life vocabulary are in the notebook's last section. Agree the
correct sign for each word with ATILS before recording.

### Recording layout

```
souty-sign-clips/                 (private Kaggle dataset)
  baladya/    amira__01.mp4  sami__01.mp4 ...   existing label: adds motion
  mada9_wled/ amira__01.mp4 ...                 new label: just a new folder
  none/       amira__idle.mp4 ...               idle hands, transitions, other movement
```

Filenames start with `<signer>__`. With 3 or more signers, validation and
test are split by signer, so the reported score is for a person the model
has never seen.

### Recording list: introducing yourself and registering a business

None of these signs exist in the TunSL photos, so they can only be
learned from recorded clips. The target sentence is "مرحباً أنا جوهر
حلاق من سيدي بوزيد نحب نحل باتيندة مبادر ذاتي". Create one folder per
row in `souty-sign-clips/`, named exactly as the label. The signs
themselves must come from a Deaf signer or an ATILS interpreter: do not
invent them.

| Folder (label) | Spoken word | Meaning | Note |
|---|---|---|---|
| `ena` | أنا | I, me | |
| `jawher` | جوهر | Jawher | his personal name sign, one class; other names need their own folder |
| `7alle9` | حلاق | barber | |
| `men` | من | from | if TunSL does not sign it separately, skip the folder |
| `sidi_bouzid` | سيدي بوزيد | Sidi Bouzid | the place's sign |
| `n7eb` | نحب | I want | distinct from `t7eb` only if the sign differs |
| `n7el` | نحل | I open | |
| `patinda` | باتيندة | business licence (patente) | |
| `moubeder_dheti` | مبادر ذاتي | self-employed (auto-entrepreneur) | one sign or two? ask the signer |

Worth recording in the same session, for the same counter conversation:
`esmi` (اسمي, my name is), `ne5dem` (نخدم, I work), `7anout` (حانوت,
shop), `flous` (فلوس, money), `wra9` (أوراق, papers), `win` (وين, where),
`9adech` (قداش, how much), `y3aychek` (يعيشك, thank you).

Minimum for a class to survive is `MIN_SAMPLES` (15) usable clips, so
record at least 20 per sign, and add `none/` clips of the same people
with idle hands. With fewer than 3 signers the model is only reliable
for the people who recorded.

After training, each new label needs a vocabulary entry before the app
speaks it, see the next section.

Until these signs are recorded, the sentence is carried by nine universal
gestures (open palm, index up, shaka, V, thumb down, thumb up, three
fingers, OK ring, fist), marked `toConfirm` in the vocabulary. When a real
sign exists for a word, give it its own class and move the word there: the
gesture is then free to mean what it normally means.

## Deploying a trained model

The notebook writes `/kaggle/working/export/`. Download the folder and
follow [`apps/pwa/public/models/README.md`](../apps/pwa/public/models/README.md).
In short: copy the three model files into `apps/pwa/public/models/`, copy
`parity_fixtures.json` into `packages/sign-model/test/` and `handshapes.ts`
into `packages/vocabulary/src/`, run
`pnpm --filter @souty/sign-model test`, and bump `MODEL_VERSION`.

The app runs `HandLandmarker` (2 hands) on every camera frame and buffers
32 frames at 15 fps. [`packages/sign-model`](../packages/sign-model) then
computes `window_features()` in TypeScript and runs the network. It reads
the network's weights straight out of `sign_model.onnx`, with no ONNX
runtime, because onnxruntime-web's WASM alone would be about 15 MB.
Decoding uses the thresholds in `sign_model.meta.json`. **If you change the
network in step 7, port the change to `packages/sign-model/src/signnet.ts`.**
The ONNX reader rejects a graph it doesn't recognise, and the parity test
checks the probabilities.

A label is only spoken once it has an entry in
`packages/vocabulary/src/index.ts`, with its `label` equal to the name in
`meta.labels`.

## TunSL label glossary

Folder names are Tunisian Derja in Franco-Arabic transliteration (`3`=ع,
`5`=خ, `7`=ح, `9`=ق, `2`=ء) and become the model's class names
unchanged, except that accents are ASCII-folded (`métro` → `metro`).

**Already in the app (glosses verified):** `5adamet` services · `assam`
deaf · `labes` fine · `non` no · `oui` yes · `siye7a` tourism · `ta3raf`
you know · `mostawsaf` clinic · `sbitar` hospital · `bent` daughter ·
`bou` dad · `eben` son · `jad` grandfather · `jadda` grandmother · `mar2a`
woman · `tfol` child · `5mis` Thursday · `sebt` Saturday · `thnin` Monday
· `car` · `louage` shared taxi · `metro` · `train`.

**Newly trainable, now in the vocabulary as drafts marked `toConfirm`:**
`cv`, `demande` request, `om` mother, `jom3a` Friday, plus `wzara`, `lyoum`, `a7ad`, `n3awnek`, `baladya`,
`thleth`, `t7eb`, `taxi`, `3aslema`, `radio`, `dar`, `barnamjk`, `telvza`,
`5ou`, `ma7kma`, `enti`, `se7a`, `ta9ra`, `3ayla`, `tha9afa`, `nekteblk`,
`chabeb`, `erb3a`, `5al-3am`, `bousta`, `o5t`, `ta3lim`, `banka`. Confirm
each draft word with ATILS, then remove its `toConfirm`. (`mar7ba` welcome
and `karhba` car had too few usable photos and were dropped in the last
run.)

The step-4 audit printed by the notebook is the authoritative per-class
list, with category, sample count and two-hand share.
