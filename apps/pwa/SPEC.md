# Souty PWA: Product and Technical Specification

| | |
|---|---|
| **Component** | `apps/pwa` (`@souty/pwa`), the sign-to-speech web app |
| **Status** | Current for model version 2 (`MODEL_VERSION` in `lib/assets.ts`) |
| **Related** | [`TESTING.md`](TESTING.md) (manual test plan), [`docs/TECHNICAL_DOC.md`](../../docs/TECHNICAL_DOC.md) (architecture), [`training/README.md`](../../training/README.md) (model training), [`public/models/README.md`](public/models/README.md) (replacing the model) |

Paths are relative to `apps/pwa/` unless they start with `packages/`,
`docs/` or `training/` (relative to the repository root). Where this spec
and the code disagree, the code is the truth and this spec has a bug.

## 1. Purpose

Souty lets a deaf or non-speaking person build a spoken sentence with
Tunisian Sign Language. They sign to the phone's camera; each recognised
sign becomes a Tunisian Arabic (Derja) word; the words form a sentence the
phone reads aloud. Everything runs on the phone, offline, with no account.

## 2. Scope

**In scope**

- Isolated sign recognition, one sign at a time, made with one or two
  hands, from a fixed vocabulary (section 5).
- Building a sentence word by word; undo the last word; clear.
- Reading the sentence aloud with on-device text-to-speech, on demand.
- Installable PWA that works offline after the first load.

**Out of scope**

- Continuous signing (sentences without pauses between signs),
  fingerspelling, and facial expressions or other non-manual markers.
- Any backend, user account, or storage of sentences across sessions.
- A user-selectable interface language: the interface is Arabic, right to
  left.

## 3. User flow

| Step | Component | Behaviour |
|---|---|---|
| Splash | `components/SplashScreen.tsx` | Logo for 1.2 s, then a 300 ms fade, on every load. The model starts loading underneath (`getRecognizer()` in `app/page.tsx`), so the splash adds no waiting. |
| Landing | `components/LandingScreen.tsx` | "ابدأ الاستخدام" opens the scanner; "كيفاش نستعملها؟" opens the tour. |
| Tour (optional) | `components/OnboardingTour.tsx` | A live scanner with a 3-step spotlight: make a sign, flip the camera, the sentence controls. Skippable. |
| Scanner | `components/ScannerWorkspace.tsx`, `components/GestureScanner.tsx` | Camera preview with hand skeletons; one progress ring above the hands; the sentence panel below with speak, undo, clear and pause. Home returns to the landing screen and keeps the sentence. |
| Idle reminder | `components/IdleExitPopup.tsx`, `hooks/useIdleHandReminder.ts` | After 5 s with no hand in view, an informational popup. It closes when a hand returns or on tap, and never stops the camera. |

## 4. Functional requirements

Each requirement is verified by the tests listed in section 9.

| ID | Requirement |
|---|---|
| **FR-1** | The app opens on the landing screen after the splash, and the scanner is reachable from it directly or through the tour. |
| **FR-2** | The scanner uses the front camera by default, can switch to the back camera, mirrors only the front preview, and keeps the skeleton overlay aligned with the hands in both. |
| **FR-3** | Up to two hands are tracked in every processed frame with MediaPipe `HandLandmarker` (`VIDEO` mode, GPU with CPU fallback), using the same detection thresholds as the training extraction (0.4 detection, 0.5 presence, 0.5 tracking). |
| **FR-4** | Each frame is converted to model input exactly as in training: two fixed hand slots ("Left" in slot 0, "Right" in slot 1, a clash broken by wrist x), x and z scaled by the frame's aspect ratio, and 132 window features per frame (section 6). |
| **FR-5** | The sign classifier gives the same probabilities as the training notebook's exported model, to within 1e-4. |
| **FR-6** | Live decoding: frames are resampled to 15 fps; the last 32 form the window; the classifier runs every 2 samples while a hand is visible. A sign is emitted after winning 3 readings in a row with confidence of at least 0.6, and is not emitted again until another sign or `none` wins confidently, the hands are gone for about 200 ms, or the window is reset. |
| **FR-7** | Only model classes with an entry in `@souty/vocabulary` are ever emitted; every vocabulary entry names a class the shipped model can output; the negative class `none` never has a word. |
| **FR-8** | An emitted sign appends its word to the sentence; undo removes only the last word; clear empties it; the sentence survives going to the landing screen and back. |
| **FR-9** | "Speak" reads the whole sentence once, with the first installed `ar-TN` voice, else the first `ar-*` voice, else the device default, at rate 0.95. Words are not spoken automatically. |
| **FR-10** | Pause stops detection (no word can be added) and resume starts again from an empty window. Switching camera also empties the window. |
| **FR-11** | The idle reminder appears after 5 s with no hand while the scanner is running and not paused, and only then. |
| **FR-12** | Feedback: the ring shows the leading sign's confidence and progress; an emitted word triggers a 400 ms flash ring and a 50 ms vibration where supported, and is highlighted in the sentence. |

