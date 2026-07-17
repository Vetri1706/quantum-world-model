# Quantum World Model

The structured knowledge layer behind the Prompt-to-Experiment Quantum Lab. This is not a
prose knowledge base — it's a set of YAML entities (experiments, concepts, equipment,
environments, equations) that an AI mentor can query and reason over instead of
paraphrasing documentation.

## Why YAML, not documents

An AI that reads "Quantum Tunneling: Definition..." can only paraphrase. An AI that reads
`required_elements`, `variables`, and `common_mistakes` as structured fields can check a
user's build against them, catch a missing element, and explain an observation using the
matching rule — not a canned paragraph. This is what makes the mentor behave like a lab
partner instead of a chatbot.

## Architecture

```
Scientific World Model
│
├── Quantum World Model      (this repo)
├── Astrophysics World Model (future)
├── Optics World Model       (future)
└── ...
```

Each domain follows the same folder structure and schema shape, so the architecture
doesn't change as new domains are added later — only the data does.

## Folder structure

```
quantum-world-model/
├── docs/
│   └── ontology.md          entity definitions and relationships — read this first
├── schemas/                 structure only, no values — one schema per entity type
├── core/                    domain-agnostic shared data: units, constants, environments
├── quantum/
│   ├── concepts/            one YAML per concept (e.g. wave_function.yaml)
│   ├── experiments/         one YAML per experiment (e.g. quantum_tunneling.yaml)
│   ├── equipment/           one YAML per instrument (e.g. detector.yaml)
│   ├── elements/            draggable/placeable playground objects
│   ├── environments/        quantum-specific environments (core/environments.yaml holds shared ones)
│   ├── equations/           one YAML per equation
│   ├── procedures/          reusable step sequences
│   ├── observations/        if/then rules ("barrier width up -> transmission down")
│   ├── misconceptions/      common wrong beliefs + corrections
│   └── references/          authoritative sources, cited by id elsewhere
└── scripts/
    └── validate.py          checks every YAML file has its required fields and unique ids
```

## The `interactive` field

Every experiment has `interactive: true` or `interactive: false`.

- `true` — this experiment has a working Codex-built renderer; the AI mentor can build it live
- `false` — reference-only; the mentor explains and cites from this data via the RAG layer, but there's no simulation to run yet

This is how the MVP stays small (2 interactive experiments) while the knowledge base can
grow much larger (8-12+ experiments) without expanding what has to be engineered.

## Status

- [x] Folder structure
- [x] Ontology
- [x] Schemas (experiment, concept, equipment, environment, equation)
- [x] Core constants/units/environments
- [x] Quantum Tunneling — fully populated (history, expected observation, 4 observation rules, 2 misconceptions, 2 equations, 2 references)
- [x] Young's Double Slit — fully populated (history, expected observation, 4 observation rules, 2 misconceptions, 2 equations, 2 references)
- [x] Ten supporting concepts, nine equipment entries across both experiments
- [ ] Remaining reference-only experiments (`interactive: false`): photoelectric effect, Stern-Gerlach, harmonic oscillator, particle in a box, Bell test, teleportation, quantum eraser, Mach-Zehnder
- [ ] Renderer integration (Codex-built Three.js scenes consuming this data) — not part of this repo

## Validating

```
pip install pyyaml --break-system-packages
python scripts/validate.py
```

## Future roadmap

Graph-database version of this model, environment library expansion (Moon, Mars, deep
ocean, ISS), materials database, community contribution layer with citation review, and
expansion into astrophysics/optics/chemistry domains using this same architecture.
