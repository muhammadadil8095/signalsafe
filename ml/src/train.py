"""SignalSafe Campus - URL Phishing Detection Model Training

Usage:
    python -m ml.src.train --dataset ml/datasets/sample_urls.csv --output ml/models/
"""

import argparse
import glob
import os
import sys
from typing import List, Optional, Tuple

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

# Add root workspace and ml/src to path to allow imports from any working directory
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
ML_SRC_DIR = os.path.abspath(os.path.dirname(__file__))
if ML_SRC_DIR not in sys.path:
    sys.path.insert(0, ML_SRC_DIR)

try:
    from ml.src.feature_extraction import URLFeatureExtractor
except ImportError:
    from feature_extraction import URLFeatureExtractor  # type: ignore


def _normalize_label(val) -> Optional[str]:
    """Normalize various label encodings into 'phishing' or 'legitimate'."""
    if pd.isna(val):
        return None
    s = str(val).strip().lower()
    if s in ("1", "1.0", "legitimate", "benign", "safe", "good", "ham"):
        return "legitimate"
    elif s in ("0", "0.0", "-1", "-1.0", "phishing", "malicious", "bad", "spam"):
        return "phishing"
    elif "phish" in s or "malic" in s:
        return "phishing"
    elif "legit" in s or "benign" in s or "safe" in s:
        return "legitimate"
    return None


def _resolve_dataset_entry(path_str: str) -> List[str]:
    """Resolve a path or pattern against current working directory and project root."""
    candidates = [
        path_str,
        os.path.join(BASE_DIR, path_str),
        os.path.join(BASE_DIR, "ml", "datasets", os.path.basename(path_str)),
        os.path.join(os.path.dirname(__file__), "..", "datasets", os.path.basename(path_str)),
    ]
    for c in candidates:
        if "*" in c:
            matched = glob.glob(c)
            if matched:
                return [os.path.abspath(m) for m in matched]
        elif os.path.isdir(c):
            matched = glob.glob(os.path.join(c, "*.csv"))
            if matched:
                return [os.path.abspath(m) for m in matched]
        elif os.path.isfile(c):
            return [os.path.abspath(c)]
    return []


def load_dataset(dataset_paths: str, sample_size: Optional[int] = None) -> Tuple[pd.Series, pd.Series]:
    """Load one or multiple dataset CSV files with smart column and label normalization."""
    raw_paths = [p.strip() for p in dataset_paths.split(",") if p.strip()]
    resolved_files: List[str] = []

    for path_entry in raw_paths:
        found = _resolve_dataset_entry(path_entry)
        if found:
            resolved_files.extend(found)
        else:
            print(f"[!] Warning: Path not found: {path_entry}")

    if not resolved_files:
        raise FileNotFoundError(f"No valid dataset CSV files found matching: {dataset_paths}")

    dfs = []
    url_cols = ["url", "urls", "link", "domain", "web_url", "URL", "Link"]
    label_cols = ["label", "class", "status", "result", "type", "target", "classlabel", "ClassLabel", "Label", "Class", "Status"]

    for file_path in resolved_files:
        print(f"[*] Reading: {file_path}")
        try:
            df = pd.read_csv(file_path, low_memory=False)
        except Exception as e:
            print(f"[!] Failed to parse {file_path}: {e}")
            continue

        # Find URL column (case-insensitive fallback)
        found_url_col = None
        for col in df.columns:
            if col in url_cols or col.lower() in [c.lower() for c in url_cols]:
                found_url_col = col
                break

        # Find Label column (case-insensitive fallback)
        found_label_col = None
        for col in df.columns:
            if col in label_cols or col.lower() in [c.lower() for c in label_cols]:
                found_label_col = col
                break

        if not found_url_col or not found_label_col:
            print(f"[!] Skipping {file_path}: Missing URL or Label column. Columns found: {list(df.columns)}")
            continue

        subset = df[[found_url_col, found_label_col]].copy()
        subset.columns = ["url", "raw_label"]
        dfs.append(subset)

    if not dfs:
        raise ValueError("No valid URL data could be loaded from the specified paths.")

    full_df = pd.concat(dfs, ignore_index=True)
    full_df = full_df.dropna(subset=["url", "raw_label"])
    full_df["url"] = full_df["url"].astype(str).str.strip()
    full_df = full_df[full_df["url"] != ""]

    # Map labels to 'phishing' or 'legitimate'
    full_df["label"] = full_df["raw_label"].apply(_normalize_label)
    full_df = full_df.dropna(subset=["label"])
    full_df = full_df.drop_duplicates(subset=["url"])

    print(f"[*] Total unique valid URLs parsed: {len(full_df)}")
    print(f"[*] Raw class breakdown:\n{full_df['label'].value_counts()}")

    # Stratified downsampling if requested for fast training
    if sample_size and sample_size < len(full_df):
        print(f"[*] Stratified sampling down to {sample_size} records for rapid high-performance training...")
        phish = full_df[full_df["label"] == "phishing"]
        legit = full_df[full_df["label"] == "legitimate"]
        half_sample = sample_size // 2

        n_phish = min(len(phish), half_sample)
        n_legit = min(len(legit), sample_size - n_phish)

        phish_sample = phish.sample(n=n_phish, random_state=42)
        legit_sample = legit.sample(n=n_legit, random_state=42)
        full_df = pd.concat([phish_sample, legit_sample]).sample(frac=1.0, random_state=42).reset_index(drop=True)
        print(f"[*] Sampled distribution:\n{full_df['label'].value_counts()}")

    return full_df["url"], full_df["label"]


