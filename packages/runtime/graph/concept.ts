import type { Concept } from "../models/Concept.js";
import type { Equation } from "../models/Equation.js";

export interface RuntimeConcept extends Omit<Concept, "related_concepts" | "equations"> {
  related_concepts: RuntimeConcept[];
  equations: Equation[];
}
