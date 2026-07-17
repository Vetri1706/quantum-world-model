#!/usr/bin/env python3
"""Run the complete QWM validation pipeline: python validate.py."""

from __future__ import annotations

from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
VALIDATORS = [
    "validate-schema.py",
    "validate-ids.py",
    "validate-references.py",
    "validate-units.py",
    "validate-review.py",
]


def main() -> int:
    print("QWM validation pipeline")
    print(f"Repository: {ROOT}")
    failures = 0
    for name in VALIDATORS:
        result = subprocess.run([sys.executable, str(ROOT / "scripts" / name)], cwd=ROOT, text=True, capture_output=True)
        print(f"\n=== {name} ===")
        print(result.stdout.rstrip() or "No output")
        if result.stderr:
            print(result.stderr.rstrip(), file=sys.stderr)
        if result.returncode:
            failures += 1
    print(f"\nValidation {'FAILED' if failures else 'PASSED'}: {len(VALIDATORS) - failures}/{len(VALIDATORS)} validators passed.")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
