import type { Component } from "./Component.js";
import type { Concept } from "./Concept.js";
import type { Environment } from "./Environment.js";
import type { Equation } from "./Equation.js";
import type { Experiment } from "./Experiment.js";
import type { ObservationRule } from "./ObservationRule.js";
import type { Procedure } from "./Procedure.js";
import type { SimulationModel } from "./SimulationModel.js";
import type { Source } from "./Source.js";

export interface ResolvedExperiment extends Omit<Experiment, "configuration" | "procedure" | "observation_rules" | "concepts" | "equations" | "sources" | "simulation_model"> {
  configuration: Omit<Experiment["configuration"], "environment" | "components"> & {
    environment: Environment;
    components: Array<{ component: Component; role: string; required: boolean }>;
  };
  procedure: Procedure;
  observation_rules: ObservationRule[];
  concepts: Concept[];
  equations: Equation[];
  sources: Source[];
  simulation_model?: SimulationModel;
}
