import type { Entity, Evidence } from "./Entity.js";

export interface Equation extends Entity {
  name: string;
  domain: string;
  expression: string;
  notation: "latex";
  symbols: Record<string, { description: string; dimension?: string }>;
  assumptions: string[];
  validity_conditions?: string[];
  related_concepts?: string[];
  evidence: Evidence;
}
