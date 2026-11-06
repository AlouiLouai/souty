# Souty PWA (صوتي): live sign language scanner

The product app of the [Souty monorepo](../../README.md), package
`@souty/pwa`, live at <https://souty.vercel.app>.

**Souty** ("my voice" in Tunisian Arabic) is a mobile-first web app that
gives a voice to deaf and hard-of-hearing people: hold a hand sign up to
your phone's camera, and the app recognizes it, builds a sentence word by
word, and reads it aloud in Tunisian Arabic. Recognition runs **entirely on
the device**: no server, no account, and camera frames never leave the
phone. Once loaded, it works with no internet connection.

Built for the Social Tech Challenge 2026.

## The problem

A deaf person walking into a social services office, a clinic, or a
municipality in Tunisia faces a wall: staff don't understand Tunisian Sign
Language, and written Arabic is often a second language for signers. Simple
requests ("hospital", "my son", "Thursday", "help") become a frustrating
improvisation.

## The solution

Souty turns a smartphone into a real-time sign-to-speech bridge:

1. Point the camera at a hand sign.
2. A progress ring fills around the hand. Hold the sign about 0.7 s to lock
   it in.
3. The recognized word (in Tunisian Derja, Arabic script) is appended to a
   growing sentence.
4. One tap speaks the full sentence aloud for the person across the desk.

**Current vocabulary: 33 recognizable signs.** 23 real Tunisian Sign
Language signs (family, transport, days, destinations, requests) trained on
the Tunisian Sign Language Dataset, plus 10 universal hand gestures (hello,
stop, yes, no, wait, OK, the numbers 3 and 4, congratulations...). The full
list lives in [`packages/vocabulary`](../../packages/vocabulary/src/index.ts).

## Key features

- **On-device AI.** MediaPipe gesture recognition runs locally (GPU
  delegate, CPU fallback). Camera frames never leave the phone.
- **Offline PWA.** Installable to the home screen. The model, the WASM
  runtime, the fonts and the app shell are all self-hosted and cached by a
  service worker, so it keeps working with no connectivity.
- **Tunisian first.** Real Tunisian Sign Language signs, Tunisian Derja
  output, Arabic right-to-left interface, Arabic text-to-speech voice
  selection.
- **Two hands tracked at once**, each recognized independently.
- **Accessible by design.** Haptic feedback on word lock-in, a hand overlay
  drawn in white with a dark halo so it stays visible on light and dark
  backgrounds, large touch targets, an onboarding tour, an idle reminder,
  error states with retry.
- **No backend.** A static site with no per-user server cost.

## Run it locally

