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

1. Sign to the camera, with one hand or two.
2. A ring above the hands shows what the app is doing: it spins while it
   reads, fills as one sign keeps winning (with that sign's word under
   it), and turns green with a check when the word is said.
3. The recognized word (in Tunisian Derja, Arabic script) is appended to a
   growing sentence.
4. One tap speaks the full sentence aloud for the person across the desk;
   tapping one word says just that word.

Many Deaf Tunisians do not read or write, so apart from the signed words
the app shows **no text**: every instruction is a picture and every
control an icon (each with an Arabic label for screen readers). A test,
`components/noVisibleText.test.ts`, keeps it that way.

**Current vocabulary: 65 signs**, one- and two-handed. 55 real Tunisian
Sign Language signs (requests, public places such as the municipality,
ministry, court, post office and bank, family, days, transport), trained on
the Tunisian Sign Language Dataset, plus 10 universal hand gestures (hello,
stop, yes, no, wait, OK, the numbers 3 and 4, congratulations...). The words
for 32 of the Tunisian signs are drafts marked `toConfirm`, to be confirmed
with ATILS. The full list lives in
[`packages/vocabulary`](../../packages/vocabulary/src/index.ts).

## Key features

- **On-device AI.** MediaPipe hand tracking and the sign model run locally
  (GPU delegate, CPU fallback). Camera frames never leave the phone.
- **Offline PWA.** Installable to the home screen. The model, the WASM
  runtime, the fonts and the app shell are all self-hosted and cached by a
  service worker, so it keeps working with no connectivity.
