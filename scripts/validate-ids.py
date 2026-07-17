#!/usr/bin/env python3
"""Validate global QWM IDs, filenames, and same-type revision links."""

import re
import sys

from validation_common import DependencyError, Report, load_entities

ID_RE = re.compile(r"^[a-z][a-z0-9-]{2,63}$")


def run() -> Report:
    report = Report("ID validation")
    try:
        entities = load_entities(report)
    except DependencyError as exc:
        report.error("requirements.txt", str(exc))
        return report
    seen: dict[str, str] = {}
    all_ids: set[str] = set()
    kinds_by_id: dict[str, str] = {}
    for kind, path, entity in entities:
        entity_id = entity.get("id")
        if not isinstance(entity_id, str) or not ID_RE.fullmatch(entity_id):
            report.error(path, "id must match ^[a-z][a-z0-9-]{2,63}$")
            continue
        if path.stem != entity_id:
            report.error(path, f"filename must be {entity_id}.yaml")
        if entity_id in seen:
            report.error(path, f"duplicate id '{entity_id}' (already used by {seen[entity_id]})")
        else:
            seen[entity_id] = str(path)
            all_ids.add(entity_id)
            kinds_by_id[entity_id] = kind
    for kind, path, entity in entities:
        for relation in ("supersedes", "deprecated_by"):
            target = entity.get(relation)
            if target is not None and target not in all_ids:
                report.error(path, f"{relation} references missing id '{target}'")
            elif target is not None and kinds_by_id.get(target) != kind:
                report.error(path, f"{relation} must reference the same entity type; '{target}' is a {kinds_by_id[target]}")
    return report


if __name__ == "__main__":
    result = run()
    print(result.render())
    sys.exit(1 if result.errors else 0)
