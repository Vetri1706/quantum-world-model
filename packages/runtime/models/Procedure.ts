import type { Entity, Evidence } from "./Entity.js";

export interface ProcedureStep {
  id: string;
  action: string;
  component?: string;
  parameter?: string;
  notes?: string | null;
}

export interface Procedure extends Entity {
  name: string;
  steps: ProcedureStep[];
  evidence: Evidence;
}
