import type { Entity, Evidence } from "./Entity.js";

export interface Environment extends Entity {
  name: string;
  environment_kind: "laboratory" | "vacuum" | "cryogenic" | "idealized" | "other";
  conditions: Record<string, unknown>;
  notes?: string | null;
  evidence: Evidence;
}
