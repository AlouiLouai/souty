# Souty — Technical Documentation

This document covers the full technical picture: architecture, the custom
model training pipeline, deployment, and testing. (The executable training
notebook is kept out of the public repo — this document preserves
everything needed to reproduce it.)

## 1. Architecture overview

Souty is a fully client-side application — there is no backend, no API, no
database, no analytics. Every byte of inference happens on the user's device.

```
┌─────────────────────────────────────────────┐
│                 Phone / Browser              │
│                                              │
│  Camera ──► <video> ──► MediaPipe WASM       │
│              │           GestureRecognizer   │
│              │           (custom 34-class    │
│              │            .task model,       │
│              │            GPU → CPU fallback)│
│              ▼                    │          │
│         <canvas> overlay ◄────────┘          │
│         (skeleton + per-hand                 │
│          progress ring)                      │
│              │                               │
│              ▼                               │
│    Lock-in filter (0.65 conf, 700ms hold)    │
│              │                               │
│              ▼                               │
│    gestureDictionary.ts (label → Derja word) │
│              │                               │
│              ▼                               │
│    Sentence state → SpeechSynthesis (ar-TN)  │
└─────────────────────────────────────────────┘
        ▲ Service worker caches everything:
        app shell, model (8.1 MB), WASM (~34 MB), icons
```

### Stack

- **Next.js 15 (App Router) + React 19 + TypeScript** — static-friendly, PWA
  metadata routes.
- **Tailwind CSS 3 + shadcn/ui** — dark, high-contrast theme tuned for
  sustained camera use (near-black `0 0% 4%`, not pure `#000`).
- **`@mediapipe/tasks-vision` 1.0.1** — `GestureRecognizer` in `VIDEO`
  running mode, `numHands: 2`, GPU delegate with CPU fallback. Dynamic
  `import()` so the library only loads client-side when the scanner mounts.
- **Browser `SpeechSynthesis`** — voice selection prefers `ar-TN`, then any
  `ar-*`, else the OS default. On-demand only (no auto-speak).
- **Hand-written service worker** (`public/sw.js`) — network-first for
  navigations (fresh shell online, cached shell offline), cache-first for
  `/_next/static/`, `/models/`, `/wasm/`, `/icons/`. Registered in
  production builds only. Bump `CACHE_VERSION` when caching *logic* changes.

### Key source files

| File | Role |
|---|---|
| `components/GestureScanner.tsx` | Camera lifecycle, model loading, detection loop, canvas overlay, per-hand lock-in state |
| `lib/gestureDictionary.ts` | Model label → Tunisian Arabic word (`GESTURE_WORD_MAP`), `IGNORED_LABELS` |
| `hooks/useSpeech.ts` | Arabic voice selection + `speakSentence` |
| `app/page.tsx` | View orchestration (landing/onboarding/scanner), sentence state, idle reminder |
| `public/sw.js` | Offline caching strategy |
| `next.config.mjs` | Immutable caching headers for model/WASM; no-store for `sw.js` |

### Recognition & lock-in logic

- `recognizeForVideo(video, now)` runs every animation frame, guarded by
  `video.currentTime` change (no duplicate inference per frame).
- Per hand (keyed by MediaPipe handedness): the top category must score
  ≥ `CONFIDENCE_THRESHOLD` (0.65) and persist for `LOCK_HOLD_MS` (700ms)
  before locking in. The same gesture held continuously locks in only once;
  removing and re-showing it allows a repeat.
- A failing frame is caught and logged — the loop always reschedules, so a
  transient WASM error can't silently kill detection.
- Lock-in feedback: haptic pulse (`navigator.vibrate`, where supported),
  expanding flash ring at the hand, most-recent word highlighted cyan in
  the sentence panel.

### Known architectural limits

1. **Static shapes only.** The classifier sees one frame of 21 hand
   landmarks — no motion, no trajectories, no facial markers.
2. **One hand at a time.** Both Model Maker's training loader
   (`num_hands=1`, reads only `hand_landmarks[0]`) and the app's inference
   treat each hand independently. A genuinely two-handed sign cannot be
   represented, at any amount of training.
