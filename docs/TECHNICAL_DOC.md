# Souty — Technical Documentation

This document covers the full technical picture: architecture, the custom
model training pipeline, deployment, and testing. (The executable training
notebook is kept out of the public repo — this document preserves
everything needed to reproduce it.)

## Repository layout

The repository is a pnpm workspace orchestrated by Turborepo. This document
is about the PWA; file paths are given from the repository root.

| Path | Package | Role |
|---|---|---|
| `apps/pwa` | `@souty/pwa` | The sign-to-speech PWA described here (dev server on port 3000) |
| `apps/marketing` | `@souty/marketing` | The marketing site, English / French / Arabic (dev server on port 3001) |
| `packages/vocabulary` | `@souty/vocabulary` | The 33 signs: single source of truth for both apps, pinned by a contract test |
| `packages/brand` | `@souty/brand` | Design tokens, Tailwind preset, palette constants, self-hosted fonts |
| `packages/tsconfig` | `@souty/tsconfig` | Shared TypeScript bases |
| `tools/qr` | `@souty/qr` | Generates and verifies the pitch QR codes (`pnpm qr`) |
| `docs` | | This document, the pitch deck, the deployment runbook, the design reference, the generated QR codes |

The shared packages have no build step: they export TypeScript and CSS
source, and each Next.js app compiles them through `transpilePackages` in
its `next.config.mjs`. Versions of shared dependencies are declared once,
in the `catalog` of `pnpm-workspace.yaml`. Setup and commands are in the
[root README](../README.md); deployment is in
[`DEPLOYMENT.md`](DEPLOYMENT.md).

## 1. Architecture overview

