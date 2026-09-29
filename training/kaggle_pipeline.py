"""Retrains the gesture recognizer using the HaGRID dataset.

Must be run under Python 3.10, not whatever Python a Kaggle/Colab
notebook's own kernel defaults to (currently 3.12). mediapipe-model-maker
pulls in tf-models-official==2.11.6, which pins pyyaml<6.0 - a version with
no prebuilt wheel for 3.12, so pip tries to build it from source and that
build is currently broken (confirmed, unresolved upstream as of early
2026: https://github.com/google-ai-edge/mediapipe-samples/issues/643).
Installing Python 3.10 alongside the default and running under that is the
confirmed community workaround.

kaggle_pipeline.ipynb writes this file to /kaggle/working/_train.py and
runs it with `MPLBACKEND=Agg python3.10 /kaggle/working/_train.py` - see
that notebook for the full setup (installing python3.10, forcing a
GPU-enabled tensorflow[and-cuda] install, attaching the HaGRID dataset,
etc). Not meant to be run directly under a notebook's own kernel cells.

MPLBACKEND=Agg matters if you invoke this manually too: a notebook
kernel's own MPLBACKEND env var (set for inline plotting) leaks into any
subprocess and crashes matplotlib, which mediapipe pulls in transitively
and which isn't actually used for output here.

IMPORTANT: HaGRID has no gesture matching ILoveYou (thumb+index+pinky).
Retraining replaces the whole class set, so ILoveYou will NOT exist in the
resulting model unless you also add ~100 of your own photos of that hand
shape under OUT_DIR / "ILoveYou" below. If you skip that, remove the
ILoveYou entry from lib/gestureDictionary.ts after deploying this model.

HaGRID is CC BY-SA 4.0 (variant) licensed - credit it if you mention your
training data anywhere public (https://github.com/hukenovs/hagrid).
"""

import shutil
from pathlib import Path

from mediapipe_model_maker import gesture_recognizer

# Single attached dataset - it contains both the gesture class folders and
# a "no_gesture" folder. Confirmed base mount path via `find /kaggle/input
# -maxdepth 3`; the exact nesting below that (flat, or one extra folder
# level) varies, so find_class_dir() below searches rather than assumes.
HAGRID_ROOT = Path("/kaggle/input/datasets/innominate817/hagrid-classification-512p-no-gesture")
OUT_DIR = Path("/kaggle/working/dataset")

# Cap per class: HaGRID has 10k+ images per class, which is far more than
# needed and would make training slow on Kaggle's session limits.
MAX_PER_CLASS = 500

# HaGRID source folder name -> our GESTURE_WORD_MAP label (must match
# lib/gestureDictionary.ts exactly).
LABEL_MAP = {
    "palm": "Open_Palm",
    "fist": "Closed_Fist",
    "like": "Thumb_Up",
    "dislike": "Thumb_Down",
    "peace": "Victory",
    "one": "Pointing_Up",
    "ok": "OK_Sign",
    "three": "Three_Fingers",  # verify this is the 3-finger shape you want;
    # HaGRID also has "three2" as an alternate 3-finger pose - peek at a
    # few sample images in the Kaggle file browser before committing.
    "four": "Four_Fingers",
    "call": "Shaka_Sign",
    # No HaGRID equivalent for ILoveYou - see module docstring above.
}


def find_class_dir(root: Path, name: str) -> Path | None:
    """Looks for a folder named `name` directly under root, or one level
    deeper - covers both a flat mount and Kaggle's occasional extra
    duplicate-name nesting, without walking the whole (500k+ file) tree."""
    direct = root / name
    if direct.is_dir():
        return direct
    for sub in root.iterdir():
        if sub.is_dir():
            candidate = sub / name
            if candidate.is_dir():
                return candidate
    return None


def copy_capped(src: Path, dst: Path, cap: int) -> int:
    dst.mkdir(parents=True, exist_ok=True)
    files = sorted(src.glob("*"))[:cap]
    for f in files:
        shutil.copy(f, dst / f.name)
    return len(files)


def build_dataset() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for src_name, label in LABEL_MAP.items():
        src = find_class_dir(HAGRID_ROOT, src_name)
        if src is None:
            print(f"WARNING: no '{src_name}' folder found under {HAGRID_ROOT} - skipping {label}")
            continue
        count = copy_capped(src, OUT_DIR / label, MAX_PER_CLASS)
        print(f"{label}: {count} images (from {src})")

    none_src = find_class_dir(HAGRID_ROOT, "no_gesture")
    if none_src is None:
        raise SystemExit(f"no 'no_gesture' folder found under {HAGRID_ROOT} - cannot train without a none class")
    none_count = copy_capped(none_src, OUT_DIR / "none", MAX_PER_CLASS)
    print(f"none: {none_count} images (from {none_src})")

    # Optional: uncomment if you uploaded your own ILoveYou photos as a
    # separate Kaggle Dataset.
    # copy_capped(Path("/kaggle/input/your-ily-photos"), OUT_DIR / "ILoveYou", MAX_PER_CLASS)


def train_and_export() -> None:
    data = gesture_recognizer.Dataset.from_folder(
        dirname=str(OUT_DIR),
        hparams=gesture_recognizer.HandDataPreprocessingParams(),
    )
    train_data, rest_data = data.split(0.8)
    validation_data, test_data = rest_data.split(0.5)

    hparams = gesture_recognizer.HParams(export_dir="/kaggle/working/exported_model", epochs=20)
    options = gesture_recognizer.GestureRecognizerOptions(hparams=hparams)
    model = gesture_recognizer.GestureRecognizer.create(
        train_data=train_data,
        validation_data=validation_data,
        options=options,
    )

    loss, accuracy = model.evaluate(test_data, batch_size=1)
    print(f"Test loss: {loss:.4f}, test accuracy: {accuracy:.4f}")
    # Check per-class results here too - if two classes (e.g. Shaka_Sign vs
    # ILoveYou, or Four_Fingers vs Open_Palm) are getting confused for each
    # other, that pair is too visually similar - dropping one is more
    # reliable than trying to train through it.

    model.export_model()
    print("Download /kaggle/working/exported_model/gesture_recognizer.task from the Output panel.")


if __name__ == "__main__":
    build_dataset()
    train_and_export()
