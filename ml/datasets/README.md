# Datasets

## Required Format

Place your training dataset here as `urls.csv` with format:

| Column | Type | Values |
|--------|------|--------|
| url | string | The full URL |
| label | string | "legitimate" or "phishing" |

## Recommended Datasets

The following public datasets can be used for training:

1. **PhishTank** - https://phishtank.org/developer_info.php
   - Free API, provides verified phishing URLs
   - Export as CSV, use "url" column, label all as "phishing"

2. **UCI Phishing Websites Dataset** - https://archive.ics.uci.edu/dataset/327/phishing+websites

3. **Kaggle Phishing URL Detection** - https://www.kaggle.com/datasets/shashwatwork/phishing-dataset-for-machine-learning

4. **Legitimate URLs** can be collected from Tranco list - https://tranco-list.eu/

## Sample Data for Testing

A small sample `sample_urls.csv` is provided for testing the ML pipeline.
Train using:
```bash
python -m ml.src.train --dataset ml/datasets/sample_urls.csv --output ml/models/
```

