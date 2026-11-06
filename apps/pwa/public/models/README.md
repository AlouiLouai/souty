# Gesture model asset

`GestureScanner` loads its model from (path from the repository root):

```
apps/pwa/public/models/gesture_recognizer.task
```

This is a **custom-trained 34-class model, committed to the repo** — no
download step is needed. It recognizes 33 signs (23 real Tunisian Sign
Language signs + 10 HaGRID-derived universal gestures, plus a `none`
negative class), each mapped to a Tunisian Arabic word in the
`@souty/vocabulary` workspace package
([`packages/vocabulary/src/index.ts`](../../../../packages/vocabulary/src/index.ts)),
which the app reads through
[`lib/gestureDictionary.ts`](../../lib/gestureDictionary.ts).

**Note:** this model classifies a single still frame of hand landmarks —
it recognizes held static hand shapes only, not motion/trajectory, and
sees one hand at a time (no genuinely two-handed signs).

## Replacing the model

Retraining always replaces the whole classifier head, so any vocabulary
change means a full retrain with every class included. The training
pipeline (MediaPipe Model Maker on Kaggle) and the vocabulary audit are
documented in [`docs/TECHNICAL_DOC.md`](../../../../docs/TECHNICAL_DOC.md).
After training, drop the exported bundle in here (from the repository
root):

```bash
cp gesture_recognizer.task apps/pwa/public/models/gesture_recognizer.task
```

The class labels the model outputs must exactly match the `label` of each
entry of `SIGNS` in `packages/vocabulary/src/index.ts` — update both
together, following "Changing the vocabulary" in the technical doc.

## Notes

- MediaPipe's WASM runtime is self-hosted under `apps/pwa/public/wasm/`
  (copied from `apps/pwa/node_modules/@mediapipe/tasks-vision/wasm/`), not
  fetched from a
  CDN — required for the PWA's offline support (a service worker can't
  reliably guarantee a third-party origin stays cached) and removes a
  supply-chain dependency on that CDN. If you bump the
  `@mediapipe/tasks-vision` version, re-copy that folder's contents over
  `apps/pwa/public/wasm/`.
- The model file is served with a permissive `Cross-Origin-Resource-Policy`
  header (configured in [`next.config.mjs`](../../next.config.mjs)) so it loads correctly on mobile
  Safari/Chrome.
