#!/usr/bin/env python3
"""Validate each QWM entity against its versioned JSON Schema."""

from pathlib import Path
import sys

from validation_common import DependencyError, Report, SCHEMA_DIR, load_entities


def run() -> Report:
    report = Report("Schema validation")
    try:
        from jsonschema import Draft202012Validator
        from jsonschema.exceptions import SchemaError
        from referencing import Registry, Resource
        from validation_common import load_yaml
        schemas = {path.name: load_yaml(path) for path in SCHEMA_DIR.glob("*.schema.yaml")}
        schema_registry = Registry()
        for name, schema in schemas.items():
            resource = Resource.from_contents(schema)
            schema_registry = schema_registry.with_resource(name, resource)
            schema_registry = schema_registry.with_resource((SCHEMA_DIR / name).as_uri(), resource)
            if isinstance(schema.get("$id"), str):
                schema_registry = schema_registry.with_resource(schema["$id"], resource)
    except DependencyError as exc:
        report.error("requirements.txt", str(exc))
        return report
    except ImportError:
        report.error("requirements.txt", "jsonschema is required; install requirements.txt")
        return report
    except Exception as exc:
        report.error(SCHEMA_DIR, f"cannot load schemas: {exc}")
        return report

    for schema_name, schema in schemas.items():
        try:
            Draft202012Validator.check_schema(schema)
        except SchemaError as exc:
            report.error(SCHEMA_DIR / schema_name, f"invalid JSON Schema: {exc.message}")

    try:
        entities = load_entities(report)
    except DependencyError as exc:
        report.error("requirements.txt", str(exc))
        return report

    for kind, path, entity in entities:
        schema_name = f"{kind}.schema.yaml"
        schema = schemas.get(schema_name)
        if schema is None:
            report.error(path, f"missing schema {schema_name}")
            continue
        validator = Draft202012Validator(schema, registry=schema_registry)
        for error in sorted(validator.iter_errors(entity), key=lambda item: list(item.path)):
            location = "/".join(str(part) for part in error.path) or "<root>"
            report.error(path, f"{location}: {error.message}")
    return report


if __name__ == "__main__":
    result = run()
    print(result.render())
    sys.exit(1 if result.errors else 0)
