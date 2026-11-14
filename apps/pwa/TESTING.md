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
| **M-01** | FR-1, NFR-8 | Open the app. Tap the large camera button. Go home (house icon), tap the question-mark button and finish the tour, doing each step's action. | Splash (logo mark only), then landing. Both routes reach a working scanner. Each tour step turns into a green check once its action is done and moves on; the X button skips at any step. No screen shows text: only icons and pictures. |
| **M-02** | FR-3, FR-6, FR-12 | Sign each **one-handed** spoken sign in the table below, once, with a pause between signs. | As soon as the hand is in view, a white spinning ring with one dot sits above it. While the sign is held, the ring turns cyan and fills, with the word under it; within about 1 s it becomes a full green ring with a check and a burst, the phone vibrates, and the word is appended and highlighted. No percentage is shown. |
| **M-03** | FR-3, FR-6, FR-12 | Sign two-handed signs, for example `sbitar` (hospital), `baladya` (municipality), `wzara` (ministry), `demande` (request). | Both hands get a skeleton, and each sign is said once. See the known `sbitar` / `baladya` confusion in SPEC.md section 10. |
| **M-04** | FR-6 | Hold one sign for 5 s. Lower the hands, then make it again. Then make two different signs back to back. | Said once while held; said again after lowering the hands; back-to-back different signs are both said. |
| **M-05** | FR-7 | With hands in view: rest them, scratch your face, wave at someone, pick up a cup, hold the phone with the other hand, for 1 minute. | No word is added. Note any word that appears and what you were doing: the `none` class needs recorded examples of exactly that. |
| **M-06** | FR-8 | Build a sentence of 3 words. Tap undo (backspace icon). Go home and back. Tap clear (bin icon) twice. | Undo removes only the last word; the sentence survives the trip home; clear empties it. |
| **M-07** | FR-9 | Build a sentence mixing words with and without a recorded clip (`voice list` shows which have none); tap the speaker button. Then tap one word of the sentence. Repeat offline, and on a device with no Arabic voice if available. | Words are spoken once, in order: recorded words in the Tunisian recording, the others by an Arabic voice when one is installed; sound bars move on the speaker button while it plays. Tapping one word says only that word. Clips also play offline. On an iPhone (any browser) with the silent switch off and the volume up, the words are spoken; with the switch on, or on a phone with no Arabic voice, the speaker button shows crossed out instead of staying silent without a sign. No word is spoken on its own as it is added. |
| **M-08** | FR-2, NFR-7 | Tap the flip-camera icon, sign with the back camera, flip back. | The front preview is mirrored, the back one is not; skeletons stay on the hands in both. |
| **M-09** | FR-10 | Tap pause and keep signing for 5 s. Tap the large play button on the camera view. Pause again, and resume with the pause/play button in the panel. | Nothing is added while paused: the skeletons, ring and hand icons disappear, the camera view is dimmed under a large play button, and the header dot shows pause. Both ways resume, and signs are recognised again. |
| **M-10** | FR-11 | In the scanner, keep your hands out of view for 6 s. Show a hand. Pause, wait 6 s. | The reminder (two hands rising into a frame, with a check button) appears after about 5 s, the camera keeps running, and it closes when a hand returns. It never appears while paused. |
| **M-11** | NFR-2, NFR-6 | Load the app once online and open the scanner. Install it ("Add to Home screen"). Turn on airplane mode, close the app fully, reopen it from the home screen. | The installed app opens standalone, in portrait, and the scanner recognises signs with no network. |
| **M-12** | NFR-1 | On a desktop browser, open DevTools → Network, use the scanner for 1 minute. | Requests go to this origin only (plus Vercel Analytics page views, if enabled). No request carries images, landmarks or words. |
| **M-13** | NFR-4 | On the slowest phone available, sign for 2 minutes. | The preview stays smooth, the ring appears with the hands and fills within about 1 s of a held sign, and the phone does not overheat or stall. |
| **M-14** | NFR-5 | Deny the camera permission. Then grant it from the browser's site settings, without tapping retry. | A crossed camera, a settings → camera picture and a retry button appear; the scanner resumes by itself once permission is granted (where the browser supports the Permissions API). |
| **M-15** | NFR-5 | Block `/models/` in DevTools (request blocking), open the scanner. Unblock and tap the retry button. Block again, then go home and reopen the scanner after unblocking. | The camera starts, and a crossed-cloud card with a retry button stays over it (the camera starting does not hide it). Retry loads the model in place: the progress bar runs, then signs are recognised. Reopening the scanner also works. |
| **M-16** | NFR-7 | Use the scanner with a light and a dark skin tone, in front of a light and a dark background. Turn on the system's reduce-motion setting and open the landing screen. | The skeletons, the ring and the word under it stay visible in every combination. With reduced motion, the waving hands and the pulse around the start button stay still. |
| **M-17** | FR-12 | Raise one hand, then both, then sign a two-handed sign (for example `baladya`) slowly, moving both hands across the frame. Then raise your hands near the top of the frame. Use the front and the back camera. | The two hand icons in the corner light up for each side with a hand (both for two hands). From the first frame with a hand, a ring is shown: white and spinning with one dot per hand while reading, one ring for both hands (never one per hand), with a moving dashed line between the palms. As the sign leads, the ring fills in cyan with its word under it; it does not blink off between readings, and a word that stops leading fades out. The ring follows the hands smoothly, never covers the fingers (it moves under the hands near the top) and never leaves the visible preview. Finish a moving sign and drop the hands at once: the green ring, check and word stay for about a second. The word is sharp, not blurry. |
| **M-18** | FR-9, NFR-8 | From the landing screen tap the book button; go through every category tab and tap a few signs. Close it. Open it again from the scanner's book button with a sentence built, and close it. | Six icon tabs; each sign shows its hand drawing (or a dashed "no drawing yet" hand, after the drawn ones) and its word, the only text on screen. Tapping a sign says its word, with sound bars on the tile. Closing returns to where it was opened, and the sentence is unchanged. |
| **M-19** | FR-8 | Build a sentence. Tap clear once and wait 4 s. Tap clear once, then add a word by signing. Tap clear twice quickly. | The first tap makes the bin grow and pulse and strikes through the words (short vibration), and removes nothing; it calms down after about 3 s, or when a word is added. Only the second tap within 3 s empties the sentence. |
| **M-20** | FR-13 | Open the app with `?demo=jawher` added to its address. In the scanner make, in order: open palm, index up, shaka, V, thumb down, thumb up, three fingers, OK ring, fist; tap the speaker. Open the sign guide's universal-gestures tab. Close the app fully and reopen it without the parameter. Then open it with `?demo=off`. | The sentence reads مرحباً أنا جوهر حلاق من سيدي بوزيد نحب نحل باتيندة مبادر ذاتي and is spoken in that order. The guide shows the demo words on those gestures. The demo is still on after reopening, and off after `?demo=off`: thumb up says ايه again. |
| **M-21** | FR-14, NFR-1 | On a deployment with the vote store configured, open the sign guide and tap the check under one sign, then the cross under the same sign. In the scanner, make a sign you have not voted on, and tap the check in the pill; make it again. Turn on airplane mode, vote on two more signs in the guide, turn the network back on. With DevTools → Network open, repeat one vote. | The tapped button fills (check mint, cross red) and only one of the two is ever filled. The pill shows the word with a check and a cross for about 6 s, closes on a tap, and does not come back for a sign already judged. Votes made offline stay filled and are sent once the network returns. Each vote is one POST to `/api/votes` on this origin carrying a random id, the label and yes or no, and nothing else. A sign with at least 10 votes, 80% of them yes, shows the blue mark. On a deployment without the vote store, no vote button and no mark is shown. |

