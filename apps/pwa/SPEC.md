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
phone reads aloud. Recognition and speech run on the phone, offline, with
no account. The one thing that can leave the phone is an anonymous vote
on whether a sign's word is right (FR-14).
Many Deaf Tunisians do not read or write, so the app shows no text but the
signed words: every instruction is a picture and every control an icon
(NFR-8).

## 2. Scope

**In scope**

- Isolated sign recognition, one sign at a time, made with one or two
  hands, from a fixed vocabulary (section 5).
- Building a sentence word by word; undo the last word; clear.
- Reading the sentence, or one word of it, aloud on demand: a recorded
  Tunisian clip where one exists, else on-device text-to-speech.
- A sign guide: every sign the app can read, with its hand shape and word.
- A scripted proof-of-concept sentence with stand-in words (FR-13), off by
  default.
- Community validation: users vote on whether each sign's word is right,
  and a word enough of them agree on carries a blue mark (FR-14).
- Installable PWA that works offline after the first load.

**Out of scope**

- Continuous signing (sentences without pauses between signs),
  fingerspelling, and facial expressions or other non-manual markers.
- Any user account, any storage of sentences across sessions, and any
  backend other than the vote counter of FR-14.
- A user-selectable interface language: the interface has no text but the
  signed words (NFR-8); its screen-reader labels are Arabic, and the layout
  is right to left.

## 3. User flow

