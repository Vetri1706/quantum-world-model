export type AIProviderType = "openai" | "ollama" | "lmstudio" | "generic";

export interface AISettings {
  provider: AIProviderType;
  authMode: "account" | "apikey";
  accountUser?: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  availableModels?: string[];
}

export interface AIResponse {
  content: string;
  provider: AIProviderType;
  model: string;
  groundedConcepts: string[];
  groundedSources: string[];
}

export interface AIBuilderResult {
  equipment: {
    definitionId: string;
    name?: string;
    position?: { x: number; y: number };
    parameters?: Record<string, any>;
  }[];
  connections: {
    fromIndex: number;
    fromPort: string;
    toIndex: number;
    toPort: string;
    kind: "flow" | "measurement";
  }[];
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: "openai",
  authMode: "account",
  accountUser: "chatgpt-user@quantum-playground",
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o",
  temperature: 0.2,
  maxTokens: 2048,
  availableModels: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-5-mini"],
};