## Spoken signs for M-02 and M-03

All 65 signs, with test recall from the training run
(`metrics.per_class_recall` in `public/models/sign_model.meta.json`).
Expect the low-recall ones to fail more often, and note when they do.
Signs marked † have a draft word: also note whether the signer agrees with
the word and its meaning.

| Group | Signs (label → word, test recall) |
|---|---|
| Requests | `oui` ايه 78%, `non` لا 100%, `labes` لاباس 100%, `ta3raf` تعرف 100%, `assam` أصم 50%, `5adamet` خدمات 50%, `siye7a` سياحة 40%, `3aslema`† عسلامة 60%, `demande`† مطلب 100%, `cv`† سي في 100%, `n3awnek`† نعاونك 100%, `nekteblk`† نكتبلك 50%, `t7eb`† تحب 100%, `enti`† إنتي 100%, `barnamjk`† برنامجك 100%, `ta9ra`† تقرا 0%, `ta3lim`† تعليم 50%, `se7a`† صحة 58%, `tha9afa`† ثقافة 100%, `chabeb`† شباب 75%, `radio`† راديو 82%, `telvza`† تلفزة 67% |
| Places | `sbitar` سبيطار 100%, `mostawsaf` مستوصف 13%, `baladya`† بلدية 100%, `wzara`† وزارة 100%, `ma7kma`† محكمة 100%, `banka`† بنكة 86%, `dar`† دار 86%, `bousta`† بوسطة 33% |
| Family | `bou` بابا 100%, `mar2a` مرأة 92%, `jadda` جدة 89%, `jad` جد 86%, `tfol` طفل 86%, `bent` بنت 73%, `eben` ابن 6%, `om`† ماما 100%, `5al-3am`† عمّ 100%, `3ayla`† عايلة 57%, `o5t`† أخت 43%, `5ou`† خو 17% |
| Days | `5mis` الخميس 100%, `thnin` الاثنين 100%, `sebt` السبت 50%, `erb3a`† الإربعاء 100%, `lyoum`† اليوم 80%, `jom3a`† الجمعة 67%, `thleth`† الثلاثاء 57%, `a7ad`† الأحد 25% |
| Transport | `car` سيارة 100%, `louage` لواج 100%, `train` قطار 100%, `metro` مترو 33%, `taxi`† تاكسي 100% |
| Universal gestures | Open palm عسلامة, fist وقف, thumb up ايه, thumb down لا, V بالسلامة, index up استنى, OK باهي, three fingers 3, four fingers 4, shaka مبروك: 96 to 100% each |

## Reporting

For each run, record pass or fail per case. For M-02 and M-03, also
record per sign: how many tries out of 5 were said correctly, and what was
said instead. That list is the input for the next training run (which
signs need recorded clips) and for the vocabulary review with ATILS.
