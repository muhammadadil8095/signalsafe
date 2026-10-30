"""CLI prediction tool for URL phishing classification.

Usage:
    python -m ml.src.predict --url "http://suspicious-bank-login.xyz"
"""

import argparse
import os
import sys

import joblib
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from ml.src.feature_extraction import URLFeatureExtractor


def predict(
    url: str,
    model_path: str = "ml/models/url_phishing_model.joblib",
    pipeline_path: str = "ml/models/feature_pipeline.joblib",
):
    if not os.path.exists(model_path) or not os.path.exists(pipeline_path):
        print("[!] No trained ML model found. Train model first.")
        return

    model = joblib.load(model_path)
    pipeline: URLFeatureExtractor = joblib.load(pipeline_path)

    features = pipeline.extract(url)
    names = pipeline.get_feature_names()
    X = np.array([[features[name] for name in names]])

    pred = model.predict(X)[0]
    probs = model.predict_proba(X)[0]
    conf = max(probs)

    print("\n--- URL ML Prediction Result ---")
    print(f"URL:        {url}")
    print(f"Prediction: {pred.upper()}")
    print(f"Confidence: {conf * 100:.2f}%")
    print("\nTop Contributing Features:")
    sorted_features = sorted(features.items(), key=lambda kv: abs(kv[1]), reverse=True)
    for name, val in sorted_features[:8]:
        print(f"  {name:30}: {val}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True, help="URL to classify")
    args = parser.parse_args()
    predict(args.url)

