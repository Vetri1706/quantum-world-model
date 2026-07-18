import type { Entity, Evidence } from "./Entity.js";

export interface Predicate {
  subject: string;
  operator: string;
  value?: number | string | boolean | null;
  unit?: string | null;
}

export interface ObservationRule extends Entity {
  name: string;
  condition: Predicate;
  outcome: Predicate;
  equation?: string;
  applicability?: Array<{ entity_type: "concept" | "component" | "environment"; id: string }>;
  explanation?: string | null;
  evidence: Evidence;
}
