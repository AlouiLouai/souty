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
| `packages/vocabulary` | `@souty/vocabulary` | The 65 signs: single source of truth for both apps, pinned by a contract test |
| `packages/sign-model` | `@souty/sign-model` | Runs the sign model in the browser (hand slots, window features, network forward pass, live decoding), checked against the training notebook's own outputs |
| `training` | | The Kaggle training notebook and its README |
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

Souty is a client-side application: every byte of inference happens on
the user's device, and no image, landmark or sentence is ever sent. The
only server code is one route that counts anonymous votes on the
vocabulary (`apps/pwa/app/api/votes/route.ts`, SPEC.md FR-14), and the only
third-party call is Vercel Web Analytics (cookieless page views; see
[section 3](#3-privacy--security)).

```
┌─────────────────────────────────────────────┐
│                 Phone / Browser              │
│                                              │
│  Camera ──► <video> ──► MediaPipe WASM       │
│              │           HandLandmarker      │
│              │           (2 hands,           │
│              │            GPU → CPU fallback)│
│              │                    │          │
│              │                    ▼          │
│              │      @souty/sign-model:       │
│              │      15 fps, 32-frame window, │
│              │      SignNet in TypeScript    │
│              ▼                    │          │
│         <canvas> overlay ◄────────┤          │
│         (skeletons + one sign     │          │
│          ring over both hands)    ▼          │
│    Decoder (0.6 conf, 3 wins in a row)       │
│              │                               │
│              ▼                               │
│    gestureDictionary.ts (label → Derja word) │
│              │                               │
│              ▼                               │
│    Sentence state → SpeechSynthesis (ar-TN)  │
└─────────────────────────────────────────────┘
        ▲ Service worker caches everything:
        app shell, fonts, models (8.6 MB), WASM runtime (~12 MB), icons
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
  on-camera canvas overlay keeps its own colors (dark halos and a dark
  disc behind the ring; white while reading, cyan `#22D3EE` while a sign
  fills, mint `#22BFA0` once it is said), chosen to stay visible over
  live video. The interface shows no text but the signed words: every
  instruction is a pictogram (`apps/pwa/components/Pictograms.tsx`) and
  every control a `lucide-react` icon with an Arabic `aria-label`
  (NFR-8 in `apps/pwa/SPEC.md`).
- **Self-hosted fonts** — Readex Pro (body) and Baloo Bhaijaan 2 (display),
  both covering Arabic and Latin, loaded with `next/font/local` from
  `packages/brand/src/fonts.ts`. The files and their SIL Open Font
  Licences are committed in `packages/brand/fonts`. They were moved off
  `next/font/google` because Google Fonts began serving Baloo Bhaijaan 2
  from extension-less URLs that crash the `next/font/google` loader at
  build time; self-hosting also removes a build-time network dependency.
- **`@mediapipe/tasks-vision` 1.0.1** — `HandLandmarker` in `VIDEO`
  running mode, `numHands: 2`, GPU delegate with CPU fallback. The sign
  classifier is not a MediaPipe model: `@souty/sign-model` runs it in
  plain TypeScript, reading its weights straight from `sign_model.onnx`
  (onnxruntime-web was rejected: its WASM alone is about 15 MB, for a
  0.19 M-parameter network). The library
  is loaded with a dynamic `import()` in `apps/pwa/lib/recognizer.ts`,
  client-side only, and warmed up while the landing screen is showing so
  the scanner opens quickly.
- **Voice** — recorded Tunisian word clips (`apps/pwa/public/audio/`,
  listed in `lib/voiceClips.ts`) are played with the Web Audio API; runs of
  words without a clip go to the browser's `SpeechSynthesis` (prefers
  `ar-TN`, then any `ar-*`, else the OS default). On demand only (no
  auto-speak). Clips are added with `pnpm --filter @souty/pwa voice`.
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
| `apps/pwa/components/GestureScanner.tsx` | Camera lifecycle, detection loop, feeds `LiveSignReader`, emits words |
| `apps/pwa/lib/recognizer.ts` | Shared, pre-warmed `HandLandmarker` (GPU → CPU fallback, `MAX_HANDS`) + `SignNet` + model meta |
| `apps/pwa/lib/assets.ts` | Parallel download of the three model files and the WASM runtime, persistent Cache API copy, stale-model purge, load progress, `MODEL_VERSION` |
| `apps/pwa/lib/handOverlay.ts` | `HandOverlay`: canvas skeletons, a dashed link between two hands, and one ring above both hands (reading / candidate / said) with the sign's word under it |
| `apps/pwa/components/SignGuide.tsx`, `SignGlyph.tsx` | Sign guide: every sign by category icon, with its hand shape (from `@souty/vocabulary`'s `shapeForSign`) and word, tap to hear |
| `packages/sign-model/src/` | `landmarks.ts` (hand slots), `features.ts` (window features), `onnx.ts` (weights from the ONNX file), `signnet.ts` (forward pass), `live.ts` (15 fps sampler, window buffer, decoder, `LiveSignReader`) |
| `packages/sign-model/test/parity.test.ts` | The TypeScript port must reproduce the notebook's features and probabilities (`parity_fixtures.json`) |
| `packages/vocabulary/src/index.ts` | The vocabulary: `SIGNS` (model label, Tunisian Arabic word, glosses, category, source), `WORD_BY_LABEL` |
| `packages/vocabulary/src/index.test.ts` | Contract test pinning the label → word mapping of the deployed model |
| `apps/pwa/lib/gestureDictionary.ts` | Thin adapter over `@souty/vocabulary`: `gestureToWord`, `hasWord` |
| `apps/pwa/lib/validation.ts`, `apps/pwa/lib/votes.ts`, `apps/pwa/app/api/votes/route.ts` | Community validation (SPEC.md, FR-14): the rule for the blue mark, this device's offline-first votes, and the route that counts votes in an Upstash Redis database with the `@upstash/redis` client. The app's only server code |
| `apps/pwa/lib/demoScript.ts` | Proof-of-concept script: with `?demo=jawher`, nine one-handed gestures speak stand-in words (SPEC.md, FR-13) |
| `apps/pwa/hooks/useSpeech.ts`, `apps/pwa/lib/voice.ts` | Speaks the sentence: recorded clips first, Arabic TTS for the rest |
| `apps/pwa/hooks/useSentence.ts`, `apps/pwa/hooks/useIdleHandReminder.ts` | Sentence state; no-hand reminder timer |
| `apps/pwa/app/page.tsx` | View orchestration (landing/onboarding/scanner/sign guide) |
| `apps/pwa/app/layout.tsx` | Fonts and tokens from `@souty/brand`, service-worker registration, analytics |
| `apps/pwa/public/sw.js` | Offline caching strategy |
| `apps/pwa/lib/offline.ts` | Asks the service worker to cache files loaded before it took control |
| `apps/pwa/next.config.mjs` | `transpilePackages` for the workspace packages; immutable caching headers for model/WASM; `must-revalidate` for `sw.js` |

### Recognition & decoding logic

- `HandLandmarker.detectForVideo(video, now)` runs from the animation-frame
  loop, guarded by `video.currentTime` change (no duplicate inference per
  frame) and capped at about 25 per second (`MIN_FRAME_INTERVAL_MS`, 40 ms)
  so low-end phones keep the UI responsive.
- Each result becomes one frame with two fixed hand slots (MediaPipe
  "Left" in slot 0, "Right" in slot 1; on a clash the smaller wrist x
  takes slot 0), x and z scaled by the frame's aspect ratio: the exact
  rule the training landmarks used.
- `LiveSignReader` resamples frames to 15 fps (a slow device repeats
  frames, so movement keeps its speed) and keeps the last 32. Every 2
  samples, while a hand is visible, it computes the window features and
  runs SignNet (about 9 ms in Node).
- `SignDecoder`: a sign is said when it wins 3 readings in a row with at
  least 0.6 confidence. It is not said again until another sign wins
  confidently, `none` wins, or the hands are gone for about 200 ms.
  Classes without a vocabulary word are treated as no sign. All
  thresholds come from `sign_model.meta.json`.
- Pausing, switching camera, or a long stall clears the window.
- A failing frame is caught and logged — the loop always reschedules, so a
  transient WASM error can't silently kill detection.
- Feedback (`HandOverlay`, one instance per canvas): whenever a hand is in
  view, one ring sits above both hands. It spins (with one dot per hand)
  while no sign leads, fills in cyan with the leading sign's progress and
  shows its word in a pill, and turns into a full mint ring with a check
  once said. The ring's position is smoothed, flips below the hands when
  they are near the top (with hysteresis), is sized in CSS pixels and kept
  inside the part of the frame `object-fit: cover` shows (`visibleRect`).
  A word that stops leading fades out over 450 ms. No percentage is drawn.
  The overlay is cleared on pause and camera switch.
- Lock-in feedback: a 60 ms haptic pulse (`navigator.vibrate`, where
  supported), a 500 ms burst ring, most-recent word highlighted in the
  sentence panel.
- Camera and model load in parallel with separate status; a failed model
  load has its own retry button (`loadModel`).

### Known architectural limits

1. **Training data is still images.** The model reads movement, but the
   public Tunisian data has none, so most signs are learned as a held
   shape and position. Recorded clips fix this with no code change.
2. **No facial markers**, and no continuous signing (one sign at a time).
3. Every sign class has a word, but 32 of them are drafts (`toConfirm` in
   `packages/vocabulary`) until ATILS confirms them.

## 2. Model training pipeline

Training runs on Kaggle (free GPU) from `training/kaggle_pipeline.ipynb`.
The whole pipeline (data sources, two-hand landmark extraction, features,
network, splits, export, recording protocol) is documented in
[`training/README.md`](../training/README.md) and in the notebook itself.
The previous MediaPipe Model Maker pipeline was replaced: it was
hard-coded to one hand and one still frame.

### Changing the model or the vocabulary

1. Run the notebook and download its `export/` folder.
2. Copy the files as described in
   [`apps/pwa/public/models/README.md`](../apps/pwa/public/models/README.md),
   run `pnpm --filter @souty/sign-model test` (parity with the notebook),
   and bump `MODEL_VERSION` in `apps/pwa/lib/assets.ts`.
3. For every class that should be spoken, add or keep an entry in
   `packages/vocabulary/src/index.ts`, with its `label` equal to the class
   name in `sign_model.meta.json`, and update the contract in
   `packages/vocabulary/src/index.test.ts` in the same change.
4. Manually test every sign on a phone (`apps/pwa/TESTING.md`). Per-class
   aggregate accuracy can hide one badly confused class; the notebook's
   step 9 prints per-class test recall and the most common confusion.

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
- Bundle: ~143 kB first-load JS + 8.6 MB model + WASM runtime (two
  variants committed, SIMD and non-SIMD, ~23 MB together; the browser
  loads one, ~12 MB), all cache-first after first visit.
- `apps/pwa/next.config.mjs` sets immutable caching on `/models` + `/wasm`
  and `must-revalidate` on `/sw.js` (so updates actually propagate).

## 5. Configuration knobs

| What | Where | Value |
|---|---|---|
| Confidence, wins in a row, model stride | `apps/pwa/public/models/sign_model.meta.json` → `decoding` | 0.6, 3, every 2 samples |
| Window, sample rate | `apps/pwa/public/models/sign_model.meta.json` → `window_frames`, `fps` | 32 frames, 15 fps |
| Hand tracking rate cap | `apps/pwa/components/GestureScanner.tsx` → `MIN_FRAME_INTERVAL_MS` | 40 ms (~25 fps) |
| Max tracked hands | `apps/pwa/lib/recognizer.ts` → `MAX_HANDS` | 2 |
| Sign → word map | `packages/vocabulary/src/index.ts` → `SIGNS` | 65 entries |
| Model files | `apps/pwa/public/models/` | `hand_landmarker.task`, `sign_model.onnx`, `sign_model.meta.json` (66 classes) |
| Model cache version | `apps/pwa/lib/assets.ts` → `MODEL_VERSION` | 2 |
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
  the label → word mapping and the 55 + 10 = 65 split; every draft word
  must say what to confirm.
- Sign model parity test: `packages/sign-model/test/parity.test.ts` runs
  the shipped `sign_model.onnx` on the notebook's `parity_fixtures.json`
  and requires the same features and probabilities (to 1e-4), plus unit
  tests of hand slotting, sampling and decoding.
- PWA tests (`apps/pwa`, `pnpm --filter @souty/pwa test`): every
  vocabulary label must be a class of the shipped model; the model and
  WASM files declared in `lib/assets.ts` must exist with their declared
  sizes, on versioned same-origin URLs; the asset cache name and prefixes
  must match `public/sw.js`; the manifest's icons must exist; the
  feedback ring is drawn whenever a hand is visible and draws no text but
  the word (`lib/handOverlay.test.ts`); no component shows visible text
  (`components/noVisibleText.test.ts`).
- Requirements and traceability: `apps/pwa/SPEC.md` gives every
  requirement an ID (FR-1 to FR-12, NFR-1 to NFR-8), and its section 9
  maps each one to automated tests and to manual cases.
- Manual test plan: `apps/pwa/TESTING.md`, cases M-01 to M-19, run on a
  real phone after any model swap. It covers every spoken sign (with its
  test recall), two-handed signs and their ring feedback, false words
  while idle, offline start, the sign guide, and the overlay on light and
  dark skin and backgrounds.
- Resilience paths covered by UI states: camera denied (with Permissions
  API auto-resume when the user grants access from browser settings),
  unsupported browser, model load failure, render crash (error boundary),
  mid-loop inference failure (loop always reschedules).
