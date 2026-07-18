import type { Entity, Evidence } from "./Entity.js";

export interface Concept extends Entity {
  name: string;
  domain: string;
  definition: string;
  aliases?: string[];
  related_concepts?: string[];
  equations?: string[];
  evidence: Evidence;
}
