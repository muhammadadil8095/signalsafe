"""SignalSafe Campus - URL Phishing Detection Model Training

Usage:
    python -m ml.src.train --dataset ml/datasets/sample_urls.csv --output ml/models/
"""

import argparse
import os
import sys
from typing import Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split

# Add parent directory to path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from ml.src.feature_extraction import URLFeatureExtractor


def load_dataset(dataset_path: str) -> Tuple[pd.DataFrame, pd.Series]:
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")

    df = pd.read_csv(dataset_path)
    if "url" not in df.columns or "label" not in df.columns:
        raise ValueError("Dataset CSV must contain 'url' and 'label' columns.")

    df = df.dropna(subset=["url", "label"])
    return df["url"], df["label"]


def train_models(
    dataset_path: str,
    output_dir: str,
    test_size: float = 0.2,
    random_state: int = 42,
):
    print("=" * 60)
    print(" SignalSafe Campus - ML Model Training Pipeline ")
    print("=" * 60)
    os.makedirs(output_dir, exist_ok=True)
    reports_dir = os.path.join(os.path.dirname(output_dir), "reports")
    os.makedirs(reports_dir, exist_ok=True)

    print(f"[*] Loading dataset from: {dataset_path}")
    urls, labels = load_dataset(dataset_path)
    print(f"[*] Total samples: {len(urls)}")
    print(f"[*] Label distribution:\n{labels.value_counts()}")

    print("[*] Extracting features...")
    extractor = URLFeatureExtractor()
    X = extractor.extract_batch(urls.tolist())
    y = labels.values

    print(f"[*] Extracted {X.shape[1]} features across {X.shape[0]} samples.")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    models = {
        "RandomForest": RandomForestClassifier(
            n_estimators=100, max_depth=15, random_state=random_state
        ),
    }

    # XGBoost if available
    try:
        from xgboost import XGBClassifier
        models["XGBoost"] = XGBClassifier(
            n_estimators=100, max_depth=6, learning_rate=0.1, random_state=random_state
        )
    except ImportError:
        print("[!] XGBoost not installed. Using Random Forest only.")

    results = {}
    best_model_name = None
    best_f1 = -1.0

    for name, model in models.items():
        print(f"\n[*] Training {name}...")
        # Map labels to numeric if needed by XGBoost
        if name == "XGBoost":
            unique_labels = np.unique(y_train)
            label_map = {lbl: i for i, lbl in enumerate(unique_labels)}
            y_train_num = np.array([label_map[l] for l in y_train])
            y_test_num = np.array([label_map[l] for l in y_test])
            model.fit(X_train, y_train_num)
            preds_num = model.predict(X_test)
            inv_map = {i: lbl for lbl, i in label_map.items()}
            preds = np.array([inv_map[i] for i in preds_num])
        else:
            model.fit(X_train, y_train)
            preds = model.predict(X_test)

        acc = accuracy_score(y_test, preds)
        f1 = f1_score(y_test, preds, average="weighted", zero_division=0)
        prec = precision_score(y_test, preds, average="weighted", zero_division=0)
        rec = recall_score(y_test, preds, average="weighted", zero_division=0)

        results[name] = {
            "model": model,
            "accuracy": acc,
            "f1": f1,
            "precision": prec,
            "recall": rec,
            "preds": preds,
        }

        print(f"    - Accuracy:  {acc:.4f}")
        print(f"    - Precision: {prec:.4f}")
        print(f"    - Recall:    {rec:.4f}")
        print(f"    - F1 Score:  {f1:.4f}")

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name

    print(f"\n[+] Best Model: {best_model_name} with F1: {best_f1:.4f}")
    best_model = results[best_model_name]["model"]

    # Save model and pipeline
    model_path = os.path.join(output_dir, "url_phishing_model.joblib")
    pipeline_path = os.path.join(output_dir, "feature_pipeline.joblib")

    joblib.dump(best_model, model_path)
    joblib.dump(extractor, pipeline_path)
    print(f"[+] Saved model to: {model_path}")
    print(f"[+] Saved feature extractor to: {pipeline_path}")

    # Save classification report
    report_text = classification_report(
        y_test, results[best_model_name]["preds"], zero_division=0
    )
    report_file = os.path.join(reports_dir, "classification_report.txt")
    with open(report_file, "w") as f:
        f.write(f"Model: {best_model_name}\n")
        f.write(f"Dataset: {dataset_path}\n\n")
        f.write(report_text)
    print(f"[+] Report saved to: {report_file}")


def main():
    parser = argparse.ArgumentParser(description="Train Phishing URL Detection Model")
    parser.add_argument(
        "--dataset",
        type=str,
        default="ml/datasets/sample_urls.csv",
        help="Path to CSV dataset",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="ml/models/",
        help="Path to output models directory",
    )
    args = parser.parse_args()

    train_models(args.dataset, args.output)


if __name__ == "__main__":
    main()