Souty is a fully client-side application — there is no backend, no API, no
database. Every byte of inference happens on the user's device. The only
third-party call is Vercel Web Analytics (cookieless page views; see
[section 3](#3-privacy--security)).

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
        app shell, fonts, model (8.1 MB), WASM runtime (~12 MB), icons
```

### Stack

- **Next.js 15 (App Router) + React 19 + TypeScript** — static-friendly, PWA
  metadata routes.
- **Tailwind CSS 3 + shadcn/ui-style primitives** (`apps/pwa/components/ui`)
  — a light "picture-book" theme: sky page (`#E9ECFF`), white cards,
  ink-plum text and borders (`#2A1846`), harissa (`#FF5A3C`) for primary
  actions and highlights. The palette and the semantic color roles are
  defined once in `packages/brand/src/tokens.css` and mapped onto Tailwind
  names by the preset in `packages/brand/src/tailwind-preset.ts`. The
  on-camera canvas overlay keeps its own colors (white skeleton with a
  dark halo, cyan `#22D3EE` progress ring), chosen to stay visible over
  live video.
- **Self-hosted fonts** — Readex Pro (body) and Baloo Bhaijaan 2 (display),
  both covering Arabic and Latin, loaded with `next/font/local` from
  `packages/brand/src/fonts.ts`. The files and their SIL Open Font
  Licences are committed in `packages/brand/fonts`. They were moved off
  `next/font/google` because Google Fonts began serving Baloo Bhaijaan 2
  from extension-less URLs that crash the `next/font/google` loader at
  build time; self-hosting also removes a build-time network dependency.
- **`@mediapipe/tasks-vision` 1.0.1** — `GestureRecognizer` in `VIDEO`
  running mode, `numHands: 2`, GPU delegate with CPU fallback. The library
  is loaded with a dynamic `import()` in `apps/pwa/lib/recognizer.ts`,
  client-side only, and warmed up while the landing screen is showing so
  the scanner opens quickly.
- **Browser `SpeechSynthesis`** — voice selection prefers `ar-TN`, then any
  `ar-*`, else the OS default. On-demand only (no auto-speak).
- **Hand-written service worker** (`apps/pwa/public/sw.js`), registered in
  production builds only:
  - navigations are network-first (fresh shell online, cached shell
    offline or when the network takes longer than 4 s);
  - `/_next/static/` (JS, CSS, fonts), `/icons/` and the manifest are
    cache-first, in the shell cache;
  - `/models/` and `/wasm/` are cache-first in a separate asset cache
    (`souty-assets-v1`) that `apps/pwa/lib/assets.ts` fills and that shell
    version bumps never purge. The model URL carries `?v=N`
    (`MODEL_VERSION`), so a new model is a new cache key.

  Bump `SHELL_CACHE` when the caching *logic* changes.
- **Vercel Web Analytics** (`@vercel/analytics`) — the `<Analytics />`
  component in `apps/pwa/app/layout.tsx`. Page views only; see
  [section 3](#3-privacy--security).

### Key source files

| File | Role |
|---|---|
| `apps/pwa/components/GestureScanner.tsx` | Camera lifecycle, detection loop, per-hand lock-in state |
| `apps/pwa/lib/recognizer.ts` | Shared, pre-warmed MediaPipe recognizer (GPU → CPU fallback, `MAX_HANDS`) |
| `apps/pwa/lib/assets.ts` | Parallel model/WASM download, persistent Cache API copy, load progress, `MODEL_VERSION` |
| `apps/pwa/lib/handOverlay.ts` | Canvas skeleton + progress ring / label drawing |
| `packages/vocabulary/src/index.ts` | The vocabulary: `SIGNS` (model label, Tunisian Arabic word, glosses, category, source), `WORD_BY_LABEL`, `NEGATIVE_LABELS` |
| `packages/vocabulary/src/index.test.ts` | Contract test pinning the label → word mapping of the deployed model |
| `apps/pwa/lib/gestureDictionary.ts` | Thin adapter over `@souty/vocabulary`: `gestureToWord`, `IGNORED_LABELS` |
| `apps/pwa/hooks/useSpeech.ts` | Arabic voice selection + `speak` |
| `apps/pwa/hooks/useSentence.ts`, `apps/pwa/hooks/useIdleHandReminder.ts` | Sentence state; no-hand reminder timer |
| `apps/pwa/app/page.tsx` | View orchestration (landing/onboarding/scanner) |
| `apps/pwa/app/layout.tsx` | Fonts and tokens from `@souty/brand`, service-worker registration, analytics |
| `apps/pwa/public/sw.js` | Offline caching strategy |
| `apps/pwa/lib/offline.ts` | Asks the service worker to cache files loaded before it took control |
| `apps/pwa/next.config.mjs` | `transpilePackages` for the workspace packages; immutable caching headers for model/WASM; `must-revalidate` for `sw.js` |

### Recognition & lock-in logic

- `recognizeForVideo(video, now)` runs from the animation-frame loop,
  guarded by `video.currentTime` change (no duplicate inference per frame)
  and capped at about 25 inferences per second (`MIN_FRAME_INTERVAL_MS`,
  40 ms) so low-end phones keep the UI responsive.
- Per hand (keyed by MediaPipe handedness): the top category must score
  ≥ `CONFIDENCE_THRESHOLD` (0.65) and persist for `LOCK_HOLD_MS` (700ms)
  before locking in. The same gesture held continuously locks in only once;
  removing and re-showing it allows a repeat.
- A failing frame is caught and logged — the loop always reschedules, so a
  transient WASM error can't silently kill detection.
- Lock-in feedback: haptic pulse (`navigator.vibrate`, where supported),
  expanding flash ring at the hand, most-recent word highlighted in the
  sentence panel.

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
2. Update `SIGNS` in `packages/vocabulary/src/index.ts` to match
   **exactly** (model output category name === the entry's `label`), and
   update `DEPLOYED_MODEL_CONTRACT` in
   `packages/vocabulary/src/index.test.ts` in the same change. The test
   fails on any accidental drift; run it with
   `pnpm --filter @souty/vocabulary test`. `apps/pwa/lib/gestureDictionary.ts`
   is a thin adapter and needs no edit; the marketing site depends on the
   same package.
3. Retrain everything together; download the `.task` from Kaggle's Output
   panel; replace `apps/pwa/public/models/gesture_recognizer.task` and
   bump `MODEL_VERSION` in `apps/pwa/lib/assets.ts`, so returning users
   download the new model instead of the cached one.
4. Manually test every sign (per-class aggregate accuracy can hide one
   badly-confused class) — see `apps/pwa/TESTING.md`; drop any sign the
   model still can't reliably distinguish.

The combined 34-class problem was assembled from separately-proven halves —
treat per-sign manual testing as mandatory after any retrain.

## 3. Privacy & security

- Camera frames are processed in memory and never stored or transmitted.
  Recognition runs in the browser: no frame, landmark, recognized sign or
  sentence leaves the device.
- Model, WASM runtime and fonts are self-hosted
  (`apps/pwa/public/models/`, `apps/pwa/public/wasm/`,
  `packages/brand/fonts/`), not CDN-fetched.
- No accounts, and the app sets no cookies.
- **One third-party call: Vercel Web Analytics.** `apps/pwa/app/layout.tsx`
  renders `<Analytics />` from `@vercel/analytics`. On the Vercel
  deployment it reports cookieless page views to Vercel (per
  [Vercel's documentation](https://vercel.com/docs/analytics/privacy-policy):
  timestamp, page URL, referrer, device, OS and browser type, location
  down to the city; no cookie, no persistent visitor identifier). The app
  sends no custom events, so nothing about the camera, the signs or the
  sentences is included. Data is only recorded when Web Analytics is
  enabled for the project in the Vercel dashboard. The marketing site
  includes the same component.
- `.mcp.json`, `.claude/`, `.kimi-code/` (local tooling with live tokens)
  are gitignored and never committed.

## 4. Deployment

- Production runs on Vercel, one project per app, both built from this
  repository: Root Directory `apps/pwa` for the PWA, `apps/marketing` for
  the marketing site. The runbook, including the one-time cutover of the
  existing project to the monorepo layout, is [`DEPLOYMENT.md`](DEPLOYMENT.md).
- `pnpm build` builds both apps; `pnpm --filter @souty/pwa build` builds
  the PWA alone. HTTPS is mandatory (camera + service worker).
- Bundle: ~130 kB first-load JS + 8.1 MB model + WASM runtime (two
  variants committed, SIMD and non-SIMD, ~23 MB together; the browser
  loads one, ~12 MB), all cache-first after first visit.
- `apps/pwa/next.config.mjs` sets immutable caching on `/models` + `/wasm`
  and `must-revalidate` on `/sw.js` (so updates actually propagate).

## 5. Configuration knobs

| What | Where | Value |
|---|---|---|
| Confidence threshold | `apps/pwa/components/GestureScanner.tsx` → `CONFIDENCE_THRESHOLD` | 0.65 |
| Hold-to-lock duration | `apps/pwa/components/GestureScanner.tsx` → `LOCK_HOLD_MS` | 700 ms |
| Inference rate cap | `apps/pwa/components/GestureScanner.tsx` → `MIN_FRAME_INTERVAL_MS` | 40 ms (~25 fps) |
| Max tracked hands | `apps/pwa/lib/recognizer.ts` → `MAX_HANDS` | 2 |
| Gesture → word map | `packages/vocabulary/src/index.ts` → `SIGNS` | 33 entries |
| Model file | `apps/pwa/public/models/gesture_recognizer.task` | custom 34-class |
| Model cache version | `apps/pwa/lib/assets.ts` → `MODEL_VERSION` | 1 |
| Splash duration | `apps/pwa/components/SplashScreen.tsx` → `SPLASH_MS` | 1200 ms (+ 300 ms fade) |
| Idle reminder delay | `apps/pwa/app/page.tsx` → `IDLE_HAND_TIMEOUT_MS` | 5000 ms |
| SW shell cache version | `apps/pwa/public/sw.js` → `SHELL_CACHE` | `souty-v3` |
| SW asset cache | `apps/pwa/public/sw.js` and `apps/pwa/lib/assets.ts` → `ASSET_CACHE` | `souty-assets-v1` |

## 6. Testing

- Automated, from the repository root: `pnpm lint`, `pnpm typecheck`,
  `pnpm test`, `pnpm build` (or `pnpm check` for the first three). CI
  (`.github/workflows/ci.yml`) runs
  `pnpm turbo run lint typecheck test build` on every pull request and on
  every push to `main`.
- Vocabulary contract test: `packages/vocabulary/src/index.test.ts` pins
  the label → word mapping the deployed model was validated against and
  the 23 + 10 = 33 split.
- Manual per-sign protocol: `apps/pwa/TESTING.md` — every deployed sign is
  tested by hand on a real device after any model swap, in varied lighting
  and against light/dark backgrounds (the overlay is explicitly built to
  stay readable on both).
- Resilience paths covered by UI states: camera denied (with Permissions
  API auto-resume when the user grants access from browser settings),
  unsupported browser, model load failure, render crash (error boundary),
  mid-loop inference failure (loop always reschedules).
