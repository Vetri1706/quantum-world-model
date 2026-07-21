#!/usr/bin/env python3
"""Validate trained QWM PyTorch model checkpoints and manifest integrity."""

import json
from pathlib import Path
import sys

from validation_common import Report, ROOT


def run() -> Report:
    report = Report("Model validation")
    checkpoints_dir = ROOT / "training" / "checkpoints"
    manifest_path = checkpoints_dir / "qwm_models_manifest.json"

    report.checked += 1
    if not manifest_path.exists():
        report.error(manifest_path, "missing QWM models manifest; run scripts/train_qwm.py --all")
        return report

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as exc:
        report.error(manifest_path, f"invalid JSON manifest: {exc}")
        return report

    models = manifest.get("models", {})
    if not models:
        report.error(manifest_path, "manifest contains no registered models")

    import torch

    for model_key, meta in models.items():
        ckpt_name = meta.get("checkpoint")
        if not ckpt_name:
            report.error(manifest_path, f"model '{model_key}' missing checkpoint path")
            continue

        ckpt_path = checkpoints_dir / ckpt_name
        report.checked += 1
        if not ckpt_path.exists():
            report.error(ckpt_path, f"model checkpoint file missing for '{model_key}'")
            continue

        try:
            state_dict = torch.load(ckpt_path, weights_only=True)
            if not isinstance(state_dict, dict) or len(state_dict) == 0:
                report.error(ckpt_path, "checkpoint state_dict is empty or invalid format")
        except Exception as exc:
            report.error(ckpt_path, f"failed to load PyTorch checkpoint: {exc}")

    return report


if __name__ == "__main__":
    result = run()
    print(result.render())
    sys.exit(1 if result.errors else 0)