3. Moving past either limit needs a different architecture (landmark
   sequences + temporal classifier), scoped in the roadmap.

## 2. Model training pipeline

Retraining uses **MediaPipe Model Maker on Kaggle** (free GPU, no local
Python setup). Model Maker is officially "available but no longer actively
maintained" — it works, don't expect upstream fixes.

> **Reproducing:** the notebook (`training/kaggle_pipeline.ipynb`) is not
> in the public repo. Request it from the team, upload to a Kaggle
> Notebook (File → Upload Notebook), attach the two datasets below, run
> top to bottom. Fully self-contained (installs its own deps).

**Known install issue (as of early 2026):** `pip install mediapipe-model-maker`
fails on Python 3.12 (Kaggle/Colab default) with a PyYAML build error —
unresolved upstream bug (mediapipe-samples#643). Workaround, already in
the notebook: install Python 3.10 alongside and run under it.

### Data sources

1. **Tunisian Sign Language Dataset**
   ([Kaggle](https://www.kaggle.com/datasets/warcoder/tunisian-sign-language-dataset);
   Chakroun & Jerbi, 2023, Mendeley Data DOI `10.17632/fbjjgzgv7f.1`;
   collected with **ATILS**; **CC BY 4.0 — credit it publicly**).
   4,423 images, 57 real Tunisian signs, 7 signers, 5 categories
   (Demandes 24 / Destinations 8 / Famille 12 / Jours 7 / Transport 6).
   Uniform 224×224, zero corrupt files.
2. **HaGRID** (`innominate817/hagrid-classification-512p-no-gesture`) —
   supplies the required `none` negative class and 10 universal-gesture
   classes (`palm`, `fist`, `like`, `dislike`, `peace`, `one`, `ok`,
   `three`, `four`, `call`), capped at 120 images/class to balance against
   the much smaller TunSL classes.

### Dataset format (verified against official Model Maker docs)

Flat layout: `<dataset_path>/<label_name>/<img_name>.*`, with exactly one
folder literally named `none`. Model Maker runs its own hand detector while
loading and **silently drops images with no hand found** — `Dataset.size`
reflects survivors, and the pipeline prints the drop gap explicitly.

### Why 23 of the 57 TunSL signs

Every one of the 4,423 photos was run through MediaPipe `HandLandmarker`
(2-hand mode) to audit how many hands each photo actually shows:

| Group | Signs | Verdict |
|---|---|---|
| Majority two-handed (e.g. `cv`, `demande`, `om`, `jom3a` at 100%; `wzara`, `n3awnek`, `baladya`, `3aslema`, `se7a` at 70–91%) | 28 | Can never be learned by this architecture — excluded |
| Reliably single-hand (≥75% single-hand purity, ≥15 clean examples) | 23 | **Kept for training** |
| Clean but too thin (`mar7ba`: 13 imgs; `karhba`: 9 imgs) | 2 | Excluded for thinness |
| Mixed/low purity | remainder | Excluded |

Training all 57 naively scored 60.22% test accuracy — a number that was
*hiding* the two-hand structural problem, not measuring learnability.

### Train/test split leak fix

The dataset's own report states its images are OpenCV key frames from
videos — perceptual-hash analysis confirms consecutive files are
near-duplicates (Hamming 1–7 vs 7–28 for distant files). Model Maker's
`Dataset.from_folder()` shuffles unseeded before a contiguous split, so a
random split leaks near-identical frames into both sides. The pipeline
instead splits each class's capture-ordered files into contiguous
train/val/test blocks *itself* and loads three separate `Dataset` objects.
Not a true signer-level holdout (no signer IDs documented), but a far more
honest generalization estimate.

### Deployed vocabulary: 34 classes (33 signs + `none`)

**TunSL (23):** Demandes — `5adamet` خدمات, `assam` أصم, `labes` لاباس,
`non` لا, `oui` ايه, `siye7a` سياحة, `ta3raf` تعرف · Destinations —
`mostawsaf` مستوصف, `sbitar` سبيطار · Famille — `bent` بنت, `bou` بابا,
`eben` ابن, `jad` جد, `jadda` جدة, `mar2a` مرأة, `tfol` طفل · Jours —
`5mis` الخميس, `sebt` السبت, `thnin` الاثنين · Transport — `car` سيارة,
`louage` لواج, `metro` مترو, `train` قطار.

**HaGRID-derived (10):** `Open_Palm` عسلامة, `Closed_Fist` وقف, `Thumb_Up`
ايه, `Thumb_Down` لا, `Victory` بالسلامة, `Pointing_Up` استنى, `OK_Sign`
باهي, `Three_Fingers` 3, `Four_Fingers` 4, `Shaka_Sign` مبروك. (Mapping
proven in the original 10-class run: 95.2% accuracy. `ILoveYou` has no
HaGRID equivalent and stays out.)

Intentional redundancy: `Thumb_Up`/`oui` both mean "yes" — two different
hand shapes for the same word, not a conflict.

### Changing the vocabulary

Retraining replaces the whole classifier head — there is no incremental
"add a class". Any change means:

1. Update `KEPT_SIGN_LABELS` / `HAGRID_LABEL_MAP` in the notebook.
2. Update `GESTURE_WORD_MAP` in `lib/gestureDictionary.ts` to match
   **exactly** (model output category name === dictionary key).
3. Retrain everything together; download the `.task` from Kaggle's Output
   panel; replace `public/models/gesture_recognizer.task`.
4. Manually test every sign (per-class aggregate accuracy can hide one
   badly-confused class) — see `TESTING.md`; drop any sign the model still
   can't reliably distinguish.

The combined 34-class problem was assembled from separately-proven halves —
treat per-sign manual testing as mandatory after any retrain.

## 3. Privacy & security

- No network calls beyond serving the app: model and WASM are self-hosted
  (`public/models/`, `public/wasm/`), not CDN-fetched.
- Camera frames are processed in memory and never stored or transmitted.
- No accounts, no cookies, no analytics — no personal-data compliance
  surface, safe for minors.
- `.mcp.json`, `.claude/`, `.kimi-code/` (local tooling with live tokens)
  are gitignored and never committed.

## 4. Deployment

- `npm run build` → any Next.js-capable host (Vercel recommended; zero
  config). HTTPS is mandatory (camera + service worker).
- Bundle: ~129 kB first-load JS + 8.1 MB model + ~34 MB WASM (three
  variants; the browser loads one), all cache-first after first visit.
- `next.config.mjs` sets immutable caching on `/models` + `/wasm` and
  `must-revalidate` on `/sw.js` (so updates actually propagate).

## 5. Configuration knobs

| What | Where | Value |
|---|---|---|
| Confidence threshold | `GestureScanner.tsx` → `CONFIDENCE_THRESHOLD` | 0.65 |
| Hold-to-lock duration | `GestureScanner.tsx` → `LOCK_HOLD_MS` | 700 ms |
| Max tracked hands | `GestureScanner.tsx` → `MAX_HANDS` | 2 |
| Gesture → word map | `lib/gestureDictionary.ts` → `GESTURE_WORD_MAP` | 33 entries |
| Model file | `public/models/gesture_recognizer.task` | custom 34-class |
| Splash duration | `app/page.tsx` → `SPLASH_MS` | 4000 ms |
| Idle reminder delay | `app/page.tsx` → `IDLE_HAND_TIMEOUT_MS` | 5000 ms |
| SW cache version | `public/sw.js` → `CACHE_VERSION` | `souty-v1` |

## 6. Testing

- `npm run lint` — clean. `npm run build` — clean (verified before release).
- Manual per-sign protocol: `TESTING.md` — every deployed sign is tested by
  hand on a real device after any model swap, in varied lighting and
  against light/dark backgrounds (the overlay is explicitly built to stay
  readable on both).
- Resilience paths covered by UI states: camera denied (with Permissions
  API auto-resume when the user grants access from browser settings),
  unsupported browser, model load failure, render crash (error boundary),
  mid-loop inference failure (loop always reschedules).
