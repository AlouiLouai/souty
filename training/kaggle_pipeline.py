"""Retrains the gesture recognizer on the real Tunisian Sign Language
dataset (warcoder/tunisian-sign-language-dataset on Kaggle, sourced from
Chakroun & Jerbi 2023's Mendeley dataset, collected with ATILS - the
Tunisian Association of Sign Language Interpreters), using HaGRID's
no_gesture folder as the required negative ("none") class.

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
GPU-enabled tensorflow[and-cuda] install, attaching both Kaggle datasets,
etc). Not meant to be run directly under a notebook's own kernel cells.

MPLBACKEND=Agg matters if you invoke this manually too: a notebook
kernel's own MPLBACKEND env var (set for inline plotting) leaks into any
subprocess and crashes matplotlib, which mediapipe pulls in transitively
and which isn't actually used for output here.

TWO-PHASE WORKFLOW: the class labels Model Maker trains on are whatever
this dataset's own folder names are ("named in Tunisian dialect" per its
description - exact script/spelling unknown until this actually runs).
lib/gestureDictionary.ts cannot be updated with real Arabic-word mappings
until we see the printed class list from build_dataset() below.

FULL VOCABULARY REPLACEMENT: once this model is deployed, none of the
previous categories (the original stock 7, or the HaGRID-trained
OK_Sign/Three_Fingers/Four_Fingers/Shaka_Sign) will ever be recognized
again. lib/gestureDictionary.ts needs a full rewrite around the new
57-sign class list, not an incremental edit.

NO ACCURACY GUARANTEE: 57 classes with a modest, imbalanced image count
per class (~78 images/class on average, some categories much lower) is a
harder problem than the earlier 10-class HaGRID run. It's also unknown
whether any of these 57 signs are inherently two-handed or motion-based -
this architecture (single-hand, single-frame classifier) fundamentally
cannot represent those well, per SPEC.md's Known Limitation. Test every
one of the 57 signs manually after deploying, not just the aggregate
test accuracy this script prints.
"""

import os
import shutil
from pathlib import Path

from mediapipe_model_maker import gesture_recognizer

# Adjust these against the Input panel's file browser after attaching -
# best guesses based on Kaggle's usual /kaggle/input/datasets/<owner>/<slug>
# mount pattern, same as what we had to confirm for HaGRID last time.
TUNSL_ROOT = Path("/kaggle/input/datasets/warcoder/tunisian-sign-language-dataset")
NONE_SOURCE_ROOT = Path(
    "/kaggle/input/datasets/innominate817/hagrid-classification-512p-no-gesture"
)

OUT_DIR = Path("/kaggle/working/dataset")
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
# Keeps the "none" class roughly in scale with the real sign classes
# (avg ~78 images/class here) rather than letting HaGRID's much larger
# pool dominate training and bias the model toward predicting "none".
NONE_CAP = 150


def find_leaf_class_dirs(root: Path) -> list[Path]:
    """Every directory that directly contains image files AND has no
    subdirectories - each becomes one training class. A directory with
    both images and subfolders is skipped (likely a stray thumbnail
    sitting alongside real category/sign subfolders, not a class itself)."""
    leaves = []
    for dirpath, dirnames, filenames in os.walk(root):
        has_images = any(Path(f).suffix.lower() in IMAGE_EXTS for f in filenames)
        if has_images and not dirnames:
            leaves.append(Path(dirpath))
    return leaves


def copy_images(src: Path, dst: Path, cap: int | None = None) -> int:
    dst.mkdir(parents=True, exist_ok=True)
    files = sorted(f for f in src.iterdir() if f.suffix.lower() in IMAGE_EXTS)
    if cap is not None:
        files = files[:cap]
    for f in files:
        shutil.copy(f, dst / f.name)
    return len(files)


def build_dataset() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    sign_dirs = find_leaf_class_dirs(TUNSL_ROOT)
    print(f"Discovered {len(sign_dirs)} sign classes under {TUNSL_ROOT}:")
    total = 0
    for d in sorted(sign_dirs):
        label = d.name
        count = copy_images(d, OUT_DIR / label)
        total += count
        print(f"  {label}: {count} images")
    print(f"Total sign images copied: {total} across {len(sign_dirs)} classes")
    if len(sign_dirs) != 57:
        print(
            f"WARNING: expected 57 sign classes, found {len(sign_dirs)}. "
            "Check TUNSL_ROOT against the Input panel before trusting this run - "
            "do not proceed to train on a wrong/partial class list."
        )

    none_dirs = find_leaf_class_dirs(NONE_SOURCE_ROOT)
    none_dir = next((d for d in none_dirs if d.name == "no_gesture"), None)
    if none_dir is None:
        raise SystemExit(
            f"no 'no_gesture' folder found under {NONE_SOURCE_ROOT} - "
            "cannot train without a none class. Check NONE_SOURCE_ROOT."
        )
    none_count = copy_images(none_dir, OUT_DIR / "none", cap=NONE_CAP)
    print(f"none: {none_count} images (from {none_dir})")


def train_and_export() -> None:
    data = gesture_recognizer.Dataset.from_folder(
        dirname=str(OUT_DIR),
        hparams=gesture_recognizer.HandDataPreprocessingParams(),
    )
    train_data, rest_data = data.split(0.8)
    validation_data, test_data = rest_data.split(0.5)

    # More epochs than the earlier 10-class run (20 -> 40): 57 classes is
    # a harder problem. Dropout added since the classifier head is tiny
    # (~2K params) and overfitting risk is real with ~78 images/class on
    # average - watch train vs. validation accuracy in the printed log;
    # validation accuracy plateauing or falling while train accuracy
    # keeps climbing means overfitting, and epochs should come down.
    hparams = gesture_recognizer.HParams(
        export_dir="/kaggle/working/exported_model",
        epochs=40,
    )
    model_options = gesture_recognizer.ModelOptions(dropout_rate=0.2)
    options = gesture_recognizer.GestureRecognizerOptions(
        model_options=model_options, hparams=hparams
    )
    model = gesture_recognizer.GestureRecognizer.create(
        train_data=train_data,
        validation_data=validation_data,
        options=options,
    )

    loss, accuracy = model.evaluate(test_data, batch_size=1)
    print(f"Test loss: {loss:.4f}, test accuracy: {accuracy:.4f}")
    print(
        "Aggregate accuracy can hide a badly-confused individual class - "
        "test every one of the 57 signs by hand once deployed (see ../TESTING.md), "
        "not just this one number."
    )

    model.export_model()
    print("Download /kaggle/working/exported_model/gesture_recognizer.task from the Output panel.")


if __name__ == "__main__":
    build_dataset()
    train_and_export()
