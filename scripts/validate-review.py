#!/usr/bin/env python3
"""Require machine-readable review issues for unresolved nulls and conflicts."""

import sys

from validation_common import DependencyError, Report, load_entities, walk_nulls


def run() -> Report:
    report = Report("Review validation")
    try:
        entities = load_entities(report)
    except DependencyError as exc:
        report.error("requirements.txt", str(exc))
        return report
    issues = [entity for kind, _, entity in entities if kind == "review-issue"]
    open_issues = {
        (issue.get("subject"), issue.get("field_path"), issue.get("issue_type"))
        for issue in issues
        if issue.get("issue_status") == "open"
    }
    for kind, path, entity in entities:
        if kind == "review-issue":
            continue
        entity_id = entity.get("id")
        for field_path in walk_nulls(entity):
            if (entity_id, field_path, "unknown-value") not in open_issues:
                report.error(path, f"{field_path} is null without an open unknown-value review issue")
        if entity.get("status") == "approved":
            for issue in issues:
                if issue.get("subject") == entity_id and issue.get("issue_status") == "open":
                    report.error(path, f"approved entity has open review issue {issue.get('id')!r}")
    return report


if __name__ == "__main__":
    result = run()
    print(result.render())
    sys.exit(1 if result.errors else 0)