## 5. Vocabulary

- The model (`public/models/sign_model.meta.json` → `labels`) has 66
  classes: 55 Tunisian Sign Language signs, 10 universal hand gestures
  (from HaGRID), and the negative class `none`.
- **33 of them are spoken today**: 23 TunSL signs and the 10 gestures,
  listed in `packages/vocabulary/src/index.ts`. Its test pins the exact
  label-to-word contract.
- The other 32 TunSL classes (for example `baladya`, `wzara`, `demande`,
  `cv`) are recognised but silent until an agreed Tunisian Arabic word is
  added for each. Adding one: `docs/TECHNICAL_DOC.md`, "Changing the model
  or the vocabulary".

## 6. Recognition pipeline

```
camera frame ─► HandLandmarker (2 hands) ─► frameFromHands ─► FrameSampler (15 fps)
            ─► WindowBuffer (32 frames) ─► windowFeatures (32 × 132) ─► SignNet ─► SignDecoder ─► word
```

- **Files.** `public/models/hand_landmarker.task`, `sign_model.onnx` and
  `sign_model.meta.json`, all from one run of
  `training/kaggle_pipeline.ipynb`, always replaced together.
- **Features per hand slot (66).** 63 shape values, (landmark − wrist) /
  palm size, where the palm is the 2D distance from landmark 0 to landmark
  9; 2 position values, (wrist − window anchor) / window scale; 1 presence
  flag. A missing hand is all zeros. All values are clipped to ±10.
- **Classifier.** SignNet, a temporal convolution network of about
  0.19 M parameters. `packages/sign-model` (`@souty/sign-model`) runs it in
  TypeScript, reading the weights straight from `sign_model.onnx`; no ONNX
  runtime is shipped. The reader refuses a graph it does not recognise.
- **Rates.** Hand tracking is capped at 25 per second
  (`MIN_FRAME_INTERVAL_MS` = 40 ms in `components/GestureScanner.tsx`).
  One classifier pass takes about 9 ms on a laptop.

## 7. Non-functional requirements

| ID | Requirement |
|---|---|
| **NFR-1 Privacy** | Camera frames, landmarks and sentences never leave the device. The models and the MediaPipe WASM runtime are served from this origin (`public/models/`, `public/wasm/`), never from a CDN. The only network beacon is Vercel Web Analytics page views, active only when enabled in the Vercel project. |
| **NFR-2 Offline** | After one online load, the app starts and recognises signs with no network. Model and WASM files are kept in the persistent `souty-assets-v1` cache; model URLs carry `?v=MODEL_VERSION`, so a new model is downloaded once and older model files are deleted. |
| **NFR-3 Model integrity** | The model files declared in `lib/assets.ts` are the files shipped, with matching sizes. The classifier's output count must equal the label count in the meta file, or loading fails with a clear error (`lib/recognizer.ts`). |
| **NFR-4 Performance** | One classifier pass stays well under one frame budget (test limit: 50 ms in Node). The UI stays responsive on low-end phones because tracking is capped at 25 per second. |
| **NFR-5 Resilience** | Denied camera permission shows an explanation and a retry button; where the Permissions API exists, granting the camera in browser settings resumes the scanner without a tap. A browser without camera access and a failed model load each show an explanation. A failed model load is not cached, so reopening the scanner or reloading retries it. One failing frame is logged and skipped; the detection loop always continues. `app/error.tsx` catches render errors with a retry screen. |
| **NFR-6 Installability** | The web app manifest (`app/manifest.ts`) declares a standalone, portrait, Arabic right-to-left app, with 192 px, 512 px and maskable 512 px icons that exist in `public/icons/`. |
| **NFR-7 Layout and accessibility** | Full-height mobile layout (`100dvh`) with safe-area insets; large touch targets; every icon button has an Arabic `aria-label`; the skeleton overlay has a dark halo so it shows on any skin tone; a paused scanner is marked on the camera view itself. Colours and fonts come from `@souty/brand`. |

