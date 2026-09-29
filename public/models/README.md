# Gesture model asset

`GestureScanner` loads its model from:

```
public/models/gesture_recognizer.task
```

This file is a binary MediaPipe task bundle and is **not** included in the
repo (see `.gitignore`) — download it once per environment.

**Note:** this model classifies a single still frame of hand landmarks —
it recognizes held static hand shapes only, not motion/trajectory.

Download the pretrained bundle and save it at the path above:

```bash
curl -L "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task" \
  -o public/models/gesture_recognizer.task
```

(PowerShell equivalent)

```powershell
Invoke-WebRequest -Uri "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task" -OutFile "public/models/gesture_recognizer.task"
```

This bundle recognizes 7 built-in gestures: `Open_Palm`, `Closed_Fist`,
`Thumb_Up`, `Thumb_Down`, `Victory`, `Pointing_Up`, `ILoveYou`. These are
mapped to Tunisian Arabic words (in Arabic script) in
[`lib/gestureDictionary.ts`](../../lib/gestureDictionary.ts)
(e.g. `Open_Palm` -> "عسلامة"). Edit that file to change the wording or
swap in another language/dialect.

## Expanding the vocabulary

To recognize more than the stock 7 gestures, retrain via the pipeline in
[`training/`](../../training/README.md) — it walks through collecting
photos, training with MediaPipe Model Maker, and exporting a replacement
`gesture_recognizer.task` for this folder. `lib/gestureDictionary.ts`
already has entries staged for the extra classes that pipeline is set up
for (`OK_Sign`, `Three_Fingers`, `Four_Fingers`, `Shaka_Sign`) — they just
need real training data before the model actually recognizes them.

## Notes

- The app also fetches MediaPipe's WASM runtime from a CDN
  (`cdn.jsdelivr.net/npm/@mediapipe/tasks-vision`) at startup. If you need
  a fully offline build, copy that package's `wasm/` folder into
  `public/wasm/` and point `WASM_URL` in
  [`components/GestureScanner.tsx`](../../components/GestureScanner.tsx)
  at `/wasm` instead.
- The model file is served with a permissive `Cross-Origin-Resource-Policy`
  header (configured in `next.config.mjs`) so it loads correctly on mobile
  Safari/Chrome.