| Step | Component | Behaviour |
|---|---|---|
| Splash | `components/SplashScreen.tsx` | The logo mark (no wordmark) for 1.2 s, then a 300 ms fade, on every load. The model starts loading underneath (`getRecognizer()` in `app/page.tsx`), so the splash adds no waiting. |
| Landing | `components/LandingScreen.tsx` | A picture of what the app does (two hands → words → speaker), privacy and offline icons, and three icon buttons: the large camera button opens the scanner, the question mark opens the tour, the book opens the sign guide. |
| Tour (optional) | `components/OnboardingTour.tsx` | A live scanner with a 4-step spotlight, each step a picture: hands in view (the hands indicator lights up), make a sign (an animated ring: spin, fill, green check), flip the camera, the sentence controls. Each step completes itself when the user does it (a hand appears, a word is added, the camera is switched, a panel button is pressed); the arrow button moves on and the X button skips. |
| Scanner | `components/ScannerWorkspace.tsx`, `components/GestureScanner.tsx` | Camera preview with hand skeletons. While a hand is in view, one ring above the hands is always shown and says what the reader is doing (FR-12); two hands are joined by a moving dashed line. Two hand icons in the camera's top-left corner light up for each side of the screen where a hand is seen. The sentence panel below has pause, speak, undo and clear. The header is icons only: home (keeps the sentence), the logo mark with a running/paused dot, and a book that opens the sign guide. |
| Sign guide | `components/SignGuide.tsx`, `components/SignGlyph.tsx` | Every sign the app can read, in six category tabs, one icon each (requests, family, places, days, transport, universal gestures). Each sign shows its hand shape, or a dashed "no drawing yet" hand when none is known (drawn signs come first), and its word; tapping it says the word. X returns to the landing screen or the scanner, wherever it was opened from; the sentence is kept. |
| Idle reminder | `components/IdleExitPopup.tsx`, `hooks/useIdleHandReminder.ts` | After 5 s with no hand in view, a picture popup (two hands rising into the frame) with a check button. It closes when a hand returns or on tap, and never stops the camera. |

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
| **FR-8** | An emitted sign appends its word to the sentence; undo removes only the last word; clear empties it, in two taps: the first arms the button (the bin grows and pulses, the words about to go are struck through, with a 20 ms vibration), a second tap within 3 s confirms, and it disarms after 3 s or when the sentence changes. The sentence survives going to the landing screen or the sign guide and back. |
| **FR-9** | The speaker button reads the whole sentence once, in sentence order; tapping one word of the sentence says just that word. A word with a recorded Tunisian clip (`lib/voiceClips.ts`) is played from it; each run of words without one is read by one text-to-speech utterance with the first installed `ar-TN` voice, else the first `ar-*` voice, else the language `ar-SA` (a bare `ar` finds no voice on iOS), at rate 0.95. A new request waits 80 ms after cancelling one that is still playing, because iOS and Chrome drop speech started in the same instant as a cancel. If an utterance ends without ever starting, the phone said nothing: the speaker button then shows crossed out until the next words are spoken. A clip that fails to play is read instead. A new request stops the one playing. The speaker button shows moving sound bars while playing. Words are still not spoken automatically. |
| **FR-10** | Pause stops detection (no word can be added) and clears the overlay; the camera view is dimmed under a large play button. Tapping that paused view's button, or the pause button again, resumes from an empty window. Switching camera also empties the window and clears the overlay. |
| **FR-11** | The idle reminder appears after 5 s with no hand while the scanner is running and not paused, and only then. |
| **FR-12** | Feedback (`lib/handOverlay.ts`): whenever a hand is in view and the scanner is not paused, one ring is drawn above both hands. It has three states: **reading**, a white spinning arc with one dot per visible hand, while no sign leads; **candidate**, a cyan arc that fills with the leading sign's progress towards being said (its winning readings in a row), with that sign's word in a pill under the ring; **said**, a full mint ring with a check, held for 800 ms after the reader stops reporting the sign (the sign ended, a reading dipped, or the hands dropped) unless a different sign starts filling. Skeletons and the two-hand link take the ring's colour. When the leading sign drops, its word fades out over 450 ms instead of blinking off. The ring glides after the centre of the hands, sits above them, or below them when they are too near the top (with hysteresis, so it does not flap), stays inside the part of the frame the cropped preview shows, and has a fixed size in CSS pixels on every phone; the canvas is drawn at the screen's device-pixel resolution so the word stays sharp. On the frame a word is said: a 500 ms burst ring (it plays to the end even if the reader moves on), a 60 ms vibration where supported, and the word is appended and highlighted in the sentence. The only text drawn on the camera is the word: no percentage, no label. |
| **FR-13** | Demo script (`lib/demoScript.ts`), off by default. Opening the app with `?demo=jawher` turns it on and remembers it on the device (`localStorage` key `souty.demo`); any other `?demo=` value, for example `?demo=off`, turns it off. While on, the labels in `DEMO_WORDS` show and speak a stand-in word instead of their vocabulary word, in the scanner, the sentence and the sign guide; every other label is unchanged. The script spells one sentence, "مرحباً أنا جوهر حلاق من سيدي بوزيد نحب نحل باتيندة مبادر ذاتي", with one one-handed gesture per word: open palm مرحباً, index up أنا, shaka جوهر, V حلاق, thumb down من سيدي بوزيد, thumb up نحب, three fingers نحل, OK ring باتيندة, fist مبادر ذاتي (`3aslema` and `t7eb` also give مرحباً and نحب). These are stand-ins for a demonstration, not the Tunisian signs for those words. |
| **FR-14** | Community validation (`lib/validation.ts`, `lib/votes.ts`, `app/api/votes/route.ts`). A user can say whether a sign's word is right or wrong with two icon buttons (check, cross): under every sign in the sign guide, and in a pill at the bottom of the camera for 6 s after the scanner says a word (only for a sign this device has not judged yet, never in the tour, never while paused). A device has one vote per sign and can change it. A word is **validated** when it has at least 10 votes and at least 80% of them say it is right; it then shows a blue check mark in the sign guide and in the pill. Votes are saved on the device first and sent when there is a network; the last tallies received are kept, so the marks show offline. A vote is: a random device id, the sign's label, yes or no. Votes are counted per label **and word**, so changing a sign's word starts its count again. The vote buttons and marks are hidden when the server has no vote store (it answers 503) and while the demo script is on. The server refuses unknown signs, malformed ids, and more than 30 posts a minute from one address. |

## 5. Vocabulary

- The model (`public/models/sign_model.meta.json` → `labels`) has 66
  classes: 55 Tunisian Sign Language signs, 10 universal hand gestures
  (from HaGRID), and the negative class `none`.
- **Every class has a word**, listed in `packages/vocabulary/src/index.ts`,
  whose test pins the exact label-to-word contract. A PWA test fails if a
  model class has no word.
