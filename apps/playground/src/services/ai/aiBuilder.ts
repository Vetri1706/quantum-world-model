import type { EquipmentInstance, CanvasConnection } from "../../types/playground";
import { equipmentRegistry } from "../../data/equipmentRegistry";
import { loadAISettings } from "./aiService";
import { BUILDER_SYSTEM_PROMPT } from "./prompts";
import type { AIBuilderResult } from "./aiTypes";

export function matchExperimentId(promptText: string): string | null {
  const prompt = promptText.toLowerCase();
  if (prompt.includes("mach") || prompt.includes("zehnder") || prompt.includes("interferometer")) return "mach-zehnder";
  if (prompt.includes("stern") || prompt.includes("gerlach") || prompt.includes("spin") || prompt.includes("quantization")) return "stern-gerlach";
  if (prompt.includes("photoelectric") || prompt.includes("work function") || prompt.includes("photoelectron") || prompt.includes("photo-electric")) return "photoelectric-effect";
  if (prompt.includes("rutherford") || prompt.includes("alpha") || prompt.includes("gold foil") || prompt.includes("nucleus")) return "rutherford-scattering";
  if (prompt.includes("cradle") || prompt.includes("momentum") || prompt.includes("elastic collision") || prompt.includes("newton")) return "newtons-cradle";
  if (prompt.includes("crystal") || prompt.includes("lattice") || prompt.includes("band")) return "crystal-capsule";
  if (prompt.includes("double") || prompt.includes("slit") || prompt.includes("young") || prompt.includes("interference") || prompt.includes("diffraction")) return "wave-interference";
  if (prompt.includes("tunnel") || prompt.includes("barrier") || prompt.includes("particle in a box") || prompt.includes("infinite wall") || prompt.includes("stm")) return "quantum-tunneling";
  return null;
}

