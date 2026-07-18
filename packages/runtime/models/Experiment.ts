import type { Entity, Evidence } from "./Entity.js";

export interface ParameterDefinition {
  id: string;
  label: string;
  quantity: string;
  unit: string;
  default: number | string | boolean | null;
  minimum?: number | null;
  maximum?: number | null;
  allowed_values?: Array<number | string | boolean>;
}

export interface Experiment extends Entity {
  name: string;
  domain: string;
  scientific_question: string;
  goal: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  configuration: {
    environment: string;
    components: Array<{ component: string; role: string; required: boolean }>;
    parameters: ParameterDefinition[];
  };
  procedure: string;
  observation_rules: string[];
  concepts: string[];
  equations: string[];
  sources: string[];
  simulation_model?: string;
  renderer?: { mode: string; component_roles?: string[]; parameter_ids?: string[] };
  educational_notes?: string | null;
  evidence: Evidence;
}
