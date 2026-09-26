# Gesture model asset

`GestureScanner` loads its model from:

```
public/models/gesture_recognizer.task
```

This file is a binary MediaPipe task bundle and is **not** included in the
repo (see `.gitignore`) — download or train it once per environment.

## Option A — use Google's pretrained model (fastest)

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
mapped to Tunisian Arabizi words in
[`lib/gestureDictionary.ts`](../../lib/gestureDictionary.ts)
(e.g. `Open_Palm` -> "Aslema"). Edit that file to change the wording or
swap in another language/dialect.

## Option B — train a custom sign-language vocabulary

For a real sign-language alphabet or a custom word set, train your own
model with [MediaPipe Model Maker](https://ai.google.dev/edge/mediapipe/solutions/customization/gesture_recognizer)
on your own labeled hand-gesture images, export the resulting `.task` file
to this same path, and update the label -> word entries in
`lib/gestureDictionary.ts` to match your training labels. No other code
changes are needed — `GestureScanner` reads whatever category names the
model produces.

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
