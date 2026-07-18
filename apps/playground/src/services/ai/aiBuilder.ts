import type { EquipmentInstance, CanvasConnection } from "../../types/playground";
import { equipmentRegistry } from "../../data/equipmentRegistry";
import { loadAISettings } from "./aiService";
import { BUILDER_SYSTEM_PROMPT } from "./prompts";
import type { AIBuilderResult } from "./aiTypes";

export async function generateExperimentTopology(promptText: string): Promise<{
  instances: EquipmentInstance[];
  connections: CanvasConnection[];
}> {
  const settings = loadAISettings();
  const lowerPrompt = promptText.toLowerCase();

  // Preset Layout Engines for Instant Offline & Online Builder fallback
  let builderResult: AIBuilderResult | null = null;

  if (lowerPrompt.includes("mach-zehnder") || lowerPrompt.includes("interferometer")) {
    builderResult = {
      equipment: [
        { definitionId: "laser", name: "Laser Source 1", position: { x: -300, y: 0 } },
        { definitionId: "beam-splitter", name: "50:50 Splitter 1", position: { x: -140, y: 0 } },
        { definitionId: "mirror", name: "Mirror 1", position: { x: -140, y: -160 } },
        { definitionId: "mirror", name: "Mirror 2", position: { x: 40, y: 0 } },
        { definitionId: "beam-splitter", name: "Recombining Splitter 2", position: { x: 40, y: -160 } },
        { definitionId: "detector", name: "Detector Output A", position: { x: 200, y: -160 } },
        { definitionId: "detector", name: "Detector Output B", position: { x: 40, y: -300 } },
      ],
      connections: [
        { fromIndex: 0, fromPort: "out", toIndex: 1, toPort: "in", kind: "flow" },
        { fromIndex: 1, fromPort: "out1", toIndex: 2, toPort: "in", kind: "flow" },
        { fromIndex: 1, fromPort: "out2", toIndex: 3, toPort: "in", kind: "flow" },
        { fromIndex: 2, fromPort: "out", toIndex: 4, toPort: "in", kind: "flow" },
        { fromIndex: 3, fromPort: "out", toIndex: 4, toPort: "in", kind: "flow" },
        { fromIndex: 4, fromPort: "out1", toIndex: 5, toPort: "in", kind: "flow" },
        { fromIndex: 4, fromPort: "out2", toIndex: 6, toPort: "in", kind: "flow" },
      ],
    };
  } else if (lowerPrompt.includes("tunneling") || lowerPrompt.includes("barrier")) {
    builderResult = {
      equipment: [
        { definitionId: "electron-gun", name: "Electron Gun 1", position: { x: -220, y: 0 }, parameters: { energy: 2.5 } },
        { definitionId: "potential-barrier", name: "Potential Barrier 1", position: { x: 0, y: 0 }, parameters: { height: 4.0, width: 2.5 } },
        { definitionId: "detector", name: "Quantum Detector 1", position: { x: 220, y: 0 } },
      ],
      connections: [
        { fromIndex: 0, fromPort: "out", toIndex: 1, toPort: "in", kind: "flow" },
        { fromIndex: 1, fromPort: "out", toIndex: 2, toPort: "in", kind: "flow" },
      ],
    };
  } else if (lowerPrompt.includes("double") || lowerPrompt.includes("slit") || lowerPrompt.includes("young")) {
    builderResult = {
      equipment: [
        { definitionId: "laser", name: "Laser Source 1", position: { x: -220, y: 0 } },
        { definitionId: "double-slit", name: "Double Slit Mask 1", position: { x: 0, y: 0 }, parameters: { slitWidth: 20, slitSeparation: 100 } },
        { definitionId: "projection-screen", name: "Interference Screen 1", position: { x: 240, y: 0 } },
      ],
      connections: [
        { fromIndex: 0, fromPort: "out", toIndex: 1, toPort: "in", kind: "flow" },
        { fromIndex: 1, fromPort: "out", toIndex: 2, toPort: "in", kind: "flow" },
      ],
    };
  }

  // If live provider endpoint is configured, attempt live completion
  if (settings.apiKey || settings.provider === "ollama" || settings.provider === "lmstudio") {
    try {
      let endpoint = "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      if (settings.provider === "openai" || settings.provider === "generic" || settings.provider === "lmstudio") {
        endpoint = `${settings.baseUrl || "https://api.openai.com/v1"}/chat/completions`;
        if (settings.apiKey) headers["Authorization"] = `Bearer ${settings.apiKey}`;
      } else if (settings.provider === "ollama") {
        endpoint = `${settings.baseUrl || "http://localhost:11434"}/v1/chat/completions`;
      }

      const body = {
        model: settings.model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: BUILDER_SYSTEM_PROMPT },
          { role: "user", content: `Generate JSON for: "${promptText}"` },
        ],
      };

      const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });
      if (res.ok) {
        const data = await res.json();
        const jsonText = data.choices?.[0]?.message?.content;
        if (jsonText) {
          const parsed = JSON.parse(jsonText) as AIBuilderResult;
          if (parsed.equipment && Array.isArray(parsed.equipment)) {
            builderResult = parsed;
          }
        }
      }
    } catch (err) {
      console.warn("AI Builder API call failed, using rule-based layout generator:", err);
    }
  }

  // Fallback to default setup if prompt is unrecognized
  if (!builderResult) {
    builderResult = {
      equipment: [
        { definitionId: "electron-gun", name: "Electron Gun 1", position: { x: -200, y: 0 } },
        { definitionId: "detector", name: "Quantum Detector 1", position: { x: 200, y: 0 } },
      ],
      connections: [{ fromIndex: 0, fromPort: "out", toIndex: 1, toPort: "in", kind: "flow" }],
    };
  }

  // Instantiate EquipmentInstances with definitions
  const instances: EquipmentInstance[] = builderResult.equipment.map((item, idx) => {
    const def = equipmentRegistry.find((d) => d.id === item.definitionId) || equipmentRegistry[0];
    const instId = `${item.definitionId}-${Date.now().toString().substring(7)}-${idx}`;
    return {
      id: instId,
      definitionId: def.id,
      name: item.name || `${def.name} ${idx + 1}`,
      position: item.position || { x: (idx - 1) * 200, y: 0 },
      rotation: 0,
      size: { ...def.defaultSize },
      parameters: {
        ...def.inspector.reduce((acc, f) => ({ ...acc, [f.id]: f.defaultValue }), {}),
        ...(item.parameters || {}),
      },
    };
  });

  // Map connections using generated instance IDs
  const connections: CanvasConnection[] = builderResult.connections.map((conn, idx) => {
    const fromInst = instances[conn.fromIndex];
    const toInst = instances[conn.toIndex];
    return {
      id: `conn-ai-${Date.now()}-${idx}`,
      fromId: fromInst?.id || "",
      fromPort: conn.fromPort,
      toId: toInst?.id || "",
      toPort: conn.toPort,
      kind: conn.kind || "flow",
    };
  });

  return { instances, connections };
}
