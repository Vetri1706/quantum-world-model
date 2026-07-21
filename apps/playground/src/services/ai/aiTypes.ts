export type AIProviderType = "groq" | "openai" | "gemini" | "anthropic" | "ollama" | "lmstudio" | "generic";

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
  provider: "groq",
  authMode: "apikey",
  accountUser: "chatgpt-user@quantum-playground",
  apiKey: "",
  baseUrl: "https://api.groq.com/openai/v1",
  model: "llama-3.3-70b-versatile",
  temperature: 0.2,
  maxTokens: 2048,
  availableModels: ["llama-3.3-70b-versatile", "deepseek-r1-distill-llama-70b", "mixtral-8x7b-32768", "gemma2-9b-it"],
};
