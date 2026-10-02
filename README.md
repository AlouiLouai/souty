# Souty (صوتي) — Live Sign Language Scanner

**Souty** ("my voice" in Tunisian Arabic) is a mobile-first web app that gives
a voice to deaf and hard-of-hearing people: hold a hand sign up to your
phone's camera, and the app recognizes it, builds a sentence word by word,
and reads it aloud in Tunisian Arabic — **entirely on the device**, with no
internet connection, no account, and no data ever leaving the phone.

Built for the **Social Tech Challenge 2026** (Ministry of Social Affairs ×
UNDP × World Bank) — thematic challenge: *strengthening access to services
for people with disabilities*.

## The problem

A deaf person walking into a social services office, a clinic, or a
municipality in Tunisia faces a wall: staff don't understand Tunisian Sign
Language, and written Arabic is often a second language for signers. Simple
requests — "hospital", "my son", "Thursday", "help" — become a frustrating
improvisation.

## The solution

Souty turns any smartphone into a real-time sign-to-speech bridge:

1. Point the camera at a hand sign.
2. A progress ring fills around the hand — hold the sign ~0.7s to lock it in.
3. The recognized word (in Tunisian Derja, Arabic script) is appended to a
   growing sentence.
4. One tap speaks the full sentence aloud for the person across the desk.

**Current vocabulary: 33 recognizable signs** — 23 real Tunisian Sign
Language signs (family, transport, days, destinations, requests) trained on
the first-ever Tunisian Sign Language dataset, plus 10 universal hand
gestures (hello, stop, yes, no, wait, OK, numbers 3–4, congrats…).

## Key features

- **100% on-device AI** — MediaPipe gesture recognition runs locally
  (GPU-accelerated, CPU fallback). Camera frames never leave the phone.
- **Fully offline PWA** — installable to the home screen; the model, the
  WASM runtime, and the app shell are all self-hosted and cached by a
  service worker. Works in areas with no connectivity.
- **Tunisian-first** — real Tunisian Sign Language signs, Tunisian Derja
  output, Arabic RTL interface, Arabic text-to-speech voice selection.
- **Two hands tracked simultaneously**, each recognized independently.
- **Accessible by design** — haptic feedback on word lock-in, high-contrast
  overlay readable on any skin tone or background, large touch targets,
  onboarding tour, idle reminder, error states with retry.
- **Zero backend, zero cost per user** — a static site; deploy once, serve
  unlimited users.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The trained gesture model
(`public/models/gesture_recognizer.task`) and the MediaPipe WASM runtime
(`public/wasm/`) are committed to the repo — no download step needed.

Camera APIs require a secure origin: `localhost` works; a physical phone on
your LAN needs an HTTPS tunnel:

```bash
npx localtunnel --port 3000   # or: ngrok http 3000
```

## Deploy

Any static-capable Next.js host works (Vercel, Netlify, a VPS…):

```bash
npm run build && npm start
```

HTTPS is mandatory in production (camera access + service worker). On
Vercel this is automatic: import the repo, deploy, done.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| On-device ML | `@mediapipe/tasks-vision` `GestureRecognizer` (GPU delegate, CPU fallback), custom 34-class model |
| UI | Tailwind CSS 3 + shadcn/ui, dark high-contrast theme |
| Voice | Browser `SpeechSynthesis` (prefers `ar-TN`, then any `ar-*` voice) |
| Offline | Hand-written service worker (`public/sw.js`), network-first shell / cache-first assets |
| Backend | None — fully client-side |

## How recognition works

1. `components/GestureScanner.tsx` loads the model and runs
   `recognizeForVideo` on every animation frame.
2. A gesture must stay above the confidence threshold (0.65) for 700ms
   before it locks in as a word — single-frame misfires are rejected.
3. Locked gestures map to Tunisian Arabic words via
   `lib/gestureDictionary.ts` and accumulate into a sentence.
4. "Speak sentence" reads it aloud via on-device text-to-speech.

**Known limitation:** the model classifies a single still frame — it
recognizes *held static hand shapes*, not motion-based signs. Genuinely
two-handed signs are also beyond this architecture (both training and
inference see one hand at a time). See
[`docs/TECHNICAL_DOC.md`](docs/TECHNICAL_DOC.md) for details and the
roadmap past this ceiling.

## Documentation

- [`docs/PITCH_DECK.md`](docs/PITCH_DECK.md) — pitch deck content (Social Tech Challenge 2026)
- [`docs/TECHNICAL_DOC.md`](docs/TECHNICAL_DOC.md) — architecture, model training pipeline, deployment, testing
- [`SPEC.md`](SPEC.md) — product & technical spec
- [`TESTING.md`](TESTING.md) — manual test protocol per sign
- [`public/models/README.md`](public/models/README.md) — the model asset

## Project structure

```
app/                     Next.js App Router (layout, page, manifest, error boundary)
components/
  GestureScanner.tsx     Camera + MediaPipe recognition + landmark overlay
  TranslationPanel.tsx   Growing sentence + speak/undo/clear/pause controls
  LandingScreen.tsx      Entry screen
  OnboardingTour.tsx     3-step interactive tutorial on a live scanner
  IdleExitPopup.tsx      "Put your hand back in frame" reminder
  ServiceWorkerRegistration.tsx
  ui/                    shadcn/ui primitives
hooks/useSpeech.ts       Arabic voice selection + speak-on-demand
lib/
  gestureDictionary.ts   Model label -> Tunisian Arabic word (33 signs)
  handConnections.ts     Hand skeleton graph for the overlay
public/
  models/                Custom-trained 34-class gesture model (committed)
  wasm/                  Self-hosted MediaPipe runtime
  icons/                 PWA icons (192/512 + maskable)
  sw.js                  Service worker (offline support)
docs/                    Pitch deck + technical documentation
```

## Training data & credits

The Tunisian Sign Language classes are trained on the
[Tunisian Sign Language Dataset](https://www.kaggle.com/datasets/warcoder/tunisian-sign-language-dataset)
(Chakroun & Jerbi, 2023 — Mendeley Data, DOI `10.17632/fbjjgzgv7f.1`),
collected with **ATILS** (Tunisian Association of Sign Language
Interpreters), licensed **CC BY 4.0**. Additional gesture classes come from
[HaGRID](https://github.com/hukenovs/hagrid). The training pipeline is
documented in [`docs/TECHNICAL_DOC.md`](docs/TECHNICAL_DOC.md).

## License & privacy

Souty collects nothing: no accounts, no analytics, no network calls beyond
serving the app itself. Camera frames are processed in memory on the device
and never transmitted or stored.
