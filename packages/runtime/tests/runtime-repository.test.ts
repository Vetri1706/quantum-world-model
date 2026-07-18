import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { RuntimeRepository } from "../index.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

test("loads and resolves the quantum tunneling experiment graph", async () => {
  const runtime = new RuntimeRepository();
  await runtime.loadRepository(repositoryRoot);

  const experiment = runtime.getExperiment("quantum-tunneling");
  assert.ok(experiment);
  assert.equal(experiment.configuration.environment.id, "vacuum-chamber");
  assert.equal(experiment.configuration.components[0].component.id, "electron-source");
  assert.equal(experiment.procedure.id, "quantum-tunneling-setup");
  assert.equal(experiment.observation_rules[0].id, "quantum-tunneling-observation-rules");
  assert.equal(experiment.simulation_model?.id, "rectangular-barrier-model");
});

test("exposes the requested repository API", async () => {
  const runtime = new RuntimeRepository();
  await runtime.loadRepository(repositoryRoot);

  assert.equal(runtime.getConcept("wave-function")?.id, "wave-function");
  assert.equal(runtime.getComponent("detector")?.id, "detector");
  assert.equal(runtime.getEquation("schrodinger-equation")?.id, "schrodinger-equation");
  assert.equal(runtime.listExperiments().length, 1);
  assert.ok(runtime.listComponents().length >= 5);
});
