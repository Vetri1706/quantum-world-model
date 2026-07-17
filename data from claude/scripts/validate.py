#!/usr/bin/env python3
"""
Validates every YAML file under quantum/ and core/ against the required
top-level fields for its type (inferred from its parent folder name).

Usage: python scripts/validate.py
"""

import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("Missing dependency: pip install pyyaml --break-system-packages")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent

REQUIRED_FIELDS = {
    "experiments": ["id", "name", "category", "difficulty", "interactive", "goal"],
    "concepts": ["id", "name", "category"],
    "equipment": ["id", "name", "category"],
    "environments": ["id", "name"],
    "equations": ["id", "name", "domain"],
    "procedures": ["id", "name"],
    "elements": ["id", "name"],
}

# These folders hold one file per experiment, but each file is a LIST of
# small entries (each with its own id) rather than a single entity.
LIST_TYPE_FOLDERS = {
    "observations": ["id", "condition", "observation", "reason"],
    "misconceptions": ["id", "misconception", "correction"],
    "references": ["id", "title", "source"],
}


def find_yaml_files():
    for base in [ROOT / "quantum", ROOT / "core"]:
        if base.exists():
            yield from base.rglob("*.yaml")


def validate_file(path: Path):
    folder = path.parent.name

    with open(path) as f:
        try:
            data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            return [f"invalid YAML: {e}"], []

    if folder in LIST_TYPE_FOLDERS:
        required = LIST_TYPE_FOLDERS[folder]
        if not isinstance(data, list) or not data:
            return ["expected a non-empty list of entries"], []
        missing = []
        entry_ids = []
        for i, entry in enumerate(data):
            entry_missing = [f for f in required if f not in entry or entry[f] in (None, "")]
            if entry_missing:
                missing.append(f"entry {i} ({entry.get('id', '?')}): missing {', '.join(entry_missing)}")
            if entry.get("id"):
                entry_ids.append(entry["id"])
        return missing, entry_ids

    required = REQUIRED_FIELDS.get(folder)
    data = data or {}

    if required is None:
        # core/ files (units, constants, environments) are dictionaries of
        # named entries rather than single-entity schemas — just confirm
        # they parse and aren't empty.
        return ([] if data else ["file is empty"]), []

    missing = [field for field in required if field not in data or data[field] in (None, "")]
    entry_id = data.get("id") if isinstance(data, dict) else None
    return missing, ([entry_id] if entry_id else [])


def main():
    files = sorted(find_yaml_files())
    if not files:
        print("No YAML files found under quantum/ or core/.")
        return

    seen_ids = {}
    any_errors = False

    for path in files:
        rel = path.relative_to(ROOT)
        missing, ids = validate_file(path)

        if missing:
            any_errors = True
            print(f"\u274c {rel}")
            print(f"   Missing: {', '.join(missing)}")
        else:
            print(f"\u2714 {rel}")

        for entry_id in ids:
            if entry_id in seen_ids:
                any_errors = True
                print(f"\u274c Duplicate id '{entry_id}': {seen_ids[entry_id]} and {rel}")
            else:
                seen_ids[entry_id] = rel

    print()
    if any_errors:
        print("Validation finished with errors.")
        sys.exit(1)
    else:
        print("All files valid.")


if __name__ == "__main__":
    main()
