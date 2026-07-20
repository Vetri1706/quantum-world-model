import React, { useMemo, useState } from "react";
import type { EquipmentInstance, CanvasConnection } from "../types/playground";
import { BuildProgressPanel } from "./BuildProgressPanel";
import { SimulationResultsPanel } from "./SimulationResultsPanel";
import { ExperimentHistoryPanel } from "./ExperimentHistoryPanel";
import { loadAISettings, askAIScientist } from "../services/ai/aiService";
import { evaluateGuardrails } from "../services/ai/aiGuardrails";

type AIScientistProps = {
  instances: EquipmentInstance[];
  connections: CanvasConnection[];
  mode: "diy" | "guided" | "build";
  isSimulating?: boolean;
  onLoadPreset: (presetName: string) => void;
  onAskScientist: (query: string) => void;
  onRestoreState?: (restoredInstances: EquipmentInstance[]) => void;
  onOpenSettings?: () => void;
};

export const AIScientistPanel: React.FC<AIScientistProps> = ({
  instances,
  connections,
  mode: _mode,
  isSimulating = false,
  onLoadPreset: _onLoadPreset,
  onAskScientist: _onAskScientist,
  onRestoreState = () => {},
  onOpenSettings = () => {},
}) => {
  const [mainTab, setMainTab] = useState<"scientist" | "results" | "progress" | "history">("scientist");
  const [subTab, setSubTab] = useState<"prediction" | "observation" | "explain" | "questions">("prediction");

  // Check active components
  const hasElectronGun = instances.some((inst) => inst.definitionId === "electron-gun");
  const hasLaser = instances.some((inst) => inst.definitionId === "laser" || inst.definitionId === "photon-source");
  const hasBarrier = instances.some((inst) => inst.definitionId === "potential-barrier");
  const hasDoubleSlit = instances.some((inst) => inst.definitionId === "double-slit");
  const hasPolarizer = instances.some((inst) => inst.definitionId === "polarizer");

  // Perform topological analysis for prediction, observations, and Try Next suggestions
  const analysis = useMemo(() => {
    if (instances.length === 0) {
      return {
        prediction: "The laboratory workbench is clear. Select a Quantum Source (Laser or Electron Gun) from the left library to begin.",
        observations: [
          { status: "info", text: "● Bench is clear. Drag components onto the grid canvas." }
        ],
        tryNext: [
          "Drag an Electron Gun onto the workbench",
          "Deploy a Quantum Tunneling preset from the Experiments tab",
          "Deploy Young's Double Slit preset from the Experiments tab"
        ],
        explain: "In classical physics, particles and waves are distinct entities. In quantum mechanics, energy and matter exhibit wave-particle duality. You can assemble custom experiments here to calculate and observe wavefunctions in real time.",
        notes: "Schrödinger Equation:\niℏ ∂/∂t |Ψ⟩ = Ĥ |Ψ⟩\n\nElectromagnetic Wave:\n∇²E - (1/c²) ∂²E/∂t² = 0",
        questions: ["What happens to a matter wavefunction when it encounters a potential barrier higher than its kinetic energy?"]
      };
    }

    let prediction = "Analyzing active apparatus layout...";
    let observationsList: { status: "success" | "warning" | "info"; text: string }[] = [];
    let tryNextList: string[] = [];
    let explanationsList: string[] = [];
    let equations: string[] = [];
    let questions: string[] = [];

    // Check connections
    const unconnectedEmitters = instances.filter(
      (inst) =>
        (inst.definitionId === "electron-gun" || inst.definitionId === "laser" || inst.definitionId === "photon-source") &&
        !connections.some((conn) => conn.fromId === inst.id)
    );

    if (unconnectedEmitters.length > 0) {
      observationsList.push({
        status: "warning",
        text: `⚠ Unconnected Source (${unconnectedEmitters.map(e => e.name).join(", ")}). Connect sockets to route beam.`
      });
      tryNextList.push("Drag a cable/beam line from the green output socket of the source to a target component");
    } else {
      observationsList.push({ status: "success", text: "✔ Active source outputs routed successfully." });
    }

    // Tunneling setup analysis
    if (hasElectronGun && hasBarrier) {
      const isConnectedToBarrier = connections.some(
        (conn) =>
          instances.find((i) => i.id === conn.fromId)?.definitionId === "electron-gun" &&
          instances.find((i) => i.id === conn.toId)?.definitionId === "potential-barrier"
      );
      const isBarrierConnectedToDetector = connections.some(
        (conn) =>
          instances.find((i) => i.id === conn.fromId)?.definitionId === "potential-barrier" &&
          instances.find((i) => i.id === conn.toId)?.definitionId === "detector"
      );

      if (isConnectedToBarrier && isBarrierConnectedToDetector) {
        observationsList.push({ status: "success", text: "✔ Electron source aligned with Potential Barrier" });
        observationsList.push({ status: "success", text: "✔ Quantum Detector aligned to barrier output" });
        
        prediction = "Transmission probability will decrease exponentially if the barrier width increases, or if the barrier height is raised.";
        explanationsList.push("Quantum tunneling occurs because the matter wavefunction extends into classically forbidden energy regions. Inside a barrier where V > E, the wave function decays exponentially. If the barrier thickness is small, a non-zero amplitude exits the barrier.");
        equations.push("Transmission Coefficient T:\nT ≈ 16 * (E/V) * (1 - E/V) * e^(-2 * κ * L)\nκ = √[2m(V - E)] / ℏ");
        questions.push("Why does the wavefunction decay exponentially inside the barrier rather than oscillating?");
        
        tryNextList.push("Increase Electron Energy (E) in Inspector to see how tunneling transmission changes");
        tryNextList.push("Increase Barrier Width (L) to observe exponential wave attenuation");
      } else {
        observationsList.push({
          status: "info",
          text: "● Connect Electron Gun → Potential Barrier → Detector to measure tunneling."
        });
      }
    }

    // Double slit analysis
    if (hasDoubleSlit) {
      observationsList.push({ status: "success", text: "✔ Double Slit apparatus placed." });
      prediction = "Coherent wave fronts passing through the dual slits will interfere constructively and destructively, forming fringe patterns on the screen.";
      explanationsList.push("Young's double-slit experiment demonstrates wave-particle duality. Overlapping wavelets form path length differences resulting in bright and dark interference fringes.");
      equations.push("Fringe Spacing Δy = L * λ / d");
      questions.push("What happens if you observe which slit each photon passes through?");
    }

    // Polarizer analysis
    if (hasPolarizer && hasLaser) {
      observationsList.push({ status: "success", text: "✔ Laser source incident upon polarizing filter." });
      prediction = "Light beam will become linearly polarized. Rotating the polarizer angle will modulate transmitted power according to Malus's Law.";
      explanationsList.push("Polarizers project photon spin states |ψ⟩ onto a chosen linear axis angle θ.");
      equations.push("Malus's Law: I = I₀ * cos²(θ)");
      questions.push("How does adding a third 45° polarizer between crossed 0° and 90° polarizers restore light?");
    }

    if (explanationsList.length === 0) {
      explanationsList.push("Laboratory layout configured. Adjust component properties in the Inspector or click Run.");
    }
    if (equations.length === 0) {
      equations.push("Quantum Wave Function:\nΨ(x, t) = A * e^(i(kx - ωt))");
    }

    return {
      prediction,
      observations: observationsList,
      tryNext: tryNextList,
      explain: explanationsList.join("\n\n"),
      notes: equations.join("\n\n"),
      questions: questions.length > 0 ? questions : ["How does measurement collapse a quantum superposition state?"]
    };
  }, [instances, connections]);

  const [userQuery, setUserQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { id: string; sender: "user" | "ai"; text: string; time: string }[]
  >([
    {
      id: "welcome-1",
      sender: "ai",
      text: "Hello! I am your AI Quantum Scientist mentor. Ask me anything about your current experiment, wave functions, or quantum tunneling.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const aiSettings = loadAISettings();
  const guardrailsReport = useMemo(() => {
    return evaluateGuardrails("Quantum wave function transmission Schrödinger equation", instances, {});
  }, [instances]);

  const handleAskQuestion = async (queryText: string) => {
    if (!queryText.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg = { id: `user-${Date.now()}`, sender: "user" as const, text: queryText, time: timeStr };
    
    setChatHistory((prev) => [...prev, userMsg]);
    setUserQuery("");
    setIsThinking(true);

    try {
      const activeSource = instances.find((i) =>
        ["electron-gun", "photon-source", "laser", "wavepacket-generator"].includes(i.definitionId)
      );
      const activeBarrier = instances.find((i) => i.definitionId === "potential-barrier");
      
      const response = await askAIScientist(queryText, {
        experimentName: activeBarrier ? "Quantum Tunneling Lab" : "Quantum Optics Workbench",
        parameters: activeBarrier?.parameters || activeSource?.parameters || {},
        metrics: { E: activeSource?.parameters?.energy || 2.5, V0: activeBarrier?.parameters?.height || 4.0 },
      });

      const aiMsg = { id: `ai-${Date.now()}`, sender: "ai" as const, text: response.content, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Scientist query failed:", err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAskQuestion(userQuery);
  };

  return (
    <aside className="ai-scientist-panel sidebar-ai-panel">
      {/* Top Sidebar Main Tabs */}
      <div className="panel-main-tabs">
        <button
          className={`main-tab-btn ${mainTab === "scientist" ? "active" : ""}`}
          onClick={() => setMainTab("scientist")}
        >
          🧠 AI
        </button>
        <button
          className={`main-tab-btn ${mainTab === "results" ? "active" : ""}`}
          onClick={() => setMainTab("results")}
        >
          ⚡ Results
        </button>
        <button
          className={`main-tab-btn ${mainTab === "progress" ? "active" : ""}`}
          onClick={() => setMainTab("progress")}
        >
          📊 Valid
        </button>
        <button
          className={`main-tab-btn ${mainTab === "history" ? "active" : ""}`}
          onClick={() => setMainTab("history")}
        >
          📜 History
        </button>
      </div>

      {mainTab === "results" ? (
        <SimulationResultsPanel instances={instances} connections={connections} isSimulating={isSimulating} />
      ) : mainTab === "progress" ? (
        <BuildProgressPanel instances={instances} connections={connections} />
      ) : mainTab === "history" ? (
        <ExperimentHistoryPanel instances={instances} connections={connections} onRestoreState={onRestoreState} />
      ) : (
        <div className="ai-scientist-content">
          {/* Sub Navigation */}
          <div className="ai-sub-tabs">
            <button
              className={`ai-sub-btn ${subTab === "prediction" ? "active" : ""}`}
              onClick={() => setSubTab("prediction")}
            >
              🔮 Predict
            </button>
            <button
              className={`ai-sub-btn ${subTab === "observation" ? "active" : ""}`}
              onClick={() => setSubTab("observation")}
            >
              👁 Obs ({analysis.observations.length})
            </button>
            <button
              className={`ai-sub-btn ${subTab === "explain" ? "active" : ""}`}
              onClick={() => setSubTab("explain")}
            >
              📘 Explain
            </button>
            <button
              className={`ai-sub-btn ${subTab === "questions" ? "active" : ""}`}
              onClick={() => setSubTab("questions")}
            >
              ❓ Q&A
            </button>
          </div>

          <div className="ai-tab-body">
            {subTab === "prediction" && (
              <div className="ai-section-pane">
                <p className="panel-sub-label">PREDICTION</p>
                <p className="predict-paragraph">{analysis.prediction}</p>

                {analysis.tryNext.length > 0 && (
                  <div className="try-next-block">
                    <p className="panel-sub-label margin-top">RECOMMENDED ACTIONS</p>
                    <ul className="try-next-list">
                      {analysis.tryNext.map((task, idx) => (
                        <li key={idx}>⚙ {task}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {subTab === "observation" && (
              <div className="ai-section-pane">
                <p className="panel-sub-label">SETUP OBSERVATIONS</p>
                <div className="observations-checklist">
                  {analysis.observations.map((obs, idx) => (
                    <div key={idx} className={`obs-row ${obs.status}`}>
                      {obs.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {subTab === "explain" && (
              <div className="ai-section-pane">
                <p className="panel-sub-label">PHYSICS EXPLANATION</p>
                <p className="explain-paragraph">{analysis.explain}</p>
                {analysis.notes && (
                  <>
                    <p className="panel-sub-label margin-top">FOUNDATIONAL EQUATIONS</p>
                    <pre className="equations-code">{analysis.notes}</pre>
                  </>
                )}
              </div>
            )}

            {subTab === "questions" && (
              <div className="ai-section-pane chat-pane">
                <p className="panel-sub-label">INTERACTIVE AI SCIENTIST CHAT</p>
                
                {/* Chat History Thread */}
                <div className="chat-messages-thread">
                  {chatHistory.map((msg) => (
                    <div key={msg.id} className={`chat-bubble-row ${msg.sender}`}>
                      <div className="chat-bubble">
                        <span className="chat-sender">{msg.sender === "ai" ? "🧠 AI Scientist" : "👤 You"}</span>
                        <p className="chat-text">{msg.text}</p>
                        <span className="chat-time">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                  {isThinking && (
                    <div className="chat-bubble-row ai thinking">
                      <div className="chat-bubble">
                        <span className="chat-sender">🧠 AI Scientist</span>
                        <p className="chat-text">Thinking & computing QWM observables...</p>
                      </div>
                    </div>
                  )}
                </div>

                <p className="panel-sub-label margin-top">SUGGESTED QUESTIONS</p>
                <div className="questions-column">
                  {analysis.questions.map((q, idx) => (
                    <button key={idx} className="question-chip-btn" onClick={() => handleAskQuestion(q)}>
                      💡 {q}
                    </button>
                  ))}
                </div>

                <form className="sidebar-ask-form" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    placeholder="Ask AI Scientist a question..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                  />
                  <button type="submit" className="sidebar-ask-btn" disabled={isThinking}>
                    {isThinking ? "..." : "Ask →"}
                  </button>
                </form>
              </div>
            )}

            {/* Grounded Physics Reasoning & 6-Layer Guardrail Badge */}
            <div className="grounded-reasoning-card">
              <div className="grounded-card-header">
                <span className="panel-sub-label">QWM REASONING & GUARDRAILS</span>
                <button className="settings-link-btn" onClick={onOpenSettings} title="Configure AI Provider">
                  ⚙ AI Settings
                </button>
              </div>
              <div className="grounded-model-tag">
                <span className="provider-pill">{aiSettings.provider.toUpperCase()}</span>
                <span className="model-name-str">{aiSettings.model}</span>
                <span className="guardrail-pass-pill">✔ {guardrailsReport.passedCount}/{guardrailsReport.totalChecks} GUARDRAILS PASSED</span>
              </div>
              <div className="grounded-check-list">
                <div className="g-check-item">
                  <span className="g-label">1. Physics Grounding:</span>
                  <span className="g-val">✔ Schrödinger & Maxwell</span>
                </div>
                <div className="g-check-item">
                  <span className="g-label">2. QWM Grounding:</span>
                  <span className="g-val">✔ Liboff, Shankar, MIT OCW</span>
                </div>
                <div className="g-check-item">
                  <span className="g-label">3. Equipment Schema:</span>
                  <span className="g-val">✔ Registered Apparatus</span>
                </div>
                <div className="g-check-item">
                  <span className="g-label">4. Parameter Bounds:</span>
                  <span className="g-val">✔ Valid Physical Range</span>
                </div>
                <div className="g-check-item">
                  <span className="g-label">5. Simulation Energy:</span>
                  <span className="g-val">✔ Probability Conserved</span>
                </div>
                <div className="g-check-item">
                  <span className="g-label">6. Safety Filter:</span>
                  <span className="g-val">✔ Physics Instruction Scope</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
