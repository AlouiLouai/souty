# Manual test checklist — gesture recognition

Trained model as of `b0181ea` (10 gestures; `ILoveYou` is not currently
trained — see `training/README.md`). Test on a phone over HTTPS (camera
APIs require a secure origin — see README.md's `localtunnel`/`ngrok` note
if testing a local build).

The app now opens to a splash screen, then a landing page (with an
optional onboarding tour) before reaching the scanner below — see
`SPEC.md`'s User flow section for the full sequence, including the
idle-reminder popup and PWA/offline behavior, before testing those.

## Gesture -> expected word

| # | Hand shape | Expected word |
|---|---|---|
| 1 | Flat open palm facing camera | عسلامة |
| 2 | Closed fist | وقف |
| 3 | Thumbs up | ايه |
| 4 | Thumbs down | لا |
| 5 | Index + middle up (V) | بالسلامة |
| 6 | Only index finger up | استنى |
| 7 | Thumb+index circle, other 3 fingers up (OK sign) | باهي |
| 8 | Index + middle + ring up, thumb & pinky curled | 3 |
| 9 | Four fingers up, thumb tucked | 4 |
| 10 | Thumb + pinky extended, others curled (shaka / "hang loose") | مبروك |

## Suggested order

1. **Sanity check (1–4):** confirm the swapped-in model works at all and
   basic poses lock in cleanly.
2. **5–6:** confirm no regression on the original vocabulary.
3. **7–10, one at a time:** these are the newly trained classes — check
   each locks in within ~700ms and shows a stable confidence ring, not
   flickering between two labels.
4. **#10 specifically:** watch for confusion with a natural open-hand
   pose — it's the least distinct shape of the set (fewest fingers up).

## Other things to check while testing

- **Two hands at once:** hold different gestures on each hand
  simultaneously — both should lock in independently and append to the
  sentence in the order they lock, not overwrite each other.
- **Camera switch:** tap the flip-camera icon (top-right of the video) —
  video should switch between front/back, mirroring should look correct
  on the front camera (selfie-flipped) and normal/unflipped on the back
  camera, and the hand-tracking overlay should stay aligned with the real
  hand in both modes, not offset.
- **Pause/resume:** tap pause — detection should freeze (no new
  words appended even if you keep gesturing); resume should pick back up.
- **Speak sentence:** build a short sentence, tap speak — check an Arabic
  voice is used if your device has one installed (pronunciation quality
  depends entirely on the OS's installed voices, not the app).
- **Clear:** resets the sentence to empty.
- **Camera-denied recovery:** deny camera permission once, then grant it
  from the browser's own site-settings UI — the app should resume without
  needing a manual retry tap (per SPEC.md's resilience requirement).
