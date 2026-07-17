"""Shared discovery, parsing, and reporting utilities for QWM validation."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterator

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_DIR = ROOT / "schemas"
ENTITY_FOLDERS = {
    "sources": "source",
    "concepts": "concept",
    "equations": "equation",
    "components": "component",
    "environments": "environment",
    "procedures": "procedure",
    "observation-rules": "observation-rule",
    "simulation-models": "simulation-model",
    "experiments": "experiment",
    "review-issues": "review-issue",
}


class DependencyError(RuntimeError):
    pass


@dataclass
class Finding:
    severity: str
    path: str
    message: str


@dataclass
class Report:
    name: str
    findings: list[Finding] = field(default_factory=list)
    checked: int = 0

    def error(self, path: Path | str, message: str) -> None:
        self.findings.append(Finding("ERROR", str(path), message))

    def warning(self, path: Path | str, message: str) -> None:
        self.findings.append(Finding("WARNING", str(path), message))

    @property
    def errors(self) -> int:
        return sum(item.severity == "ERROR" for item in self.findings)

    def render(self) -> str:
        lines = [f"{self.name}: checked {self.checked} file(s)"]
        if not self.findings:
            return "\n".join(lines + ["  PASS"])
        for item in self.findings:
            lines.append(f"  {item.severity} {item.path}: {item.message}")
        lines.append(f"  {'FAIL' if self.errors else 'PASS WITH WARNINGS'} ({self.errors} error(s))")
        return "\n".join(lines)


def require_yaml() -> Any:
    try:
        import yaml
    except ImportError as exc:
        raise DependencyError("PyYAML is required; install requirements.txt") from exc
    return yaml


def load_yaml(path: Path) -> Any:
    return require_yaml().safe_load(path.read_text(encoding="utf-8"))


def entity_type(path: Path) -> str | None:
    return ENTITY_FOLDERS.get(path.parent.name)


def discover_entity_files() -> Iterator[tuple[str, Path]]:
    for root_name in ("core", "quantum"):
        root = ROOT / root_name
        if not root.exists():
            continue
        for path in sorted(root.rglob("*.yaml")):
            kind = entity_type(path)
            if kind:
                yield kind, path


def load_entities(report: Report) -> list[tuple[str, Path, dict[str, Any]]]:
    entities: list[tuple[str, Path, dict[str, Any]]] = []
    for kind, path in discover_entity_files():
        report.checked += 1
        try:
            value = load_yaml(path)
        except DependencyError:
            raise
        except Exception as exc:
            report.error(path, f"invalid YAML: {exc}")
            continue
        if not isinstance(value, dict):
            report.error(path, "entity file must contain a YAML mapping")
            continue
        entities.append((kind, path, value))
    return entities


def json_pointer(parts: list[str]) -> str:
    return "/" + "/".join(part.replace("~", "~0").replace("/", "~1") for part in parts)


def walk_nulls(value: Any, parts: list[str] | None = None) -> Iterator[str]:
    parts = parts or []
    if value is None:
        yield json_pointer(parts)
    elif isinstance(value, dict):
        for key, child in value.items():
            yield from walk_nulls(child, parts + [str(key)])
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from walk_nulls(child, parts + [str(index)])


def build_id_index(entities: list[tuple[str, Path, dict[str, Any]]]) -> dict[str, set[str]]:
    index: dict[str, set[str]] = {}
    for kind, _, entity in entities:
        entity_id = entity.get("id")
        if isinstance(entity_id, str):
            index.setdefault(kind, set()).add(entity_id)
    return index


def get_path(value: dict[str, Any], *keys: str) -> Any:
    current: Any = value
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current
