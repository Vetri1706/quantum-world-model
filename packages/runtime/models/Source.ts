import type { Entity } from "./Entity.js";

export interface Source extends Entity {
  title: string;
  publisher: string;
  source_kind: "course" | "textbook" | "institutional-reference" | "standard" | "paper" | "dataset";
  authority_tier: number;
  canonical_locator: string;
  authors?: string[];
  publication_year?: number;
  edition?: string | null;
  local_corpus_path?: string | null;
  retrieved_on?: string | null;
  content_sha256?: string | null;
  license?: string | null;
  notes?: string | null;
}