Install once from the repository root (see the
[root README](../../README.md#prerequisites) for Node and pnpm versions):

```bash
pnpm install
```

Then start the PWA, from the repository root:

```bash
pnpm dev:pwa
```

or, equivalently, from anywhere in the workspace:

```bash
pnpm --filter @souty/pwa dev
```

Open `http://localhost:3000`. The trained gesture model
(`public/models/gesture_recognizer.task`) and the MediaPipe WASM runtime
(`public/wasm/`) are committed to the repo, so no download step is needed.

Camera APIs require a secure origin: `localhost` works; a physical phone on
your LAN needs an HTTPS tunnel:

```bash
npx localtunnel --port 3000   # or: ngrok http 3000
```

The service worker registers in production builds only. To test offline
behaviour locally, build and start the production server:

```bash
pnpm --filter @souty/pwa build
pnpm --filter @souty/pwa start   # http://localhost:3000
```

## Checks

| Command (from the repository root) | What it does |
|---|---|
| `pnpm --filter @souty/pwa lint` | ESLint |
| `pnpm turbo run typecheck --filter=@souty/pwa` | Builds the app, then runs `tsc --noEmit` (Next.js generates its route types during the build) |
| `pnpm --filter @souty/vocabulary test` | The vocabulary contract test |
| `pnpm check` | Lint, typecheck and tests for the whole workspace |

Recognition itself is tested by hand on a real phone: see
[`TESTING.md`](TESTING.md).

## Deploy

The app is deployed on Vercel from this monorepo, with the Vercel project's
Root Directory set to `apps/pwa`. HTTPS is mandatory in production (camera
access and the service worker both require it); Vercel provides it. The
full runbook, including the one-time cutover to the monorepo layout, is in
[`docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md).

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| On-device ML | `@mediapipe/tasks-vision` `GestureRecognizer` (GPU delegate, CPU fallback), custom 34-class model (33 signs + `none`), 8 MB |
| Vocabulary | `@souty/vocabulary` (workspace package), shared with the marketing site |
| UI | Tailwind CSS 3, shadcn/ui-style primitives in `components/ui`, light "picture-book" theme from `@souty/brand` (design tokens + Tailwind preset) |
| Fonts | Readex Pro and Baloo Bhaijaan 2, self-hosted through `@souty/brand/fonts` (`next/font/local`) |
| Voice | Browser `SpeechSynthesis` (prefers `ar-TN`, then any `ar-*` voice) |
| Offline | Hand-written service worker (`public/sw.js`): network-first app shell, cache-first static files, a separate persistent cache for the model and WASM runtime |
| Analytics | Vercel Web Analytics (`@vercel/analytics`), cookieless page views only, see [Privacy](#privacy) |
| Backend | None. Fully client-side |

## How recognition works

1. `lib/recognizer.ts` loads the model and the WASM runtime (warmed up
   while the landing screen is still showing). `components/GestureScanner.tsx`
   then runs `recognizeForVideo` on camera frames, capped at about 25
   frames per second.
2. MediaPipe locates 21 landmarks per hand, for up to 2 hands, and the
   custom model classifies each hand's shape.
3. A gesture must stay above the confidence threshold (0.65) for 700 ms
   before it locks in as a word, so single-frame misfires are rejected.
4. Locked gestures map to Tunisian Arabic words through
   `lib/gestureDictionary.ts`, a thin adapter over `@souty/vocabulary`, and
   accumulate into a sentence.
5. "Speak sentence" reads it aloud with the browser's text-to-speech
   (`SpeechSynthesis`).

**Known limitation:** the model classifies a single still frame. It
recognizes *held static hand shapes*, not motion-based signs. Genuinely
two-handed signs are also beyond this architecture (both training and
inference see one hand at a time). See
[`docs/TECHNICAL_DOC.md`](../../docs/TECHNICAL_DOC.md) for details.

## Documentation

- [`SPEC.md`](SPEC.md): product and technical spec
- [`TESTING.md`](TESTING.md): manual test checklist
- [`public/models/README.md`](public/models/README.md): the model asset
- [`docs/TECHNICAL_DOC.md`](../../docs/TECHNICAL_DOC.md): architecture, model training pipeline, configuration
- [`docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md): Vercel runbook
- [`docs/PITCH_DECK.md`](../../docs/PITCH_DECK.md): pitch deck content

## Project structure

Paths are relative to `apps/pwa/`.

```
app/                     Next.js App Router (layout, page, manifest, error boundary, globals.css)
components/
  GestureScanner.tsx     Camera + MediaPipe recognition + per-hand lock-in
  ScannerWorkspace.tsx   Scanner + sentence panel, shared by app and tour
  TranslationPanel.tsx   Growing sentence + speak/undo/clear/pause controls
  LandingScreen.tsx      Entry screen
  OnboardingTour.tsx     3-step interactive tutorial on a live scanner
  SplashScreen.tsx       Launch splash
  IdleExitPopup.tsx      "Put your hand back in frame" reminder
  StatusDialog.tsx       Shared loading/error/reminder card
  Logo.tsx               Logo mark + wordmark
  ServiceWorkerRegistration.tsx
  ui/                    Button / Card / Badge primitives
hooks/
  useSpeech.ts           Arabic voice selection + speak-on-demand
  useSentence.ts         Sentence word list state
  useIdleHandReminder.ts No-hand-in-frame reminder timer
lib/
  gestureDictionary.ts   Model label -> Tunisian Arabic word (adapter over @souty/vocabulary)
  handOverlay.ts         Canvas skeleton + progress ring drawing
  recognizer.ts          Shared, pre-warmed MediaPipe recognizer + log filter
  assets.ts              Parallel model/WASM download, persistent cache, progress
  offline.ts             Asks the service worker to cache loaded resources
  utils.ts               Class name helper
public/
  models/                Custom-trained 34-class gesture model (committed)
  wasm/                  Self-hosted MediaPipe runtime
  icons/                 PWA icons (192/512 + maskable)
  sw.js                  Service worker (offline support)
```

Shared code lives outside this folder, in the workspace:

| What | Where |
|---|---|
| The 33 signs (label, word, gloss, category) | [`packages/vocabulary/src/index.ts`](../../packages/vocabulary/src/index.ts) |
| Colors, semantic tokens, Tailwind preset | [`packages/brand/src`](../../packages/brand/src) |
| Font files and their licences | [`packages/brand/fonts`](../../packages/brand/fonts) |
| Shared TypeScript config | [`packages/tsconfig`](../../packages/tsconfig) |

## Training data & credits

The Tunisian Sign Language classes are trained on the
[Tunisian Sign Language Dataset](https://www.kaggle.com/datasets/warcoder/tunisian-sign-language-dataset)
(Chakroun & Jerbi, 2023, Mendeley Data, DOI `10.17632/fbjjgzgv7f.1`),
collected with **ATILS** (Tunisian Association of Sign Language
Interpreters), licensed **CC BY 4.0**. Additional gesture classes come from
[HaGRID](https://github.com/hukenovs/hagrid). The training pipeline is
documented in [`docs/TECHNICAL_DOC.md`](../../docs/TECHNICAL_DOC.md).

## Privacy

What stays on the phone:

- **Camera frames.** They are processed in memory and never transmitted or
  stored.
- **Recognition.** The model and the MediaPipe runtime are self-hosted and
  run in the browser. No frame, landmark, recognized sign or sentence is
  sent anywhere.
- **Speech.** Sentences are spoken with the browser's own `SpeechSynthesis`
  voices; the app sends the text to no server of its own.

There are no accounts and the app sets no cookies.

The one third-party call: the app includes **Vercel Web Analytics**
(`@vercel/analytics`, rendered in `app/layout.tsx`). On the Vercel
deployment it reports cookieless page views to Vercel (per
[Vercel's documentation](https://vercel.com/docs/analytics/privacy-policy):
a timestamp, the page URL, the referrer, the device, OS and browser type,
and a location down to the city, with no cookie and no persistent visitor
identifier). The app sends no custom analytics events, so nothing about
the camera, the signs or the sentences is included. Data is only recorded
when Web Analytics is enabled for the project in the Vercel dashboard, and
the app works the same without it, including offline.
