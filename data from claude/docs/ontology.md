# Ontology

This document defines the entities in the Quantum World Model and how they relate.
It is the blueprint for every schema in `schemas/` and every YAML file in `quantum/`.

## Entities

- **Experiment** — a runnable scientific setup with a goal, required equipment/elements, and an expected observation
- **Concept** — a scientific idea (e.g. wave function, superposition) that experiments rely on
- **Equipment** — a real-world instrument used to perform an experiment (e.g. laser, detector)
- **Element** — a draggable/placeable object inside the playground (e.g. electron, barrier)
- **Environment** — the conditions an experiment runs in (e.g. vacuum chamber, open air)
- **Equation** — the mathematical relationship governing a phenomenon
- **Procedure** — a reusable sequence of setup steps (e.g. "vacuum setup" used by multiple experiments)
- **Observation Rule** — an if/then relationship between a variable change and its effect
- **Misconception** — a common wrong belief about a concept, paired with its correction
- **Reference** — an authoritative source backing a concept or experiment

## Relationships

```
Experiment   requires        Equipment
Experiment   requires        Element
Experiment   runs_in         Environment
Experiment   uses            Equation
Experiment   follows         Procedure
Experiment   explained_by    Observation Rule
Experiment   cites           Reference

Concept      explained_by    Equation
Concept      has             Misconception
Concept      used_in         Experiment

Element      compatible_with Element
Element      used_in         Experiment

Equipment    belongs_to      Environment
```

## Notes

- Experiments, concepts, equipment, and equations get one YAML file per instance.
- Observations, misconceptions, and references are grouped into one file per experiment (a list of entries, each with its own `id`) rather than one file per entry — these are small, numerous, and always looked up in a batch (e.g. "all observation rules for quantum_tunneling"), so batching them keeps the folders from becoming hundreds of tiny files.
- `core/` holds entities every domain shares (units, constants, environments). `quantum/` holds only quantum-specific instances.
- Interactive-vs-reference status lives on the experiment itself via an `interactive: true/false` field, not as a separate folder — this is what separates the MVP's fully-built experiments from the ones the mentor only explains via the reference layer.
