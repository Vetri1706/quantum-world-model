/** Build-time bridge: RuntimeRepository -> immutable PlaygroundModel JSON. */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { RuntimeRepository } from "../../../packages/runtime/index.ts";
import { PlaygroundModelBuilder } from "../../../packages/playground-model/index.ts";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../../..");
const outputPath = resolve(scriptDirectory, "../src/data/quantum-tunneling.model.json");

const runtime = new RuntimeRepository();
await runtime.loadRepository(repositoryRoot);
const experiment = runtime.requireExperiment("quantum-tunneling");
const model = PlaygroundModelBuilder.fromExperiment(experiment)
  .withDefaultLayout()
  .withRendererAssets()
  .withControls()
  .withConnections()
  .withViewport()
  .build();

await mkdir(resolve(outputPath, ".."), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(model, null, 2)}\n`, "utf8");
console.log(`Generated ${outputPath}`);
