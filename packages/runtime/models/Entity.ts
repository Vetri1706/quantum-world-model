export type EntityStatus = "draft" | "review" | "approved" | "deprecated";

export interface Entity {
  id: string;
  schema_version: string;
  status: EntityStatus;
  supersedes?: string;
  deprecated_by?: string;
}

export interface EvidenceEntry {
  source: string;
  locator: string;
  claim_type: string;
}

export type Evidence = Record<string, EvidenceEntry[]>;