## 8. Configuration

| Setting | Where | Value |
|---|---|---|
| Confidence, readings in a row, classifier stride | `public/models/sign_model.meta.json` → `decoding` | 0.6, 3, every 2 samples |
| Window length, sample rate | `public/models/sign_model.meta.json` → `window_frames`, `fps` | 32 frames, 15 fps |
| Hands tracked | `lib/recognizer.ts` → `MAX_HANDS` | 2 |
| Tracking rate cap | `components/GestureScanner.tsx` → `MIN_FRAME_INTERVAL_MS` | 40 ms |
| Model cache version | `lib/assets.ts` → `MODEL_VERSION` | 2 |
| Label → word | `packages/vocabulary/src/index.ts` → `SIGNS` | 33 entries |
| Splash | `components/SplashScreen.tsx` → `SPLASH_MS`, `SPLASH_FADE_MS` | 1200 ms, 300 ms |
| Idle reminder delay | `app/page.tsx` → `IDLE_HAND_TIMEOUT_MS` | 5000 ms |
| Service-worker shell cache | `public/sw.js` → `SHELL_CACHE` | `souty-v3`; bump when the caching logic changes |

## 9. Verification

Run every automated test from the repository root with `pnpm test`
(`pnpm check` adds lint and typecheck). The manual cases are in
[`TESTING.md`](TESTING.md) and need a real phone over HTTPS.

| Requirement | Automated tests | Manual cases |
|---|---|---|
| FR-1 | | M-01 |
| FR-2 | | M-08 |
| FR-3 | | M-02, M-03 |
| FR-4 | `packages/sign-model/test/features.test.ts` (`windowFeatures`, `frameFromHands`); `parity.test.ts` ("reproduces the features of case …") | |
| FR-5 | `packages/sign-model/test/parity.test.ts` ("matches the shipped meta file", "reproduces the probabilities of case …", "rejects a file that is not a SignNet export") | |
| FR-6 | `packages/sign-model/test/live.test.ts` (`FrameSampler`, `WindowBuffer`, `SignDecoder`); `parity.test.ts` ("says a held sign exactly once…") | M-02, M-03, M-04 |
| FR-7 | `apps/pwa/lib/gestureDictionary.test.ts`; `packages/vocabulary/src/index.test.ts` | M-05 |
| FR-8 | | M-06 |
| FR-9 | | M-07 |
| FR-10 | `live.test.ts` ("forgets the last sign on reset") | M-09 |
| FR-11 | | M-10 |
| FR-12 | | M-02 |
| NFR-1 | `apps/pwa/lib/assets.test.ts` ("NFR-1 …") | M-12 |
| NFR-2 | `apps/pwa/lib/assets.test.ts` ("NFR-2 …") | M-11 |
| NFR-3 | `apps/pwa/lib/assets.test.ts` ("NFR-3 …"); `parity.test.ts` ("matches the shipped meta file") | |
| NFR-4 | `parity.test.ts` ("runs a window in a few milliseconds") | M-13 |
| NFR-5 | | M-14, M-15 |
| NFR-6 | `apps/pwa/app/manifest.test.ts` | M-11 |
| NFR-7 | | M-08, M-16 |

Test names in `apps/pwa` start with the requirement ID they verify.

## 10. Known limitations

1. **Movement is barely learned.** The public TunSL data is still images,
   so most signs are learned as a held shape and position. Signs that
   differ only in movement can be confused. Recorded clips fix this
   without code changes (`training/README.md`).
2. **A hand MediaPipe misses is invisible to the model.** In an
   end-to-end run with a fake camera, `sbitar` (hospital) was read as
   `baladya`: MediaPipe never found its small fist, and its other hand
   matches one hand of `baladya`.
3. **Accuracy is uneven.** On held-out images: 82.9% accuracy, 78.9% mean
   per-class recall. Seven spoken signs score below 60%: `eben` 6%,
   `mostawsaf` 13%, `metro` 33%, `siye7a` 40%, and `assam`, `5adamet` and
   `sebt` 50% (`metrics.per_class_recall` in `sign_model.meta.json`;
   each class has only about 10 to 20 test images). The test images come
   from the same 7 signers as training, so accuracy on new signers will
   be lower. It has not been measured.
4. **Voice quality depends on the device.** Without an installed Arabic
   voice, the browser's default voice reads the Arabic text.
5. **No retry button after a failed model load.** The error message asks
   the user to try again, but the only way is to go home and reopen the
   scanner, or reload.
