# Souty — Product & Technical Spec

## Purpose

A mobile-first web app that lets a non-speaking user build a spoken
sentence by holding up hand gestures to their phone's camera. Each
recognized gesture becomes an Arabic (Tunisian Derja) word; words
accumulate into a sentence; the sentence can be read aloud on demand.

## Scope

**In scope**
- Real-time detection of a fixed set of static hand gestures, per hand,
  up to 2 hands at once.
- Mapping each gesture to a Tunisian Arabic word (Arabic script).
- Building a sentence by appending words as gestures are held and locked
  in; manual clear.
- Reading the full sentence aloud via on-device text-to-speech.
- Fully client-side: no server, no accounts, no data leaves the device.
- Installable PWA with offline support after first load (app shell,
  model, and WASM runtime are all self-hosted and cached by a service
  worker — see [Offline / PWA](#offline--pwa)).

**Explicitly out of scope**
- Dynamic/motion-based sign recognition (trajectories, two-hand
  coordinated signs, facial non-manual markers). The model in use is a
  single-frame classifier — see [Known limitation](#known-limitation).
- Any backend, persistence across sessions, or analytics.
- Multi-language UI (interface chrome and vocabulary are both Arabic; no
  language switcher).

## User flow

1. **Splash** (`app/page.tsx`): the logo/wordmark shows full-screen for
   ~4s on every app load (fades out over 300ms), while camera/model init
   proceeds underneath — the splash doesn't add to actual load time.
2. **Landing** (`components/LandingScreen.tsx`): a short explainer + two
   entry points — "ابدأ الاستخدام" (go straight to the scanner) or
   "كيفاش نستعملها؟" (onboarding tour).
3. **Onboarding** (`components/OnboardingTour.tsx`), optional: a real,
   working scanner instance with a 3-step spotlight tour (dims everything
   but the highlighted target) covering: making a gesture, the
   flip-camera button, and the sentence/controls panel. Skippable at any
   point; finishing goes to the scanner.
4. **Scanner** (main app): camera permission prompt → live preview fills
   most of the screen → hold a supported hand shape steady for ~700ms →
   a per-hand ring fills over the hand showing recognition confidence and
   progress → on lock-in, the mapped Arabic word is appended to the
   sentence shown at the bottom. Repeat per word/hand to build a
   sentence. Tap **Speak sentence** to hear it read aloud, **Clear** to
   reset, pause/resume to freeze detection, the flip-camera icon to
   switch front/back camera, or the home icon to return to the landing
   screen.
5. **Idle reminder**: if no hand has been visible in frame for 5s, a
   purely informational popup reminds the user to put their hand back in
   frame — it does not close the camera or navigate away on its own; it
   clears the moment a hand reappears, or can be dismissed manually.

## Recognition model

- **Engine:** `@mediapipe/tasks-vision` `GestureRecognizer`, running
  entirely client-side (GPU delegate, falls back to CPU).
- **Vocabulary:** the 7 gestures built into MediaPipe's pretrained model
  (`Open_Palm`, `Closed_Fist`, `Thumb_Up`, `Thumb_Down`, `Victory`,
  `Pointing_Up`, `ILoveYou`), each mapped to one Arabic word in
  `lib/gestureDictionary.ts`. A retraining pipeline in `training/` (see
  `training/README.md`) extends this with further distinguishable static
  gestures (`OK_Sign`, `Three_Fingers`, `Four_Fingers`, `Shaka_Sign`) —
  those need a model retrained on real photos before they're actually
  recognized; the dictionary entries alone are just staged mappings.
- **Hands:** up to 2 tracked independently and simultaneously (keyed by
  MediaPipe's left/right handedness classification).
- **Lock-in logic:** a gesture must stay above a confidence threshold
  (0.65) continuously for 700ms before it's counted as a word, to reject
  single-frame misfires. Confidence and hold-progress are drawn live as
  an overlay anchored to the hand's own position in frame.

### Known limitation

`GestureRecognizer` classifies **one still frame** of hand landmarks —
it has no concept of motion. It recognizes held static hand shapes only,
not real sign-language movement. Expanding the vocabulary (more static
shapes) is possible via MediaPipe Model Maker; true movement-based
recognition would require a different model architecture entirely
(landmark-sequence + temporal classifier) and is not built here.

## Voice output

- Browser `SpeechSynthesis` API, on demand only (no auto-speak per word).
- Utterance language is set to `ar`; the app searches installed voices
  for one starting with `ar-tn`, then any `ar-*`, and uses it if found.
  Falls back to the browser/OS default voice otherwise — pronunciation
  quality depends entirely on what Arabic voices the device has
  installed.

## Non-functional requirements

- **Privacy:** camera frames and audio never leave the device; no
  third-party network calls at all — the model and the MediaPipe WASM
  runtime are both self-hosted (`public/models/`, `public/wasm/`), not
  fetched from a CDN.
- **Resilience:** camera-permission-denied and model-load-failure states
  are handled with visible retry UI; if the browser's Permissions API is
  available, the app auto-resumes the moment the user grants camera
  access from browser settings, without requiring a manual retry. A
  single bad detection frame is caught and logged rather than silently
  killing the detection loop (`components/GestureScanner.tsx`'s
  `detectLoop`), and an App Router error boundary (`app/error.tsx`)
  catches unexpected render errors with a retry UI instead of a blank
  crashed page.
- **Layout:** fixed-height mobile viewport (`100dvh`), safe-area insets
  for notches, camera view takes remaining space after a minimal header
  and the sentence panel.
- **Theme:** black background, white text/UI, shadcn/ui components.

## Offline / PWA

- `app/manifest.ts` (Next.js metadata route) generates the web app
  manifest — installable, standalone display, black theme, icons at
  192/512px plus a maskable variant.
- `public/sw.js`: a hand-written service worker (no build-time precache
  tooling). Registered by `components/ServiceWorkerRegistration.tsx`,
  production builds only (a service worker caching dev-mode assets would
  fight the dev server). Strategy: network-first for the navigation/app
  shell (fresh content when online, cached shell when offline),
  cache-first for `_next/static/`, the model, the WASM runtime, and
  icons (all effectively immutable per build).
- Bump `CACHE_VERSION` in `public/sw.js` when the *caching logic itself*
  changes — routine content updates are handled by the network-first
  navigation strategy already.

## Tech stack

Next.js 15 (App Router) + TypeScript, Tailwind CSS 3 + shadcn/ui,
`@mediapipe/tasks-vision`, browser `SpeechSynthesis`, hand-written service
worker (PWA, offline-capable). No backend.

## Configuration knobs

| What | Where | Value |
|---|---|---|
| Confidence threshold | `components/GestureScanner.tsx` → `CONFIDENCE_THRESHOLD` | 0.65 |
| Hold-to-lock duration | `components/GestureScanner.tsx` → `LOCK_HOLD_MS` | 700ms |
| Max tracked hands | `components/GestureScanner.tsx` → `MAX_HANDS` | 2 |
| Gesture → word mapping | `lib/gestureDictionary.ts` → `GESTURE_WORD_MAP` | — |
| Model file | `public/models/gesture_recognizer.task` | pretrained (see its README) |
| Splash duration | `app/page.tsx` → `SPLASH_MS` | 4000ms |
| No-hand idle reminder delay | `app/page.tsx` → `IDLE_HAND_TIMEOUT_MS` | 5000ms |
