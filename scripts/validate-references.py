#!/usr/bin/env python3
"""Validate foreign-key annotations represented by QWM entity relationships."""

import sys
from typing import Any

from validation_common import DependencyError, Report, build_id_index, get_path, load_entities, json_pointer


def _check(report: Report, path: object, value: Any, expected: str, index: dict[str, set[str]], label: str) -> None:
    if value is None:
        return
    if not isinstance(value, str) or value not in index.get(expected, set()):
        report.error(path, f"{label} must reference an existing {expected} id; got {value!r}")


def _check_list(report: Report, path: object, values: Any, expected: str, index: dict[str, set[str]], label: str) -> None:
    if values is None:
        return
    if not isinstance(values, list):
        report.error(path, f"{label} must be a list")
        return
    for value in values:
        _check(report, path, value, expected, index, label)


def _scientific_leaf_paths(value: Any, parts: list[str] | None = None):
    """Yield populated data paths; identifiers and lifecycle metadata are not claims."""
    parts = parts or []
    if not parts and not isinstance(value, (dict, list)):
        return
    if isinstance(value, dict):
        for key, child in value.items():
            if key in {"id", "schema_version", "status", "supersedes", "deprecated_by", "evidence"}:
                continue
            yield from _scientific_leaf_paths(child, parts + [str(key)])
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from _scientific_leaf_paths(child, parts + [str(index)])
    elif value is not None:
        yield json_pointer(parts)


def _has_evidence(path: str, evidence_paths: set[str]) -> bool:
    return any(path == evidence_path or path.startswith(evidence_path + "/") for evidence_path in evidence_paths)


def run() -> Report:
    report = Report("Reference validation")
    try:
        entities = load_entities(report)
    except DependencyError as exc:
        report.error("requirements.txt", str(exc))
        return report
    index = build_id_index(entities)
    all_ids = set().union(*index.values()) if index else set()
    for kind, path, entity in entities:
        if kind == "concept":
            _check_list(report, path, entity.get("related_concepts"), "concept", index, "related_concepts")
            _check_list(report, path, entity.get("equations"), "equation", index, "equations")
        elif kind == "equation":
            _check_list(report, path, entity.get("related_concepts"), "concept", index, "related_concepts")
        elif kind == "component":
            _check_list(report, path, entity.get("compatible_with"), "component", index, "compatible_with")
        elif kind == "procedure":
            for step in entity.get("steps", []):
                if isinstance(step, dict):
                    _check(report, path, step.get("component"), "component", index, "steps[].component")
        elif kind == "observation-rule":
            _check(report, path, entity.get("equation"), "equation", index, "equation")
            for item in entity.get("applicability", []):
                if isinstance(item, dict):
                    entity_type = item.get("entity_type")
                    if entity_type in {"concept", "component", "environment"}:
                        _check(report, path, item.get("id"), entity_type, index, "applicability[].id")
        elif kind == "simulation-model":
            _check_list(report, path, entity.get("equations"), "equation", index, "equations")
            _check_list(report, path, entity.get("supported_components"), "component", index, "supported_components")
        elif kind == "experiment":
            _check(report, path, get_path(entity, "configuration", "environment"), "environment", index, "configuration.environment")
            for component in get_path(entity, "configuration", "components") or []:
                if isinstance(component, dict):
                    _check(report, path, component.get("component"), "component", index, "configuration.components[].component")
            _check(report, path, entity.get("procedure"), "procedure", index, "procedure")
            _check_list(report, path, entity.get("observation_rules"), "observation-rule", index, "observation_rules")
            _check_list(report, path, entity.get("concepts"), "concept", index, "concepts")
            _check_list(report, path, entity.get("equations"), "equation", index, "equations")
            _check_list(report, path, entity.get("sources"), "source", index, "sources")
            _check(report, path, entity.get("simulation_model"), "simulation-model", index, "simulation_model")
        elif kind == "review-issue":
            if entity.get("subject") not in all_ids:
                report.error(path, f"subject must reference an existing entity id; got {entity.get('subject')!r}")
            _check_list(report, path, entity.get("candidate_sources"), "source", index, "candidate_sources")
            _check_list(report, path, entity.get("related_sources"), "source", index, "related_sources")
        evidence = entity.get("evidence", {})
        if isinstance(evidence, dict):
            for evidence_path in evidence:
                if not evidence_path.startswith("/"):
                    report.error(path, f"evidence path must be a JSON Pointer; got {evidence_path!r}")
            for entries in evidence.values():
                if isinstance(entries, list):
                    for entry in entries:
                        if isinstance(entry, dict):
                            _check(report, path, entry.get("source"), "source", index, "evidence[].source")
        if kind not in {"source", "review-issue"}:
            evidence_paths = set(evidence) if isinstance(evidence, dict) else set()
            for claim_path in _scientific_leaf_paths(entity):
                if not _has_evidence(claim_path, evidence_paths):
                    report.error(path, f"{claim_path} has no supporting evidence entry")
    return report


if __name__ == "__main__":
    result = run()
    print(result.render())
    sys.exit(1 if result.errors else 0)
