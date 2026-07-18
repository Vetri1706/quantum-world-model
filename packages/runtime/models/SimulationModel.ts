import type { Entity, Evidence } from "./Entity.js";

export interface ModelPort { id: string; quantity: string; unit: string; }

export interface SimulationModel extends Entity {
  name: string;
  model_kind: string;
  engine: string;
  entry_point: string;
  inputs: ModelPort[];
  outputs: ModelPort[];
  equations: string[];
  renderer_mode?: string | null;
  supported_components?: string[];
  limitations?: string[];
  evidence?: Evidence;
}
