"""ML predictor service for URL phishing detection.

Loads a trained model and feature pipeline from disk, extracts features
from URLs, and returns predictions with confidence scores.

Falls back gracefully to heuristic-only analysis when model files are absent.
"""

import logging
import os
import sys
from typing import Any, Dict, Optional

import numpy as np

from app.core.config import settings

# Ensure ML package can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

logger = logging.getLogger(__name__)


class MLPredictor:
    """Machine learning predictor for URL classification."""

    def __init__(self) -> None:
        self._model = None
        self._pipeline = None
        self._loaded = False
        self._load_model()

    def _resolve_path(self, path: str) -> Optional[str]:
        candidates = [
            path,
            os.path.join("..", path),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", path)),
        ]
        for c in candidates:
            if os.path.exists(c):
                return c
        return None

    def _load_model(self) -> None:
        """Attempt to load the trained model and feature pipeline."""
        model_path = self._resolve_path(settings.ML_MODEL_PATH)
        pipeline_path = self._resolve_path(settings.ML_PIPELINE_PATH)

        if not model_path or not pipeline_path:
            logger.info("ML model files not found — ML prediction will run in heuristic fallback mode")
            return

        try:
            import joblib
            self._model = joblib.load(model_path)
            self._pipeline = joblib.load(pipeline_path)
            self._loaded = True
            logger.info("ML model and feature pipeline loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load ML model: {e}")
            self._loaded = False

    @property
    def is_available(self) -> bool:
        return self._loaded

    def predict(self, url: str) -> Dict[str, Any]:
        if not self._loaded:
            raise RuntimeError("ML model is not available")

        features = self._pipeline.extract(url)
        feature_names = self._pipeline.get_feature_names()
        feature_values = [features.get(name, 0.0) for name in feature_names]
        feature_array = np.array([feature_values])

        prediction = self._model.predict(feature_array)[0]
        probabilities = self._model.predict_proba(feature_array)[0]
        confidence = float(max(probabilities))

        return {
            "prediction": str(prediction),
            "confidence": round(confidence, 4),
            "features": features,
        }

    def health_check(self) -> Dict[str, Any]:
        return {
            "available": self._loaded,
            "model_path": settings.ML_MODEL_PATH,
            "pipeline_path": settings.ML_PIPELINE_PATH,
            "model_loaded": self._model is not None,
            "pipeline_loaded": self._pipeline is not None,
        }
