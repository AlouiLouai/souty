# Souty — Live Sign / Gesture Scanner

A mobile-first Next.js app that scans hand gestures from the phone camera
in real time, entirely on-device, and translates them into a growing
sentence with a "liquid glass" UI.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 3 (custom liquid-glass utility classes + animated mesh background)
- `@mediapipe/tasks-vision` `GestureRecognizer` running client-side (WebGPU/WebGL via GPU delegate, falls back to CPU)
- Browser `SpeechSynthesis` for voice output

## Getting started

```bash
npm install
```

Then download the gesture model (required — see
[`public/models/README.md`](public/models/README.md) for details and for
how to swap in a custom-trained sign-language model):

```bash
curl -L "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task" \
  -o public/models/gesture_recognizer.task
```

Run the dev server and open it on your phone (camera APIs require HTTPS or
`localhost` — see below for testing on a physical device):

```bash
npm run dev
```

## Testing on a phone

Browsers only grant camera access on secure origins (`https://` or
`localhost`). To test on a real phone over your LAN, tunnel dev traffic
over HTTPS, e.g.:

```bash
npx localtunnel --port 3000
```

or use `ngrok http 3000`, then open the printed HTTPS URL on your phone.

## How recognition works

1. `components/GestureScanner.tsx` requests the camera, loads the model
   from `public/models/gesture_recognizer.task`, and runs
   `recognizeForVideo` every animation frame.
2. A gesture must be held steadily above a confidence threshold for
   ~700ms (see `LOCK_HOLD_MS` / `CONFIDENCE_THRESHOLD`) before it "locks
   in" as a translated word — this avoids flickering, single-frame
   misfires.
3. Locked words are mapped through `lib/gestureDictionary.ts`, appended to
   the current in-progress sentence (`app/page.tsx`), and optionally
   spoken aloud via `window.speechSynthesis`.
4. The sentence keeps growing with each new locked gesture, and is
   cleared either automatically after ~3s of no new gesture
   (`SENTENCE_IDLE_MS`) or immediately via the "Clear sentence" button.

## Project structure

```
app/
  layout.tsx        Root layout, fonts, viewport/meta (safe-area, notch)
  page.tsx           Composes background, scanner, translation panel
  globals.css        Tailwind layers + liquid-glass utility classes
components/
  AmbientBackground.tsx  Animated gradient-blob backdrop
  GestureScanner.tsx     Camera + MediaPipe recognition + landmark overlay
  TranslationPanel.tsx   Glass card showing the growing sentence + controls
hooks/
  useSpeech.ts       Wraps window.speechSynthesis
lib/
  gestureDictionary.ts   Gesture label -> word mapping
  handConnections.ts     Hand landmark skeleton graph for drawing
  types.ts               Shared types
public/models/       Where the .task model file goes (gitignored)
```