- **32 words are drafts** (for example `baladya` بلدية, `wzara` وزارة,
  `demande` مطلب), marked `toConfirm` with what to check. They are spoken,
  but must be confirmed with ATILS before the app is presented as correct
  for them; then their `toConfirm` is removed.

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
| **NFR-1 Privacy** | Camera frames, landmarks and sentences never leave the device. The models and the MediaPipe WASM runtime are served from this origin (`public/models/`, `public/wasm/`), never from a CDN. Two things are sent, both to this origin: Vercel Web Analytics page views, active only when enabled in the Vercel project, and the votes of FR-14 (a random device id, a sign label, yes or no), sent only when the user taps a vote button. The vote route keeps a hash of the sender's address for one minute, to limit ballot stuffing, and nothing else about the sender. |
| **NFR-2 Offline** | After one online load, the app starts and recognises signs with no network. Model, WASM and voice-clip files are kept in the persistent `souty-assets-v1` cache; model URLs carry `?v=MODEL_VERSION` and clip URLs a content hash, so a changed file is downloaded once. Older model files are deleted. |
| **NFR-3 Model integrity** | The model files declared in `lib/assets.ts` are the files shipped, with matching sizes. The classifier's output count must equal the label count in the meta file, or loading fails with a clear error (`lib/recognizer.ts`). |
| **NFR-4 Performance** | One classifier pass stays well under one frame budget (test limit: 50 ms in Node). The UI stays responsive on low-end phones because tracking is capped at 25 per second. |
| **NFR-5 Resilience** | Denied camera permission shows a picture (settings → camera) and a retry button; where the Permissions API exists, granting the camera in browser settings resumes the scanner without a tap. A browser without camera access shows a crossed-out camera and a browser window. A failed model load shows a retry button that loads it again in place; the failure is not cached, so reopening the scanner or reloading also retries. The camera and the model load in parallel and keep separate status, so a model failure stays on screen after the camera starts; while the model loads, a progress bar shows over the camera and a spinner shows next to the hands indicator. Two quick taps on the camera switch never leave a second camera stream running. One failing frame is logged and skipped; the detection loop always continues. `app/error.tsx` and `app/global-error.tsx` catch render errors with an icon-only retry screen, and `app/not-found.tsx` replaces Next's English 404 with a picture and a home button. |
| **NFR-6 Installability** | The web app manifest (`app/manifest.ts`) declares a standalone, portrait, Arabic right-to-left app, with 192 px, 512 px and maskable 512 px icons that exist in `public/icons/`. |
| **NFR-7 Layout and accessibility** | Full-height mobile layout (`100dvh`) with safe-area insets. Every control is an icon button of at least 44 px (the main actions 56 px and more), and every icon button has an Arabic `aria-label` for screen readers; status cards, the header state, the tour steps and each newly added word are announced through `sr-only` live regions. The skeletons, the ring and the word pill have a dark halo or backdrop so they show on any skin tone and background. A paused scanner is marked on the camera view itself (a large play button) and in the header. With the system's reduced-motion setting, CSS animations and transitions run once, near-instantly (`app/globals.css`). Colours and fonts come from `@souty/brand`. |
| **NFR-8 No text but the signs** | The only words on screen are signed words: the sentence, the word under the ring, and the words in the sign guide. Every instruction is a pictogram (`components/Pictograms.tsx`, the ring demo in the tour), every control an icon, every status an icon; Arabic text exists only for screen readers (`aria-label`s and `sr-only` live regions). The page title and the manifest name are the brand only, "Souty". `components/noVisibleText.test.ts` parses every `.tsx` file in `app/` and `components/` and fails on visible text: JSX text (letters, digits or %), string literals anywhere a child expression can render them (`&&`, `?:`, arrays, templates), and any string attribute that is not on its list of invisible ones (so `title`, `alt`, `placeholder` and a custom component's `label` all count); `app/manifest.test.ts` checks the brand-only name. |

## 8. Configuration

| Setting | Where | Value |
|---|---|---|
| Confidence, readings in a row, classifier stride | `public/models/sign_model.meta.json` → `decoding` | 0.6, 3, every 2 samples |
| Window length, sample rate | `public/models/sign_model.meta.json` → `window_frames`, `fps` | 32 frames, 15 fps |
| Hands tracked | `lib/recognizer.ts` → `MAX_HANDS` | 2 |
| Tracking rate cap | `components/GestureScanner.tsx` → `MIN_FRAME_INTERVAL_MS` | 40 ms |
| Model cache version | `lib/assets.ts` → `MODEL_VERSION` | 2 |
| Label → word | `packages/vocabulary/src/index.ts` → `SIGNS` | 65 entries (32 marked `toConfirm`) |
| Validation rule | `lib/validation.ts` → `MIN_VOTES`, `MIN_AGREEMENT` | 10 votes, 80% yes |
| Feedback pill after a word | `components/ScannerWorkspace.tsx` → `FEEDBACK_MS` | 6000 ms |
| Vote store | Vercel environment: `KV_REST_API_URL` + `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (`docs/DEPLOYMENT.md`) | unset: voting hidden |
| Vote rate limit | `app/api/votes/route.ts` → `RATE_LIMIT` | 30 posts per minute per address |
| Demo script | `lib/demoScript.ts` → `DEMO_WORDS`; `?demo=jawher` / `?demo=off` | off; 11 labels, 9 words |
| Recorded voice clips | `public/audio/`, listed in `lib/voiceClips.ts` (`pnpm --filter @souty/pwa voice`); 71 words can be recorded: the vocabulary and the demo sentence's own words (`DEMO_PHRASES`) | none yet |
| Splash | `components/SplashScreen.tsx` → `SPLASH_MS`, `SPLASH_FADE_MS` | 1200 ms, 300 ms |
| Idle reminder delay | `app/page.tsx` → `IDLE_HAND_TIMEOUT_MS` | 5000 ms |
| Burst after a word is said | `components/GestureScanner.tsx` → `LOCK_FLASH_MS` | 500 ms |
| Ring size, word fade | `lib/handOverlay.ts` → `RING_RADIUS_CSS`, `WORD_HOLD_MS` | 30 CSS px, 450 ms |
| Clear confirmation window | `components/TranslationPanel.tsx` → `CLEAR_CONFIRM_MS` | 3000 ms |
| Service-worker shell cache | `public/sw.js` → `SHELL_CACHE` | `souty-v4`; bump when the caching logic changes |

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
| FR-7 | `apps/pwa/lib/gestureDictionary.test.ts`; `packages/vocabulary/src/index.test.ts` | M-02, M-05 |
| FR-8 | | M-06, M-19 |
| FR-9 | `apps/pwa/lib/voice.test.ts` | M-07, M-18 |
| FR-10 | `live.test.ts` ("forgets the last sign on reset") | M-09 |
| FR-11 | | M-10 |
| FR-12 | `apps/pwa/lib/handOverlay.test.ts` ("FR-12 sign feedback ring"; `visibleRect`, `handSides`, `approach`) | M-02, M-03, M-17 |
| FR-13 | `apps/pwa/lib/gestureDictionary.test.ts` ("FR-13 demo script") | M-20 |
| FR-14 | `apps/pwa/lib/validation.test.ts` ("FR-14 community validation") | M-21 |
| NFR-1 | `apps/pwa/lib/assets.test.ts` ("NFR-1 …") | M-12 |
| NFR-2 | `apps/pwa/lib/assets.test.ts` ("NFR-2 …") | M-11 |
| NFR-3 | `apps/pwa/lib/assets.test.ts` ("NFR-3 …"); `parity.test.ts` ("matches the shipped meta file") | |
| NFR-4 | `parity.test.ts` ("runs a window in a few milliseconds") | M-13 |
| NFR-5 | | M-14, M-15 |
| NFR-6 | `apps/pwa/app/manifest.test.ts` | M-11 |
| NFR-7 | | M-08, M-16 |
| NFR-8 | `apps/pwa/components/noVisibleText.test.ts` ("NFR-8 pictures, not text") | M-01, M-18 |

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
   per-class recall. 17 of the 65 signs score below 60%, the worst being
   `ta9ra` 0%, `eben` 6%, `mostawsaf` 13%, `5ou` 17%, `a7ad` 25%, and
   `metro` and `bousta` 33% (`metrics.per_class_recall` in
   `sign_model.meta.json`; each class has only about 10 to 20 test
   images; the full list is in TESTING.md). The test images come
   from the same 7 signers as training, so accuracy on new signers will
   be lower. It has not been measured.
4. **The voice is only Tunisian for recorded words.** No recordings exist
   yet, so today every word uses the device's Arabic text-to-speech, with
   a standard Arabic accent. A phone with no Arabic voice installed, or
   with its silent switch on (iPhone), stays silent; the speaker button
   then shows crossed out. Recording the 62 distinct words fixes this (README, "Voice").
5. **The demo script is not sign language.** Its nine words (FR-13) are
   carried by universal gestures chosen because the model reads them
   reliably. The real signs need recorded clips (`training/README.md`,
   "Recording list").
6. **Anyone can vote.** There are no accounts, so a vote does not prove
   the voter is Deaf or knows Tunisian Sign Language, and one person
   with several devices or browsers has several votes. The blue mark
   means "users agree", not "confirmed by ATILS"; the `toConfirm` drafts
   of section 5 are a separate review. The vote route and its client
   (`lib/votes.ts`) have no automated test beyond the validation rule.
7. **Not every sign has a picture in the guide.** The sign guide draws a
   hand shape only for signs with a known shape (`shapeForSign` in
   `@souty/vocabulary`); the others show a dashed "no drawing yet"
   hand next to the word. A drawing is one still hand, so it shows neither a sign's
   movement, its second hand, nor where on the body it is made.
