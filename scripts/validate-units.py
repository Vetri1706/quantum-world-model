#!/usr/bin/env python3
"""Validate quantity units against the curated core unit registry."""

import sys
from pathlib import Path
from typing import Any

from validation_common import DependencyError, ROOT, Report, load_entities, load_yaml


def _known_units(report: Report) -> set[str]:
    registry = ROOT / "core" / "units.yaml"
    if not registry.exists():
        report.error(registry, "missing unit registry")
        return set()
    try:
        data = load_yaml(registry)
    except Exception as exc:
        report.error(registry, f"invalid unit registry: {exc}")
        return set()
    if isinstance(data, list):
        return {value for value in data if isinstance(value, str)}
    if isinstance(data, dict):
        units: set[str] = set()
        for key, value in data.items():
            if isinstance(key, str):
                units.add(key)
            if isinstance(value, str):
                units.add(value)
            elif isinstance(value, dict) and isinstance(value.get("symbol"), str):
                units.add(value["symbol"])
        return units
    report.error(registry, "unit registry must be a mapping or list")
    return set()


def _walk(value: Any, path: str = ""):
    if isinstance(value, dict):
        if "unit" in value:
            yield path or "/", value.get("unit")
        for key, child in value.items():
            yield from _walk(child, f"{path}/{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from _walk(child, f"{path}/{index}")


def run() -> Report:
    report = Report("Unit validation")
    try:
        units = _known_units(report)
        entities = load_entities(report)
    except DependencyError as exc:
        report.error("requirements.txt", str(exc))
        return report
    if not units:
        return report
    for _, path, entity in entities:
        for location, unit in _walk(entity):
            if not isinstance(unit, str) or unit not in units:
                report.error(path, f"{location}: unit {unit!r} is absent from core/units.yaml")
    return report


if __name__ == "__main__":
    result = run()
    print(result.render())
    sys.exit(1 if result.errors else 0)
