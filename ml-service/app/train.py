"""CLI for training land-acquisition delay prediction models."""

import argparse

from .dataset import load_csv_dataset
from .model_service import train_models


def main():
    parser = argparse.ArgumentParser(
        description="Train land acquisition models using a CSV dataset."
    )

    parser.add_argument(
        "--data",
        default="land_acquisition_dataset.csv",
        help="Path to the training CSV file.",
    )

    parser.add_argument(
        "--output-dir",
        default="artifacts",
        help="Directory where trained models will be saved.",
    )

    parser.add_argument(
        "--random-state",
        type=int,
        default=42,
        help="Random seed for reproducible training.",
    )

    args = parser.parse_args()

    # Load and validate the CSV dataset.
    data = load_csv_dataset(args.data)

    # Train both classification and regression models.
    metadata = train_models(
        data,
        args.output_dir,
        args.random_state,
    )

    print()
    print("========================================")
    print("   LAND ACQUISITION MODEL TRAINING")
    print("========================================")
    print()
    print(f"Dataset: {args.data}")
    print(f"Rows: {metadata['dataset']['rows']}")
    print(f"Model version: {metadata['model_version']}")
    print()
    print("Classification model:")
    print(f"  Accuracy : {metadata['metrics']['classification']['accuracy']}")
    print(f"  Precision: {metadata['metrics']['classification']['precision']}")
    print(f"  Recall   : {metadata['metrics']['classification']['recall']}")
    print(f"  F1 Score : {metadata['metrics']['classification']['f1']}")
    print(f"  ROC-AUC  : {metadata['metrics']['classification']['roc_auc']}")
    print()
    print("Regression model:")
    print(f"  MAE : {metadata['metrics']['regression']['mae']} months")
    print(f"  RMSE: {metadata['metrics']['regression']['rmse']} months")
    print(f"  R²  : {metadata['metrics']['regression']['r2']}")
    print()
    print("Training completed successfully.")
    print(f"Models saved to: {args.output_dir}")
    print()


if __name__ == "__main__":
    main()
