# Model files

`GestureScanner` loads three files from here. All three come from one run of
[`training/kaggle_pipeline.ipynb`](../../../../training/kaggle_pipeline.ipynb)
(its `export/` folder) and must always be replaced together:

| File | What it is |
|---|---|
| `hand_landmarker.task` | MediaPipe hand landmarks, run with 2 hands. It is the exact file the training landmarks were extracted with. A different landmark model would shift the features the classifier learned. |
| `sign_model.onnx` | The sign classifier: a 32-frame window (about 2 s at 15 fps) of both hands' landmarks → one of the labels. The app does **not** use an ONNX runtime. [`@souty/sign-model`](../../../../packages/sign-model) reads the weights out of this file and runs the network in TypeScript. |
| `sign_model.meta.json` | Labels in output order (`none` first), window and fps, and the live decoding thresholds (`min_confidence`, `consecutive_hits`, `stride_frames`). |

Each label maps to a spoken Tunisian Arabic word through the `@souty/vocabulary`
package ([`packages/vocabulary/src/index.ts`](../../../../packages/vocabulary/src/index.ts)).
**A label without a vocabulary entry is recognised but never spoken.**

## Replacing the model

From the repository root, with the notebook's `export/` folder downloaded:

```bash
cp export/hand_landmarker.task export/sign_model.onnx export/sign_model.meta.json apps/pwa/public/models/
cp export/parity_fixtures.json packages/sign-model/test/
pnpm --filter @souty/sign-model test   # the app must reproduce the notebook's numbers
```

Then:

1. Bump `MODEL_VERSION` in [`lib/assets.ts`](../../lib/assets.ts) and update
   the `bytes` sizes there (they only drive the progress bar). The version
   is part of each URL, so installed apps fetch the new files, and the old
   ones are deleted from their cache.
2. Add a vocabulary entry for every new label you want spoken. Its `label`
   must equal the name in `sign_model.meta.json`.

If the notebook's network architecture changed, the ONNX reader rejects the
file with a clear error. Port the change to
[`packages/sign-model/src/signnet.ts`](../../../../packages/sign-model/src/signnet.ts).

## Notes

- MediaPipe's WASM runtime is self-hosted under `apps/pwa/public/wasm/`
  (copied from `apps/pwa/node_modules/@mediapipe/tasks-vision/wasm/`), not
  fetched from a CDN. Offline support needs that, because a service worker
  can't reliably keep a third-party origin cached, and it also removes a
  supply-chain dependency. If you bump `@mediapipe/tasks-vision`, re-copy
  that folder over `apps/pwa/public/wasm/`.
- The files are served immutable (see [`next.config.mjs`](../../next.config.mjs)).
  The `?v=` query from `MODEL_VERSION` is what makes an update reach users.
