# Souty (صوتي) — Pitch Deck Content
## Social Tech Challenge 2026 — Access to services for people with disabilities

> 12 slides, ~5 minutes + live demo. Each slide: title, on-slide content,
> and speaker notes. Bracketed `[...]` items are placeholders to fill in
> before pitching.

---

## Slide 1 — Title

**Souty (صوتي)**
*Your signs. Your voice. On any phone.*

Live sign-to-speech translation for Tunisian Sign Language — 100% on-device,
100% offline, zero cost per user.

`[Team name]` · `[Members]` · `[Contact]`

**Speaker notes:** "Souty means 'my voice' in Tunisian. That's literally
what the app gives back."

---

## Slide 2 — The problem

**A deaf Tunisian cannot ask for help in their own language.**

- ~5% of the world's population — 430M people — live with disabling hearing
  loss (WHO). In Tunisia: `[figure to confirm, e.g. via ATILS / INS]`.
- Social service staff, clinic receptionists, municipal agents: almost none
  understand Tunisian Sign Language.
- Written Arabic is often a *second* language for deaf signers — filling a
  form or writing a note is not a fallback, it's another barrier.
- Result: missed appointments, misunderstood requests, dependence on a
  relative or interpreter for the simplest interaction.

**Speaker notes:** Anchor with a concrete scene: a deaf mother at a
مستوصف trying to say "my son needs a doctor, Thursday."

---

## Slide 3 — The insight

**Everyone already carries the hardware. What's missing is the software.**

- Smartphone penetration in Tunisia is high, even among low-income groups.
- No solution exists for *Tunisian* sign language — existing tools target
  ASL, need internet, or need expensive hardware.
- A tool that works offline, in Tunisian Derja, on the phones people
  already own, requires no infrastructure rollout at all.

---

## Slide 4 — The solution

**Souty: point the camera, sign, the phone speaks.**

1. Hold a sign to the phone camera.
2. A ring fills around your hand — hold ~1 second to confirm the word.
3. Words build into a sentence on screen (Arabic, right-to-left).
4. One tap → the sentence is spoken aloud in Tunisian Arabic.

- 33 signs today: family, transport, days, destinations, requests — the
  vocabulary of a real service interaction.
- Works offline. Nothing is uploaded. No account. No cost.

---

## Slide 5 — Live demo

**[Live demo — have a fallback screen recording ready]**

Demo script (rehearsed, reliable signs only):
1. Open app (installed PWA, airplane mode ON — proves offline).
2. Sign: أصم (deaf) → بابا (dad) → سبيطار (hospital) → الخميس (Thursday).
3. Tap "انطق الجملة" — the phone speaks the sentence.

**Speaker notes:** Airplane mode is the moment the room understands
"on-device". Prepare the device: brightness up, voice installed, airplane
mode, app pre-installed to home screen.

---

## Slide 6 — Why Souty is different

| | Existing tools | Souty |
|---|---|---|
| Language | ASL / French SL | **Tunisian Sign Language** |
| Output | English text | **Tunisian Derja, spoken aloud** |
| Connectivity | Cloud API | **Fully offline, on-device** |
| Hardware | Special sensors / new devices | **Any smartphone camera** |
| Privacy | Frames sent to servers | **Nothing leaves the phone** |
| Cost | Subscription | **Free, zero marginal cost** |

---

## Slide 7 — How it works (tech, 30 seconds)

```
Camera → MediaPipe hand landmarks (21 points/hand, on-device GPU)
       → Custom gesture classifier (34 classes, trained on real
         Tunisian Sign Language data)
       → Confidence + hold-time filter (rejects misfires)
       → Tunisian Arabic sentence → on-device text-to-speech
```

- Progressive Web App: installs to home screen, works with no network.
- Model trained on the **first-ever Tunisian Sign Language dataset**
  (Chakroun & Jerbi, CC BY 4.0, collected with ATILS) — 4,423 images,
  audited sign-by-sign; only signs the architecture can genuinely learn
  were kept.
- No backend. A static deployment serves unlimited users for ~0 TND/month.

---

## Slide 8 — Traction / proof it's real

- Working product **today**, not a mockup: installable PWA, tested on
  real phones.
- 33-sign vocabulary trained and deployed; recognition pipeline validated
  with per-sign manual testing protocol.
- Rigorous ML process: sign-by-sign data audit (we found and excluded
  signs the architecture can't learn, and fixed a train/test leak in the
  source dataset — near-duplicate video frames inflating accuracy).
- Built with and for the community: vocabulary sourced from real Tunisian
  Sign Language data collected with ATILS interpreters.

---

## Slide 9 — Impact & alignment with the challenge

**Direct alignment: "strengthening access to services for people with
disabilities."**

- Deaf citizens can state requests at social service desks, clinics
  (مستوصف), hospitals (سبيطار), transport — without an interpreter.
- Staff side needs nothing: the phone speaks *to them* in Arabic.
- Privacy by architecture (no data leaves the device) — safe for minors
  and vulnerable users, no personal-data compliance burden.
- Scales instantly: it's a URL. No procurement, no hardware, no training
  for staff.

**Speaker notes:** Also serves CDIS contexts — a child in care can
communicate needs to educators who don't sign.

---

## Slide 10 — Roadmap

**Now (demo):** 33 static signs, sentence building, speech output, offline PWA.

**Next 6 months:**
- Field pilots with ATILS and deaf associations; vocabulary co-designed
  with users (they decide the next 50 signs, not us).
- Per-sign accuracy hardening: more photos per thin class, collected with
  the community.

**12 months:**
- Two-hand and motion-based signs (needs a temporal model — landmark
  sequences + sequence classifier, already scoped technically).
- French + Standard Arabic output; staff-facing mode (speech → text for
  the reply).

---

## Slide 11 — Use of the 15,000 TND prize

| Item | Est. |
|---|---|
| Community data collection (sign recording sessions with ATILS & associations, compensating signers) | `[~8,000]` |
| Field pilots in social service centers / CDIS (devices, logistics, training) | `[~4,000]` |
| Model R&D (two-hand / motion architecture) | `[~2,000]` |
| Hosting, domain, misc. | `[~1,000]` |

**Speaker notes:** Emphasize the prize goes mostly to the *community and
validation*, not to servers — the software already costs nothing to run.

---

## Slide 12 — Closing

**Souty: the first Tunisian Sign Language translator, on the phone
everyone already has.**

- Works today. Works offline. Costs nothing per user.
- Built on real Tunisian Sign Language data, with the community.
- Ready to pilot with the Ministry's service points.

**"Sign language shouldn't be a barrier to a social service. With Souty,
it isn't."**

`[Contact]` · `[Demo URL]` · `[GitHub URL]`

---

## Demo-day checklist (not a slide)

- [ ] Airplane-mode demo rehearsed end-to-end
- [ ] Screen recording fallback (in case of lighting/camera issues)
- [ ] Test every sign you'll demo on the demo device, in the venue's lighting
- [ ] Arabic TTS voice confirmed installed on the demo phone
- [ ] App pre-installed to home screen, cache warmed (open once online first)
- [ ] Backup device with the same setup
