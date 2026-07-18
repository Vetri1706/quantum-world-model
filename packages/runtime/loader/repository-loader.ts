import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

import { DuplicateEntityError, RepositoryValidationError } from "../errors/RuntimeError.js";
import type { Entity } from "../models/Entity.js";
import { loadYamlFile } from "./yaml-loader.js";

export type EntityKind = "experiment" | "component" | "concept" | "equation" | "environment" | "procedure" | "observation-rule" | "simulation-model" | "source";
export type EntityStore = Map<EntityKind, Map<string, Entity>>;

const FOLDER_KINDS: Record<string, EntityKind> = {
  experiments: "experiment", components: "component", concepts: "concept", equations: "equation",
  environments: "environment", procedures: "procedure", "observation-rules": "observation-rule",
  "simulation-models": "simulation-model", sources: "source",
};

async function yamlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await yamlFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".yaml")) files.push(path);
  }
  return files;
}

function requireEntity(value: Record<string, unknown>, path: string): Entity {
  if (typeof value.id !== "string" || !value.id) throw new RepositoryValidationError("Entity id is required.", path);
  if (typeof value.schema_version !== "string" || !value.schema_version) throw new RepositoryValidationError("Entity schema_version is required.", path);
  if (typeof value.status !== "string" || !value.status) throw new RepositoryValidationError("Entity status is required.", path);
  return value as unknown as Entity;
}

export async function loadEntityStore(repositoryRoot: string): Promise<EntityStore> {
  const root = resolve(repositoryRoot);
  const store: EntityStore = new Map(Object.values(FOLDER_KINDS).map(kind => [kind, new Map()]));
  const globalIds = new Map<string, string>();
  for (const rootName of ["core", "quantum"]) {
    const rootPath = join(root, rootName);
    let entries;
    try { entries = await readdir(rootPath, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      const kind = entry.isDirectory() ? FOLDER_KINDS[entry.name] : undefined;
      if (!kind) continue;
      for (const path of await yamlFiles(join(rootPath, entry.name))) {
        const entity = requireEntity(await loadYamlFile(path), path);
        if (globalIds.has(entity.id)) throw new DuplicateEntityError(`Duplicate entity id '${entity.id}' (also in ${globalIds.get(entity.id)}).`, path);
        globalIds.set(entity.id, path);
        store.get(kind)!.set(entity.id, entity);
      }
    }
  }
  return store;
}