export async function generateExperimentTopology(promptText: string): Promise<{
  instances: EquipmentInstance[];
  connections: CanvasConnection[];
  supported: boolean;
  message: string;
  experimentId?: string;
}> {
  const settings = loadAISettings();
  const trimmed = promptText.trim();
  const lowerPrompt = trimmed.toLowerCase();

  // 1. Prioritize calling active local AI Model (Ollama at http://localhost:11434)
  try {
    const ollamaUrl = settings.baseUrl || "http://localhost:11434";
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: settings.model || "qwen2.5-coder:7b",
        prompt: `${BUILDER_SYSTEM_PROMPT}\n\nUser Prompt: "${promptText}"\nRespond in JSON format with {"message": "...", "experimentId": "...", "equipment": [...], "connections": [...]}:`,
        format: "json",
        stream: false,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = data.response || "";
      let parsed: any = null;
      try {
        parsed = JSON.parse(rawText);
      } catch (err) {
        // Fallthrough if rawText is plain text explanation
        if (rawText.trim()) {
          parsed = { message: rawText.trim(), equipment: [], connections: [] };
        }
      }

      if (parsed && (parsed.message || (parsed.equipment && parsed.equipment.length > 0))) {
        const aiMessage = parsed.message || "Generated experiment setup using local AI model.";
        const expId = parsed.experimentId || matchExperimentId(promptText) || undefined;

        if (Array.isArray(parsed.equipment) && parsed.equipment.length > 0) {
          const instances: EquipmentInstance[] = parsed.equipment.map((item: any, idx: number) => {
            const def = equipmentRegistry.find((d) => d.id === item.definitionId);
            const definitionId = item.definitionId || "detector";
            return {
              id: `${definitionId}-${Date.now().toString().substring(7)}-${idx}`,
              definitionId,
              name: item.name || `${def?.name || definitionId.replaceAll("-", " ")} ${idx + 1}`,
              position: item.position || { x: (idx - 1) * 200, y: 0 },
              rotation: 0,
              size: { ...(def?.defaultSize || { width: 100, height: 70 }) },
              parameters: {
                ...(def?.inspector.reduce((acc, f) => ({ ...acc, [f.id]: f.defaultValue }), {}) || {}),
                ...(item.parameters || {}),
              },
            };
          });

          const connections: CanvasConnection[] = (parsed.connections || []).map((conn: any, idx: number) => {
            const fromInst = instances[conn.fromIndex];
            const toInst = instances[conn.toIndex];
            return {
              id: `conn-ai-${Date.now()}-${idx}`,
              fromId: fromInst?.id || "",
              fromPort: conn.fromPort || "out",
              toId: toInst?.id || "",
              toPort: conn.toPort || "in",
              kind: conn.kind || "flow",
            };
          });

          return {
            instances,
            connections,
            supported: true,
            message: aiMessage,
            experimentId: expId,
          };
        } else if (aiMessage) {
          return {
            instances: [],
            connections: [],
            supported: false,
            message: aiMessage,
            experimentId: expId,
          };
        }
      }
    }
  } catch (err) {
    console.warn("Live AI model call failed, using rule-based QWM engine fallback:", err);
  }

  // 2. Intent parsing: Greetings
  const isGreeting = /^(hi|hello|hey|good morning|good afternoon|greetings|thanks|thank you)[!. ,]*$/i.test(trimmed);
  if (isGreeting) {
    return {
      instances: [],
      connections: [],
      supported: false,
      message: "Hello! I am your Quantum Lab AI Mentor. I can construct 3D experiments for you. Try asking: 'build a double-slit experiment', 'show quantum tunneling', 'setup Mach-Zehnder interferometer', 'create Stern-Gerlach spin setup', 'show Photoelectric effect', or 'run Newton's cradle'.",
    };
  }

  // 3. Intent parsing: Pure conceptual questions without explicit build intent
  const hasQuestionWord = /^(what|how|why|can you explain|tell me about|explain)\b/i.test(trimmed);
  const hasBuildIntent = /\b(build|create|make|setup|set up|show|design|explore|run|experiment|construct|load|put)\b/i.test(trimmed);

  const matchedId = matchExperimentId(promptText);

  if (hasQuestionWord && !hasBuildIntent) {
    if (matchedId === "quantum-tunneling") {
      return {
        instances: [],
        connections: [],
        supported: false,
        message: "Quantum Tunneling occurs when a wave function penetrates through a potential barrier higher than the particle's kinetic energy. Would you like me to construct a Tunneling lab on stage? Type 'build tunneling experiment'.",
      };
    } else if (matchedId === "wave-interference") {
      return {
        instances: [],
        connections: [],
        supported: false,
        message: "In Young's Double-Slit experiment, single particles or photon waves pass through two openings, overlapping to form bright and dark interference fringes. Type 'build double slit lab' to see it in 3D!",
      };
    } else if (matchedId === "mach-zehnder") {
      return {
        instances: [],
        connections: [],
        supported: false,
        message: "A Mach-Zehnder Interferometer splits a photon beam along two paths using 50:50 beam splitters. Changing path length alters phase interference at the detectors. Type 'build Mach-Zehnder' to construct it!",
      };
    } else if (matchedId === "stern-gerlach") {
      return {
        instances: [],
        connections: [],
        supported: false,
        message: "The Stern-Gerlach experiment passes magnetic dipoles through an inhomogeneous magnetic field gradient. The beam splits into discrete spin up (+1/2) and spin down (-1/2) paths. Type 'build Stern-Gerlach' to observe spin quantization!",
      };
    } else if (matchedId === "photoelectric-effect") {
      return {
        instances: [],
        connections: [],
        supported: false,
        message: "The Photoelectric Effect proves light consists of discrete energy quanta (photons, E = hf). Photons eject electrons if frequency exceeds threshold f0. Type 'build photoelectric setup' to test it!",
      };
    } else if (matchedId === "rutherford-scattering") {
      return {
        instances: [],
        connections: [],
        supported: false,
        message: "Rutherford fired alpha particles at gold foil. Backscattering revealed that atomic mass and positive charge are concentrated in a tiny central nucleus. Type 'build Rutherford scattering' to see alpha deflections!",
      };
    } else if (matchedId === "newtons-cradle") {
      return {
        instances: [],
        connections: [],
        supported: false,
        message: "Newton's Cradle demonstrates linear momentum and kinetic energy conservation across elastic 3D collisions. Type 'build Newton cradle' to run the 3D physics animation!",
      };
    } else {
      if (lowerPrompt.includes("quantum") || lowerPrompt.includes("physics") || lowerPrompt.includes("mechanics") || lowerPrompt.includes("science")) {
        return {
          instances: [],
          connections: [],
          supported: false,
          message: "Quantum physics is the branch of physics studying matter and energy at the atomic and subatomic level. At this scale, particles behave like waves, energy exists in discrete packets (quanta), and physical systems exist in superposition until measured! I can set up 3D experiments for you to observe these principles. Try typing: 'build double slit', 'show quantum tunneling', 'setup Mach-Zehnder', 'show Stern-Gerlach', or 'build photoelectric setup'.",
        };
      } else {
        return {
          instances: [],
          connections: [],
          supported: false,
          message: `I can explain concepts and construct 3D setups for Quantum Tunneling, Double-Slit Interference, Mach-Zehnder, Stern-Gerlach Spin, Photoelectric Effect, Rutherford Scattering, and Newton's Cradle. Which experiment would you like to explore?`,
        };
      }
    }
  }

  // 4. Fallback Rule-Based Topology Generators for Instant Offline Execution
  let builderResult: AIBuilderResult | null = null;
  const experimentId = matchedId || undefined;

  if (lowerPrompt.includes("mach-zehnder") || lowerPrompt.includes("interferometer")) {
    builderResult = {
      equipment: [
        { definitionId: "laser-source", name: "Laser Source (500nm)", position: { x: -300, y: 0 } },
        { definitionId: "beam-splitter", name: "50:50 Beam Splitter 1", position: { x: -140, y: 0 } },
        { definitionId: "mirror", name: "Optical Mirror 1", position: { x: -140, y: -160 } },
        { definitionId: "mirror", name: "Optical Mirror 2", position: { x: 40, y: 0 } },
        { definitionId: "phase-plate", name: "Phase Shift Plate", position: { x: -50, y: -160 } },
        { definitionId: "beam-splitter", name: "Recombining Splitter 2", position: { x: 40, y: -160 } },
        { definitionId: "detector", name: "Detector Output A", position: { x: 200, y: -160 } },
        { definitionId: "detector", name: "Detector Output B", position: { x: 40, y: -300 } },
      ],
      connections: [
        { fromIndex: 0, fromPort: "out", toIndex: 1, toPort: "in", kind: "flow" },
        { fromIndex: 1, fromPort: "out1", toIndex: 2, toPort: "in", kind: "flow" },
        { fromIndex: 1, fromPort: "out2", toIndex: 3, toPort: "in", kind: "flow" },
        { fromIndex: 2, fromPort: "out", toIndex: 4, toPort: "in", kind: "flow" },
        { fromIndex: 4, fromPort: "out", toIndex: 5, toPort: "in", kind: "flow" },
        { fromIndex: 3, fromPort: "out", toIndex: 5, toPort: "in", kind: "flow" },
        { fromIndex: 5, fromPort: "out1", toIndex: 6, toPort: "in", kind: "flow" },
        { fromIndex: 5, fromPort: "out2", toIndex: 7, toPort: "in", kind: "flow" },
      ],
    };
  } else if (lowerPrompt.includes("stern") || lowerPrompt.includes("gerlach") || lowerPrompt.includes("spin")) {
    builderResult = {
      equipment: [
        { definitionId: "atomic-source", name: "Silver Atom Oven Source", position: { x: -260, y: 0 } },
        { definitionId: "solenoid-magnet", name: "Inhomogeneous Field Magnet", position: { x: 0, y: 0 } },
        { definitionId: "riemann-sphere", name: "Qubit Spin Analyzer", position: { x: 180, y: -120 } },
        { definitionId: "detector", name: "Spin-Up (+1/2) Plate", position: { x: 240, y: 80 } },
        { definitionId: "detector", name: "Spin-Down (-1/2) Plate", position: { x: 240, y: -80 } },
      ],
      connections: [
        { fromIndex: 0, fromPort: "out", toIndex: 1, toPort: "in", kind: "flow" },
        { fromIndex: 1, fromPort: "out", toIndex: 3, toPort: "in", kind: "flow" },
        { fromIndex: 1, fromPort: "out", toIndex: 4, toPort: "in", kind: "flow" },
      ],
    };
  } else if (lowerPrompt.includes("photoelectric") || lowerPrompt.includes("photoelectron") || lowerPrompt.includes("work function")) {
    builderResult = {
      equipment: [
        { definitionId: "laser-source", name: "UV Photonic Emitter", position: { x: -240, y: 0 }, parameters: { wavelength: 350 } },
        { definitionId: "vacuum-chamber", name: "Phototube Vacuum Cell", position: { x: 0, y: 0 } },
        { definitionId: "electric-field", name: "Retarding Potential Plates", position: { x: 0, y: 0 } },
        { definitionId: "detector", name: "Photocurrent Ammeter", position: { x: 220, y: 0 } },
      ],
      connections: [
        { fromIndex: 0, fromPort: "out", toIndex: 1, toPort: "in", kind: "flow" },
        { fromIndex: 1, fromPort: "out", toIndex: 3, toPort: "in", kind: "flow" },
      ],
    };
  } else if (lowerPrompt.includes("rutherford") || lowerPrompt.includes("alpha") || lowerPrompt.includes("nucleus")) {
    builderResult = {
      equipment: [
        { definitionId: "atomic-source", name: "Alpha Particle Emitter (5MeV)", position: { x: -240, y: 0 } },
        { definitionId: "crystal-capsule", name: "Gold Foil Target (Z=79)", position: { x: 0, y: 0 } },
        { definitionId: "detector", name: "Forward Scintillator", position: { x: 230, y: 0 } },
        { definitionId: "detector", name: "Backscatter Scintillator", position: { x: -100, y: -160 } },
      ],
      connections: [
        { fromIndex: 0, fromPort: "out", toIndex: 1, toPort: "in", kind: "flow" },
        { fromIndex: 1, fromPort: "out", toIndex: 2, toPort: "in", kind: "flow" },
        { fromIndex: 1, fromPort: "out", toIndex: 3, toPort: "in", kind: "flow" },
      ],
    };
  } else if (lowerPrompt.includes("particle in a box") || lowerPrompt.includes("infinite well") || lowerPrompt.includes("infinite wall")) {
    builderResult = {
      equipment: [
        { definitionId: "electron-source", name: "Electron Source 1", position: { x: -260, y: 0 } },
        { definitionId: "infinite-wall", name: "Left Impenetrable Wall", position: { x: -20, y: 0 } },
        { definitionId: "infinite-wall", name: "Right Impenetrable Wall", position: { x: 220, y: 0 } },
        { definitionId: "detector", name: "Probability Probe", position: { x: 80, y: -170 } },
      ],
      connections: [],
    };
  } else if (lowerPrompt.includes("tunneling") || lowerPrompt.includes("barrier") || lowerPrompt.includes("stm")) {
    builderResult = {
      equipment: [
        { definitionId: "electron-source", name: "Electron Source Gun", position: { x: -220, y: 0 }, parameters: { energy: 2.5 } },
        { definitionId: "potential-barrier", name: "Potential Energy Barrier", position: { x: 0, y: 0 }, parameters: { height: 4.0, width: 2.5 } },
        { definitionId: "detector", name: "Quantum Transmission Detector", position: { x: 220, y: 0 } },
      ],
      connections: [
        { fromIndex: 0, fromPort: "out", toIndex: 1, toPort: "in", kind: "flow" },
        { fromIndex: 1, fromPort: "out", toIndex: 2, toPort: "in", kind: "flow" },
      ],
    };
  } else if (lowerPrompt.includes("double") || lowerPrompt.includes("slit") || lowerPrompt.includes("young") || lowerPrompt.includes("interference")) {
    builderResult = {
      equipment: [
        { definitionId: "laser-source", name: "Coherent Laser Source", position: { x: -220, y: 0 } },
        { definitionId: "double-slit-mask", name: "Double Slit Aperture", position: { x: 0, y: 0 }, parameters: { slitWidth: 20, slitSeparation: 100 } },
        { definitionId: "screen-detector", name: "Fluorescent Interference Screen", position: { x: 240, y: 0 } },
      ],
      connections: [
        { fromIndex: 0, fromPort: "out", toIndex: 1, toPort: "in", kind: "flow" },
        { fromIndex: 1, fromPort: "out", toIndex: 2, toPort: "in", kind: "flow" },
      ],
    };
  } else if (lowerPrompt.includes("cradle") || lowerPrompt.includes("momentum") || lowerPrompt.includes("elastic collision")) {
    builderResult = {
      equipment: [
        { definitionId: "newtons-cradle", name: "3D Newton's Cradle Apparatus", position: { x: 0, y: 0 }, parameters: { releaseAngle: 30 } },
        { definitionId: "detector", name: "Motion Telemetry Sensor", position: { x: 0, y: -190 } },
      ],
      connections: [],
    };
  } else if (lowerPrompt.includes("crystal") || lowerPrompt.includes("lattice") || lowerPrompt.includes("band")) {
    builderResult = {
      equipment: [
        { definitionId: "electron-source", name: "Electron Source", position: { x: -240, y: 0 }, parameters: { energy: 4 } },
        { definitionId: "crystal-capsule", name: "Crystal Capsule Lattice", position: { x: 0, y: 0 } },
        { definitionId: "detector", name: "Transmission Detector", position: { x: 230, y: 0 } },
      ],
      connections: [
        { fromIndex: 0, fromPort: "out", toIndex: 1, toPort: "in", kind: "flow" },
        { fromIndex: 1, fromPort: "out", toIndex: 2, toPort: "in", kind: "flow" },
      ],
    };
  }

  if (!builderResult) {
    return {
      instances: [],
      connections: [],
      supported: false,
      message: "I couldn't match a specific experiment topology for that request. Try asking to build 'double slit', 'quantum tunneling', 'Mach-Zehnder', 'Stern-Gerlach', 'photoelectric effect', 'Rutherford scattering', or 'Newton's cradle'.",
    };
  }

  // Instantiate EquipmentInstances with definitions
  const instances: EquipmentInstance[] = builderResult.equipment.map((item, idx) => {
    const def = equipmentRegistry.find((d) => d.id === item.definitionId);
    const definitionId = item.definitionId;
    const instId = `${item.definitionId}-${Date.now().toString().substring(7)}-${idx}`;
    return {
      id: instId,
      definitionId,
      name: item.name || `${def?.name || definitionId.replaceAll("-", " ")} ${idx + 1}`,
      position: item.position || { x: (idx - 1) * 200, y: 0 },
      rotation: 0,
      size: { ...(def?.defaultSize || { width: 100, height: 70 }) },
      parameters: {
        ...(def?.inspector.reduce((acc, f) => ({ ...acc, [f.id]: f.defaultValue }), {}) || {}),
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

  return {
    instances,
    connections,
    supported: true,
    message: `Built ${instances.length} pieces of 3D equipment for your experiment. You can inspect parameters, move equipment on stage, or start simulation.`,
    experimentId: experimentId || undefined,
  };
}
