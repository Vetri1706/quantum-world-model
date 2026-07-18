import { resolve } from "node:path";

import { MissingEntityError, RuntimeError } from "../errors/RuntimeError.js";
import { ExperimentGraphBuilder } from "../loader/graph-builder.js";
import { loadEntityStore, type EntityKind, type EntityStore } from "../loader/repository-loader.js";
import type { Component } from "../models/Component.js";
import type { Concept } from "../models/Concept.js";
import type { Equation } from "../models/Equation.js";
import type { Experiment } from "../models/Experiment.js";
import type { ResolvedExperiment } from "../models/ResolvedExperiment.js";
import { getComponent } from "./getComponent.js";
import { getConcept } from "./getConcept.js";
import { getEquation } from "./getEquation.js";
import { getExperiment } from "./getExperiment.js";
import { listComponents } from "./listComponents.js";
import { listExperiments } from "./listExperiments.js";
import { resolveExperiment } from "./resolveExperiment.js";

type KindEntity<K extends EntityKind> =
  K extends "experiment" ? Experiment :
  K extends "component" ? Component :
  K extends "concept" ? Concept :
  K extends "equation" ? Equation : Entity;
type Entity = Record<string, unknown> & { id: string };

export class RuntimeRepository {
  private store?: EntityStore;
  private graphBuilder?: ExperimentGraphBuilder;
  private experiments = new Map<string, ResolvedExperiment>();

  public async loadRepository(repositoryRoot = process.cwd()): Promise<void> {
    const store = await loadEntityStore(resolve(repositoryRoot));
    const graphBuilder = new ExperimentGraphBuilder(store);
    this.experiments = graphBuilder.resolveAllExperiments();
    this.store = store;
    this.graphBuilder = graphBuilder;
  }

  public getExperiment(id: string): ResolvedExperiment | undefined { return this.experiments.get(id); }
  public getConcept(id: string): Concept | undefined { return this.graphBuilder?.getConcept(id); }
  public getComponent(id: string): Component | undefined { return this.graphBuilder?.getComponent(id); }
  public getEquation(id: string): Equation | undefined { return this.graphBuilder?.getEquation(id); }
  public listExperiments(): ResolvedExperiment[] { return [...this.experiments.values()]; }
  public listComponents(): Component[] { return this.entities("component"); }
  public resolveExperiment(id: string): ResolvedExperiment | undefined { return this.getExperiment(id); }

  public requireExperiment(id: string): ResolvedExperiment {
    const entity = this.getExperiment(id);
    if (!entity) throw new MissingEntityError(`Experiment '${id}' was not found. Has loadRepository() been called?`);
    return entity;
  }

  public requireEntity<K extends EntityKind>(kind: K, id: string): KindEntity<K> {
    const entity = this.entity(kind, id);
    if (!entity) throw new MissingEntityError(`${kind} '${id}' was not found. Has loadRepository() been called?`);
    return entity as KindEntity<K>;
  }

  public entities<K extends EntityKind>(kind: K): KindEntity<K>[] {
    if (!this.store) throw new RuntimeError("Repository has not been loaded.");
    return [...this.store.get(kind)!.values()] as KindEntity<K>[];
  }

  private entity<K extends EntityKind>(kind: K, id: string): KindEntity<K> | undefined {
    if (!this.store) return undefined;
    return this.store.get(kind)?.get(id) as KindEntity<K> | undefined;
  }
}

export { getExperiment, getConcept, getComponent, getEquation, listExperiments, listComponents, resolveExperiment };