def train_models(
    dataset_path: str,
    output_dir: str,
    test_size: float = 0.2,
    sample_size: Optional[int] = None,
    n_jobs: int = -1,
    random_state: int = 42,
):
    print("=" * 60)
    print(" SignalSafe Campus - ML Model Training Pipeline ")
    print("=" * 60)

    # Normalize output directory path
    if not os.path.isabs(output_dir):
        output_dir = os.path.abspath(os.path.join(BASE_DIR, output_dir))

    os.makedirs(output_dir, exist_ok=True)
    reports_dir = os.path.join(output_dir, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    print(f"[*] Ingesting datasets from: {dataset_path}")
    urls, labels = load_dataset(dataset_path, sample_size=sample_size)
    print(f"[*] Final dataset count: {len(urls)} samples")

    print(f"[*] Extracting 27 lexical and structural features in parallel (n_jobs={n_jobs})...")
    extractor = URLFeatureExtractor()
    X = extractor.extract_batch(urls.tolist(), n_jobs=n_jobs)
    y = labels.values

    print(f"[+] Feature matrix shape: {X.shape[0]} rows x {X.shape[1]} features")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    models = {
        "RandomForest": RandomForestClassifier(
            n_estimators=100, max_depth=15, n_jobs=n_jobs, random_state=random_state
        ),
    }

    # XGBoost if available (dynamically loaded to avoid static import diagnostics)
    try:
        import importlib
        xgb_module = importlib.import_module("xgboost")
        xgb_classifier_cls = getattr(xgb_module, "XGBClassifier", None)
        if xgb_classifier_cls:
            models["XGBoost"] = xgb_classifier_cls(
                n_estimators=100, max_depth=6, learning_rate=0.1, n_jobs=n_jobs, random_state=random_state
            )
    except Exception:
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

        print(f"    - Accuracy:  {acc * 100:.2f}%")
        print(f"    - Precision: {prec * 100:.2f}%")
        print(f"    - Recall:    {rec * 100:.2f}%")
        print(f"    - F1 Score:  {f1 * 100:.2f}%")

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name

    print(f"\n[+] Best Model Selected: {best_model_name} (F1 Score: {best_f1 * 100:.2f}%)")
    best_model = results[best_model_name]["model"]

    # Save model and pipeline
    model_path = os.path.join(output_dir, "url_phishing_model.joblib")
    pipeline_path = os.path.join(output_dir, "feature_pipeline.joblib")

    joblib.dump(best_model, model_path)
    joblib.dump(extractor, pipeline_path)
    print(f"[+] Exported model artifact: {model_path}")
    print(f"[+] Exported feature pipeline: {pipeline_path}")

    # Save classification report and confusion matrix
    report_text = classification_report(
        y_test, results[best_model_name]["preds"], zero_division=0
    )
    labels_order = ["legitimate", "phishing"]
    cm = confusion_matrix(y_test, results[best_model_name]["preds"], labels=labels_order)
    cm_text = (
        f"Confusion Matrix (labels={labels_order}):\n"
        f"  TN={cm[0][0]}, FP={cm[0][1]}\n"
        f"  FN={cm[1][0]}, TP={cm[1][1]}\n"
    )

    report_file = os.path.join(reports_dir, "classification_report.txt")
    with open(report_file, "w") as f:
        f.write(f"Model: {best_model_name}\n")
        f.write(f"Dataset: {dataset_path}\n")
        f.write(f"Total Samples: {len(urls)}\n\n")
        f.write(report_text)
        f.write("\n" + cm_text)
    print(f"[+] Comprehensive classification report saved to: {report_file}")


def main():
    default_dataset = os.path.join(BASE_DIR, "ml", "datasets", "legitphish_mendeley.csv")
    if not os.path.exists(default_dataset):
        default_dataset = os.path.join(BASE_DIR, "ml", "datasets", "sample_urls.csv")

    default_output = os.path.join(BASE_DIR, "ml", "models")

    parser = argparse.ArgumentParser(description="Train SignalSafe URL Phishing Detection Model")
    parser.add_argument(
        "--dataset",
        type=str,
        help="Path or comma-separated paths to CSV dataset(s) or folder",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Path to output models directory",
    )
    parser.add_argument(
        "--sample-size",
        type=int,
        help="Optional stratified sample size for high-speed training within minutes (e.g. 25000)",
    )
    parser.add_argument(
        "--n-jobs",
        type=int,
        help="Number of CPU cores to use for feature extraction and training (-1 for all)",
    )

    parser.set_defaults(
        dataset=default_dataset,
        output=default_output,
        sample_size=None,
        n_jobs=-1,
    )
    args = parser.parse_args()

    train_models(
        dataset_path=args.dataset,
        output_dir=args.output,
        sample_size=args.sample_size,
        n_jobs=args.n_jobs,
    )


if __name__ == "__main__":
    main()

