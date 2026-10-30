"""Evaluation script for trained SignalSafe Campus ML models.

Usage:
    python -m ml.src.evaluate --test-data ml/datasets/sample_urls.csv
"""

import argparse
import os
import sys

import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from ml.src.feature_extraction import URLFeatureExtractor


def evaluate(
    model_path: str = "ml/models/url_phishing_model.joblib",
    pipeline_path: str = "ml/models/feature_pipeline.joblib",
    test_data_path: str = "ml/datasets/sample_urls.csv",
):
    if not os.path.exists(model_path) or not os.path.exists(pipeline_path):
        print("Model or pipeline file not found. Train first with ml.src.train.")
        return

    print(f"[*] Loading model from {model_path}")
    model = joblib.load(model_path)
    pipeline: URLFeatureExtractor = joblib.load(pipeline_path)

    df = pd.read_csv(test_data_path)
    X = pipeline.extract_batch(df["url"].tolist())
    y = df["label"].values

    preds = model.predict(X)

    print("\n--- Model Evaluation Results ---")
    print(classification_report(y, preds, zero_division=0))
    print("\nConfusion Matrix:")
    print(confusion_matrix(y, preds))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--test-data", default="ml/datasets/sample_urls.csv")
    args = parser.parse_args()
    evaluate(test_data_path=args.test_data)

