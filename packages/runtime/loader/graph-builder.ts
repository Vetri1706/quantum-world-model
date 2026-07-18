import { CycleError, ReferenceResolutionError } from "../errors/RuntimeError.js";
import type { Component } from "../models/Component.js";
import type { Concept } from "../models/Concept.js";
import type { Environment } from "../models/Environment.js";
import type { Equation } from "../models/Equation.js";
import type { Experiment } from "../models/Experiment.js";
import type { ObservationRule } from "../models/ObservationRule.js";
import type { Procedure } from "../models/Procedure.js";
import type { ResolvedExperiment } from "../models/ResolvedExperiment.js";
import type { SimulationModel } from "../models/SimulationModel.js";
import type { Source } from "../models/Source.js";
import type { Entity } from "../models/Entity.js";
import type { EntityKind, EntityStore } from "./repository-loader.js";

type EntityMaps = {
  experiment: Map<string, Experiment>;
  component: Map<string, Component>;
  concept: Map<string, Concept>;
  equation: Map<string, Equation>;
  environment: Map<string, Environment>;
  procedure: Map<string, Procedure>;
  "observation-rule": Map<string, ObservationRule>;
  "simulation-model": Map<string, SimulationModel>;
  source: Map<string, Source>;
};

function mapsFromStore(store: EntityStore): EntityMaps {
  return {
    experiment: store.get("experiment")! as Map<string, Experiment>,
    component: store.get("component")! as Map<string, Component>,
    concept: store.get("concept")! as Map<string, Concept>,
    equation: store.get("equation")! as Map<string, Equation>,
    environment: store.get("environment")! as Map<string, Environment>,
    procedure: store.get("procedure")! as Map<string, Procedure>,
    "observation-rule": store.get("observation-rule")! as Map<string, ObservationRule>,
    "simulation-model": store.get("simulation-model")! as Map<string, SimulationModel>,
    source: store.get("source")! as Map<string, Source>,
  };
}

function requireRef<T>(map: Map<string, T>, id: string, owner: string, field: string): T {
  const entity = map.get(id);
  if (!entity) throw new ReferenceResolutionError(`${owner}.${field} references missing entity '${id}'.`);
  return entity;
}

function checkRevisionCycles(store: EntityStore): void {
  for (const [kind, entities] of store) {
    for (const entity of entities.values()) {
      const visited = new Set<string>();
      let current: Entity | undefined = entity;
      while (current?.supersedes) {
        if (visited.has(current.id)) throw new CycleError(`${kind} revision cycle includes '${current.id}'.`);
        visited.add(current.id);
        current = requireRef(entities, current.supersedes, current.id, "supersedes");
      }
    }
  }
}

export class ExperimentGraphBuilder {
  private readonly entities: EntityMaps;
  private readonly resolvedComponents = new Map<string, Component>();
  private readonly resolvedConcepts = new Map<string, Concept>();
  private readonly resolvedEquations = new Map<string, Equation>();
  private readonly resolvedProcedures = new Map<string, Procedure>();
  private readonly resolvedRules = new Map<string, ObservationRule>();
  private readonly resolvedModels = new Map<string, SimulationModel>();

  public constructor(store: EntityStore) {
    checkRevisionCycles(store);
    this.entities = mapsFromStore(store);
  }

  public resolveExperiment(id: string): ResolvedExperiment {
    const experiment = requireRef(this.entities.experiment, id, "runtime", "experiment");
    return {
      ...experiment,
      configuration: {
        ...experiment.configuration,
        environment: requireRef(this.entities.environment, experiment.configuration.environment, experiment.id, "configuration.environment"),
        components: experiment.configuration.components.map(item => ({
          ...item,
          component: this.resolveComponent(item.component),
        })),
      },
      procedure: this.resolveProcedure(experiment.procedure),
      observation_rules: experiment.observation_rules.map(id => this.resolveRule(id)),
      concepts: experiment.concepts.map(id => this.resolveConcept(id)),
      equations: experiment.equations.map(id => this.resolveEquation(id)),
      sources: experiment.sources.map(id => requireRef(this.entities.source, id, experiment.id, "sources")),
      simulation_model: experiment.simulation_model
        ? this.resolveModel(experiment.simulation_model)
        : undefined,
    };
  }

