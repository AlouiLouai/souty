"""Retrains the gesture recognizer on the labeled photos in dataset/ and
exports a gesture_recognizer.task ready to drop into public/models/.

Usage:
    pip install -r requirements.txt
    python train_gesture_model.py
    # then copy exported_model/gesture_recognizer.task to
    # ../public/models/gesture_recognizer.task

See README.md in this folder for how to populate dataset/ before running
this, and lib/gestureDictionary.ts (one level up) for the label -> Arabic
word mapping these class names must match.
"""

import argparse
from pathlib import Path

from mediapipe_model_maker import gesture_recognizer

DEFAULT_DATASET_DIR = Path(__file__).parent / "dataset"
DEFAULT_EXPORT_DIR = Path(__file__).parent / "exported_model"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dataset-dir",
        type=Path,
        default=DEFAULT_DATASET_DIR,
        help="Folder containing one subfolder of images per label, e.g. dataset/Open_Palm/*.jpg",
    )
    parser.add_argument(
        "--export-dir",
        type=Path,
        default=DEFAULT_EXPORT_DIR,
        help="Where to write the trained gesture_recognizer.task",
    )
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    args = parser.parse_args()

    labels = sorted(p.name for p in args.dataset_dir.iterdir() if p.is_dir())
    if "none" not in labels:
        raise SystemExit(
            f"dataset-dir must contain a 'none' folder of non-gesture hand photos "
            f"(Model Maker requires a negative class). Found labels: {labels}"
        )
    print(f"Training on {len(labels)} classes: {labels}")

    data = gesture_recognizer.Dataset.from_folder(
        dirname=str(args.dataset_dir),
        hparams=gesture_recognizer.HandDataPreprocessingParams(),
    )
    train_data, rest_data = data.split(0.8)
    validation_data, test_data = rest_data.split(0.5)

    hparams = gesture_recognizer.HParams(
        export_dir=str(args.export_dir),
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
    )
    options = gesture_recognizer.GestureRecognizerOptions(hparams=hparams)
    model = gesture_recognizer.GestureRecognizer.create(
        train_data=train_data,
        validation_data=validation_data,
        options=options,
    )

    loss, accuracy = model.evaluate(test_data, batch_size=1)
    print(f"Test loss: {loss:.4f}, test accuracy: {accuracy:.4f}")

    model.export_model()
    print(f"Exported model to {args.export_dir / 'gesture_recognizer.task'}")
    print("Copy that file to ../public/models/gesture_recognizer.task to deploy it.")


if __name__ == "__main__":
    main()