- **Tunisian first.** Real Tunisian Sign Language signs, Tunisian Derja
  output, a right-to-left interface with no text but the signed words.
  Words with a recorded Tunisian
  voice clip are played from it; the others use the device's Arabic
  text-to-speech voice (see [Voice](#voice)).
- **Two-handed signs and movement.** Both hands are read together over the
  last two seconds. One ring sits above both hands, joined by a moving
  dashed line, and two hand icons in the camera's corner light up for each
  hand the camera sees.
- **Sign guide.** Every sign the app knows, by category icon, with its
  hand shape and word; tap one to hear it.
- **Accessible by design.** Icon-only controls with large touch targets
  and Arabic screen-reader labels, haptic feedback when a word is said, a
  hand overlay with a dark halo so it stays visible on light and dark
  backgrounds, a picture-only onboarding tour, an idle reminder, error
  states with a retry button, and reduced motion when the system asks for
  it.
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

Open `http://localhost:3000`. The trained model files (`public/models/`)
and the MediaPipe WASM runtime
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
| `pnpm --filter @souty/pwa test` | The app's own tests: vocabulary versus the shipped model, model file sizes and cache wiring, manifest, voice clips, the feedback ring (`lib/handOverlay.test.ts`), and no visible text in any component (`components/noVisibleText.test.ts`) |
| `pnpm --filter @souty/vocabulary test` | The vocabulary contract test |
| `pnpm --filter @souty/sign-model test` | The browser port of the sign model must reproduce the training notebook's features and probabilities |
| `pnpm check` | Lint, typecheck and tests for the whole workspace |

Live recognition is tested by hand on a real phone: see
[`TESTING.md`](TESTING.md). [`SPEC.md`](SPEC.md) section 9 maps every
requirement to its automated and manual tests.

## Voice

Browsers have no Tunisian voice: an Arabic text-to-speech voice reads Derja
with a standard Arabic accent. So the app plays a short recording of each
word when one exists, and uses text-to-speech only for the others. A clip
is a few kilobytes and works offline.

To add or replace recordings (needs `ffmpeg` on the PATH):

1. `pnpm --filter @souty/pwa voice list` prints the words still to record,
   with the file name to use for each.
2. Record each word once, in a quiet room, close to the phone: one file per
   word, named after its label (`baladya.m4a`, `oui.wav`, ...). Any format
   ffmpeg reads works, including phone voice-recorder files.
3. `pnpm --filter @souty/pwa voice import <folder>` trims the silence,
   evens out the loudness, writes `public/audio/<label>.mp3`, and
   regenerates `lib/voiceClips.ts`. Commit both.

If you delete a clip, run `pnpm --filter @souty/pwa voice sync`. The test
`lib/voice.test.ts` fails when a clip changed without a sync.

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
| On-device ML | `@mediapipe/tasks-vision` `HandLandmarker` (2 hands, GPU delegate, CPU fallback), 7.8 MB, plus a custom temporal sign model over 2 s of both hands (66 classes, 0.8 MB) run in plain TypeScript by `@souty/sign-model` |
| Vocabulary | `@souty/vocabulary` (workspace package), shared with the marketing site |
| UI | Tailwind CSS 3, shadcn/ui-style primitives in `components/ui`, light "picture-book" theme from `@souty/brand` (design tokens + Tailwind preset) |
| Fonts | Readex Pro and Baloo Bhaijaan 2, self-hosted through `@souty/brand/fonts` (`next/font/local`) |
| Voice | Recorded Tunisian word clips (`public/audio/`), else browser `SpeechSynthesis` (prefers `ar-TN`, then any `ar-*` voice) |
| Offline | Hand-written service worker (`public/sw.js`): network-first app shell, cache-first static files, a separate persistent cache for the model and WASM runtime |
| Analytics | Vercel Web Analytics (`@vercel/analytics`), cookieless page views only, see [Privacy](#privacy) |
| Backend | None. Fully client-side |

## How recognition works

1. `lib/recognizer.ts` loads the model files and the WASM runtime (warmed
   up while the landing screen is still showing).
   `components/GestureScanner.tsx` then runs `HandLandmarker.detectForVideo`
   on camera frames, capped at about 25 frames per second.
2. MediaPipe finds 21 landmarks per hand, for up to 2 hands. They are put
   in two fixed slots (left hand, right hand) and resampled to 15 fps.
3. Every 2 sampled frames, while a hand is visible, `@souty/sign-model`
   reads the last 32 frames (about 2 s): each hand's shape and where both
   hands are and how they move. So **signs can move and can use two
   hands**.
4. A sign is said once it wins 3 readings in a row with at least 60%
   confidence (thresholds come from `sign_model.meta.json`). It isn't
   repeated while held: another sign, no sign, or the hands leaving the
   frame re-arms it.
5. Signs map to Tunisian Arabic words through `lib/gestureDictionary.ts`, a
   thin adapter over `@souty/vocabulary`, and accumulate into a sentence.
   A sign the model knows but the vocabulary has no word for yet is never
   spoken.
6. While this runs, `lib/handOverlay.ts` draws the skeletons and the ring
   above the hands: spinning while reading, filling for the leading sign
   with its word under it, green with a check and a burst (and a short
   vibration) when the word is said.
7. The speaker button reads the sentence aloud, and tapping a word says
   just that word: recorded clips where they exist, else the browser's
   text-to-speech (`SpeechSynthesis`).

**Known limitation:** the Tunisian training data is still images, so today
the model knows most signs as *held* shapes and hand positions. It can
learn real movement as soon as clips are recorded: see
[`training/README.md`](../../training/README.md).

## Documentation

- [`SPEC.md`](SPEC.md): product and technical spec
- [`TESTING.md`](TESTING.md): manual test plan
- [`public/models/README.md`](public/models/README.md): the model files and how to replace them
- [`docs/TECHNICAL_DOC.md`](../../docs/TECHNICAL_DOC.md): architecture, model training pipeline, configuration
- [`docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md): Vercel runbook
- [`docs/PITCH_DECK.md`](../../docs/PITCH_DECK.md): pitch deck content

## Project structure

Paths are relative to `apps/pwa/`.

```
app/                     Next.js App Router (layout, page, manifest, error boundary, globals.css)
components/
  GestureScanner.tsx     Camera + MediaPipe recognition + two-hand sign reader + hands indicator
  ScannerWorkspace.tsx   Scanner + sentence panel, shared by app and tour
  TranslationPanel.tsx   Sentence as tap-to-hear word chips + pause/speak/undo/clear icons
  LandingScreen.tsx      Entry screen (pictogram + start, tour and sign-guide icons)
  OnboardingTour.tsx     4-step picture-only tutorial on a live scanner
  SignGuide.tsx          Every sign by category icon; tap to hear its word
  SignGlyph.tsx          Still drawing of one sign's hand shape
  Pictograms.tsx         Shared pictures (two hands, icon tiles, flows, sound bars)
  SplashScreen.tsx       Launch splash
  IdleExitPopup.tsx      "Put your hands back in frame" picture reminder
  StatusDialog.tsx       Shared loading/error/reminder card (icons only)
  Logo.tsx               Logo mark (no wordmark)
  noVisibleText.test.ts  NFR-8: fails on any visible text in a component
  ServiceWorkerRegistration.tsx
  ui/                    Button / Card / Badge primitives
hooks/
  useSpeech.ts           Speaks the sentence: recorded clips, then Arabic TTS
  useSentence.ts         Sentence word list state
  useIdleHandReminder.ts No-hand-in-frame reminder timer
lib/
  gestureDictionary.ts   Model label -> Tunisian Arabic word (adapter over @souty/vocabulary)
  handOverlay.ts         Canvas skeletons + the reading/candidate/said ring above both hands
  recognizer.ts          Shared, pre-warmed hand tracker + sign model + log filter
  assets.ts              Parallel model/WASM download, persistent cache, progress
  offline.ts             Asks the service worker to cache loaded resources
  voice.ts               Which words have a clip; splits a sentence into clips and TTS
  voiceClips.ts          Generated list of recorded clips (scripts/voice.ts)
  utils.ts               Class name helper
public/
  models/                Hand tracker + sign model + its meta file (committed)
  wasm/                  Self-hosted MediaPipe runtime
  icons/                 PWA icons (192/512 + maskable)
  sw.js                  Service worker (offline support)
```

Shared code lives outside this folder, in the workspace:

| What | Where |
|---|---|
| The 65 signs (label, word, gloss, category) | [`packages/vocabulary/src/index.ts`](../../packages/vocabulary/src/index.ts) |
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
- **Speech.** Sentences are played from recorded clips shipped with the
  app, or spoken with the browser's own `SpeechSynthesis` voices; the app
  sends the text to no server of its own.

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
