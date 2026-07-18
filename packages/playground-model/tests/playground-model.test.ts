import assert from "node:assert/strict";
import test from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { RuntimeRepository } from "../../runtime/index.js";
import { PlaygroundModelBuilder } from "../index.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

test("projects a runtime experiment into a renderer-only playground model", async () => {
  const runtime = new RuntimeRepository();
  await runtime.loadRepository(repositoryRoot);
  const experiment = runtime.resolveExperiment("quantum-tunneling");
  assert.ok(experiment);

  const model = PlaygroundModelBuilder
    .fromExperiment(experiment)
    .withDefaultLayout()
    .withRendererAssets()
    .withControls()
    .withConnections()
    .withViewport()
    .build();

  assert.equal(model.experimentId, "quantum-tunneling");
  assert.deepEqual(model.components.map(component => component.id), ["electron-source", "potential-barrier", "detector"]);
  assert.equal(model.components[1].asset, "potential-barrier");
  assert.equal(model.controls.length, 3);
  assert.deepEqual(model.connections.map(connection => connection.id), ["electron-source-to-potential-barrier", "potential-barrier-to-detector"]);
  assert.equal("evidence" in model.components[0], false);
});
