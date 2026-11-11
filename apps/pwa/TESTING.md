# Souty PWA: Manual Test Plan

Covers what the automated tests cannot: a real camera, real hands, real
speech, and real offline behaviour. Each case verifies requirements in
[`SPEC.md`](SPEC.md) (section 9 maps every requirement to its tests).

## Before you start

- **Automated tests first.** From the repository root, `pnpm check` must
  pass (lint, typecheck, and every unit, contract and model-parity test).
- **Device.** A real phone, over HTTPS (camera APIs need a secure origin).
  For a local build, run `pnpm --filter @souty/pwa build` then
  `pnpm --filter @souty/pwa start`, and open it through a tunnel (see
  [`README.md`](README.md)). A Vercel preview deployment also works.
- **Signer.** Ideally a Deaf Tunisian signer, and at least one person whose
  hands were not in the training data. Sign at a normal pace, upper body
  in view, in ordinary indoor light.
- **Record** the phone model, browser, build (commit), and for every
  failure: the case ID, what was signed, and what was said instead.

## Cases

| ID | Verifies | Steps | Expected |
|---|---|---|---|
| **M-01** | FR-1 | Open the app. Tap "ابدأ الاستخدام". Go home, open "كيفاش نستعملها؟" and finish the tour. | Splash, then landing. Both routes reach a working scanner. The tour can be skipped at any step. |
| **M-02** | FR-3, FR-6, FR-12 | Sign each **one-handed** spoken sign in the table below, once, with a pause between signs. | Each is said within about 1 s of being held. The ring above the hand fills, then flashes; the phone vibrates; the word is appended and highlighted. |
| **M-03** | FR-3, FR-6 | Sign two-handed signs, for example `sbitar` (hospital), and silent two-handed signs such as `baladya`. | Both hands get a skeleton. Spoken ones are said once. See the known `sbitar` / `baladya` confusion in SPEC.md section 10. |
| **M-04** | FR-6 | Hold one sign for 5 s. Lower the hands, then make it again. Then make two different signs back to back. | Said once while held; said again after lowering the hands; back-to-back different signs are both said. |
| **M-05** | FR-7 | With hands in view: rest them, scratch your face, wave at someone, pick up a cup, hold the phone with the other hand, for 1 minute. | No word is added. Note any word that appears and what you were doing: the `none` class needs recorded examples of exactly that. |
| **M-06** | FR-8 | Build a sentence of 3 words. Tap undo. Go home and back. Tap clear. | Undo removes only the last word; the sentence survives the trip home; clear empties it. |
| **M-07** | FR-9 | Build a sentence; tap speak. Repeat on a device with no Arabic voice, if available. | The whole sentence is spoken once, by an Arabic voice when one is installed. No word is spoken on its own as it is added. |
| **M-08** | FR-2, NFR-7 | Tap the flip-camera icon, sign with the back camera, flip back. | The front preview is mirrored, the back one is not; skeletons stay on the hands in both. |
| **M-09** | FR-10 | Tap pause and keep signing for 5 s. Resume. | Nothing is added while paused, and the camera view shows the paused state. After resume, signs are recognised again. |
| **M-10** | FR-11 | In the scanner, keep your hands out of view for 6 s. Show a hand. Pause, wait 6 s. | The reminder appears after about 5 s, the camera keeps running, and it closes when a hand returns. It never appears while paused. |
| **M-11** | NFR-2, NFR-6 | Load the app once online and open the scanner. Install it ("Add to Home screen"). Turn on airplane mode, close the app fully, reopen it from the home screen. | The installed app opens standalone, in portrait, and the scanner recognises signs with no network. |
| **M-12** | NFR-1 | On a desktop browser, open DevTools → Network, use the scanner for 1 minute. | Requests go to this origin only (plus Vercel Analytics page views, if enabled). No request carries images, landmarks or words. |
| **M-13** | NFR-4 | On the slowest phone available, sign for 2 minutes. | The preview stays smooth, the ring responds within about 1 s, and the phone does not overheat or stall. |
| **M-14** | NFR-5 | Deny the camera permission. Then grant it from the browser's site settings, without tapping retry. | An explanation with a retry button appears; the scanner resumes by itself once permission is granted (where the browser supports the Permissions API). |
| **M-15** | NFR-5 | Block `/models/` in DevTools (request blocking), open the scanner. Unblock, go home, reopen the scanner. | An error explains the model could not load; reopening the scanner after unblocking works. |
| **M-16** | NFR-7 | Use the scanner with a light and a dark skin tone, in front of a light and a dark background. | The skeleton overlay stays visible in every combination. |

## Spoken signs for M-02 and M-03

The 33 spoken signs, with test recall from the training run
(`metrics.per_class_recall` in `public/models/sign_model.meta.json`).
Expect the low-recall ones to fail more often, and note when they do.

| Group | Signs (label → word, test recall) |
|---|---|
| Requests | `oui` ايه 78%, `non` لا 100%, `labes` لاباس 100%, `ta3raf` تعرف 100%, `assam` أصم 50%, `5adamet` خدمات 50%, `siye7a` سياحة 40% |
| Places | `sbitar` سبيطار 100%, `mostawsaf` مستوصف 13% |
| Family | `bou` بابا 100%, `mar2a` مرأة 92%, `jadda` جدة 89%, `jad` جد 86%, `tfol` طفل 86%, `bent` بنت 73%, `eben` ابن 6% |
| Days | `5mis` الخميس 100%, `thnin` الاثنين 100%, `sebt` السبت 50% |
| Transport | `car` سيارة 100%, `louage` لواج 100%, `train` قطار 100%, `metro` مترو 33% |
| Universal gestures | Open palm عسلامة, fist وقف, thumb up ايه, thumb down لا, V بالسلامة, index up استنى, OK باهي, three fingers 3, four fingers 4, shaka مبروك: 96 to 100% each |

## Reporting

For each run, record pass or fail per case. For M-02 and M-03, also
record per sign: how many tries out of 5 were said correctly, and what was
said instead. That list is the input for the next training run (which
signs need recorded clips) and for the vocabulary review with ATILS.
