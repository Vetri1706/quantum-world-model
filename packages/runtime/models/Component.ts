import type { Entity, Evidence } from "./Entity.js";

export interface Component extends Entity {
  name: string;
  component_kind: "equipment" | "element" | "source" | "detector" | "material";
  category: string;
  properties?: Record<string, unknown>;
  compatible_with?: string[];
  renderer_asset?: string | null;
  evidence: Evidence;
}
