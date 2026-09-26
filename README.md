# Souty — Live Sign / Gesture Scanner

A mobile-first Next.js app that scans hand gestures from the phone camera
in real time, entirely on-device, and translates them into a growing
sentence with a clean black/white UI.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 3 + shadcn/ui (Button, Card, Badge) on a black background theme
- `@mediapipe/tasks-vision` `GestureRecognizer` running client-side (WebGPU/WebGL via GPU delegate, falls back to CPU), supports up to 2 hands
- Browser `SpeechSynthesis` (Arabic voice) to read the sentence aloud on demand

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
3. Locked gestures are mapped to Arabic words through
   `lib/gestureDictionary.ts` and appended to the current sentence
   (`app/page.tsx`).
4. The sentence keeps growing with each new locked gesture from either
   hand, until the user taps "Clear sentence". Tapping "Speak sentence"
   reads the whole thing aloud via `window.speechSynthesis`.

**Current limitation:** the model classifies a single still frame of hand
landmarks — it only recognizes *held static hand shapes*, not motion.

## Project structure

```
app/
  layout.tsx        Root layout, fonts (Inter + Noto Sans Arabic), viewport/meta
  page.tsx           Composes scanner + translation panel
  icon.tsx           Generated favicon/app icon
  globals.css        Tailwind layers + shadcn CSS variable theme (black/white)
components/
  GestureScanner.tsx     Camera + MediaPipe recognition + landmark overlay
  TranslationPanel.tsx   Card showing the growing sentence + controls
  ui/                    shadcn/ui primitives (Button, Card, Badge)
hooks/
  useSpeech.ts       Picks an Arabic voice and speaks the sentence on demand
lib/
  gestureDictionary.ts   Gesture label -> word mapping (Tunisian Arabic script)
  handConnections.ts     Hand landmark skeleton graph for drawing
  utils.ts               `cn()` classname helper (shadcn convention)
public/models/       Where the .task model file goes
```