  /** Resolves every experiment now, so unresolved references always fail at load time. */
  public resolveAllExperiments(): Map<string, ResolvedExperiment> {
    return new Map([...this.entities.experiment.keys()].map(id => [id, this.resolveExperiment(id)]));
  }

  public getComponent(id: string): Component | undefined {
    return this.entities.component.has(id) ? this.resolveComponent(id) : undefined;
  }

  public getConcept(id: string): Concept | undefined {
    return this.entities.concept.has(id) ? this.resolveConcept(id) : undefined;
  }

  public getEquation(id: string): Equation | undefined {
    return this.entities.equation.has(id) ? this.resolveEquation(id) : undefined;
  }

  public entitiesByKind<K extends EntityKind>(kind: K): EntityMaps[K] { return this.entities[kind]; }

  private resolveComponent(id: string): Component {
    const existing = this.resolvedComponents.get(id);
    if (existing) return existing;
    const raw = requireRef(this.entities.component, id, "runtime", "component");
    const resolved = { ...raw, compatible_with: [] as Component[] } as unknown as Component;
    this.resolvedComponents.set(id, resolved);
    (resolved as unknown as { compatible_with: Component[] }).compatible_with = (raw.compatible_with ?? []).map(reference => this.resolveComponent(reference));
    return resolved;
  }

  private resolveConcept(id: string): Concept {
    const existing = this.resolvedConcepts.get(id);
    if (existing) return existing;
    const raw = requireRef(this.entities.concept, id, "runtime", "concept");
    const resolved = { ...raw, related_concepts: [] as Concept[], equations: [] as Equation[] } as unknown as Concept;
    this.resolvedConcepts.set(id, resolved);
    const graph = resolved as unknown as { related_concepts: Concept[]; equations: Equation[] };
    graph.related_concepts = (raw.related_concepts ?? []).map(reference => this.resolveConcept(reference));
    graph.equations = (raw.equations ?? []).map(reference => this.resolveEquation(reference));
    return resolved;
  }

  private resolveEquation(id: string): Equation {
    const existing = this.resolvedEquations.get(id);
    if (existing) return existing;
    const raw = requireRef(this.entities.equation, id, "runtime", "equation");
    const resolved = { ...raw, related_concepts: [] as Concept[] } as unknown as Equation;
    this.resolvedEquations.set(id, resolved);
    (resolved as unknown as { related_concepts: Concept[] }).related_concepts = (raw.related_concepts ?? []).map(reference => this.resolveConcept(reference));
    return resolved;
  }

  private resolveProcedure(id: string): Procedure {
    const existing = this.resolvedProcedures.get(id);
    if (existing) return existing;
    const raw = requireRef(this.entities.procedure, id, "runtime", "procedure");
    const resolved = {
      ...raw,
      steps: raw.steps.map(step => step.component ? { ...step, component: this.resolveComponent(step.component) } : { ...step }),
    } as unknown as Procedure;
    this.resolvedProcedures.set(id, resolved);
    return resolved;
  }

  private resolveRule(id: string): ObservationRule {
    const existing = this.resolvedRules.get(id);
    if (existing) return existing;
    const raw = requireRef(this.entities["observation-rule"], id, "runtime", "observation-rule");
    const resolved = {
      ...raw,
      equation: raw.equation ? this.resolveEquation(raw.equation) : undefined,
      applicability: (raw.applicability ?? []).map(item => ({ ...item, id: this.resolveApplicability(item.entity_type, item.id) })),
    } as unknown as ObservationRule;
    this.resolvedRules.set(id, resolved);
    return resolved;
  }

  private resolveApplicability(kind: "concept" | "component" | "environment", id: string): Concept | Component | Environment {
    if (kind === "concept") return this.resolveConcept(id);
    if (kind === "component") return this.resolveComponent(id);
    return requireRef(this.entities.environment, id, "runtime", "environment");
  }

  private resolveModel(id: string): SimulationModel {
    const existing = this.resolvedModels.get(id);
    if (existing) return existing;
    const raw = requireRef(this.entities["simulation-model"], id, "runtime", "simulation-model");
    const resolved = {
      ...raw,
      equations: raw.equations.map(reference => this.resolveEquation(reference)),
      supported_components: (raw.supported_components ?? []).map(reference => this.resolveComponent(reference)),
    } as unknown as SimulationModel;
    this.resolvedModels.set(id, resolved);
    return resolved;
  }
}
