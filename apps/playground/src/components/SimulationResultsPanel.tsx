import React, { useMemo, useState, useEffect } from "react";
import type { EquipmentInstance, CanvasConnection } from "../types/playground";

type ResultsPanelProps = {
  instances: EquipmentInstance[];
  connections: CanvasConnection[];
  isSimulating: boolean;
};

export const SimulationResultsPanel: React.FC<ResultsPanelProps> = ({ instances, connections, isSimulating }) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const targetMetrics = useMemo(() => {
    const hasSource = instances.some((i) =>
      ["electron-gun", "photon-source", "laser", "wavepacket-generator"].includes(i.definitionId)
    );
    const barrier = instances.find((i) => i.definitionId === "potential-barrier");
    const detector = instances.find((i) => i.definitionId === "detector");
    const isConnected = connections.length > 0;

    const E = (instances.find((i) => i.definitionId === "electron-gun")?.parameters?.energy as number) || 2.5; // eV
    const V0 = (barrier?.parameters?.height as number) || 4.0; // eV
    const width = (barrier?.parameters?.width as number) || 2.5; // nm

    let transmission = 100;
    if (barrier && hasSource) {
      if (E < V0) {
        const k = 0.512 * Math.sqrt(V0 - E);
        transmission = Math.max(0.1, Math.min(99, 100 * 16 * (E / V0) * (1 - E / V0) * Math.exp(-2 * k * width)));
      } else {
        transmission = Math.min(99.9, 85 + (E - V0) * 5);
      }
    } else if (!hasSource) {
      transmission = 0;
    }

    const reflection = Math.max(0, 100 - transmission);

    return {
      hasSource,
      hasBarrier: Boolean(barrier),
      hasDetector: Boolean(detector),
      isConnected,
      transmissionVal: transmission,
      reflectionVal: reflection,
      E,
      V0,
      width,
    };
  }, [instances, connections]);

  // Live Converging Animated Values Ticker
  const [animatedT, setAnimatedT] = useState(targetMetrics.transmissionVal);
  const [animatedR, setAnimatedR] = useState(targetMetrics.reflectionVal);

  useEffect(() => {
    if (!isSimulating) {
      setAnimatedT(targetMetrics.transmissionVal);
      setAnimatedR(targetMetrics.reflectionVal);
      return;
    }

    // Ticker convergence simulation
    let currentT = targetMetrics.transmissionVal * 0.4;
    const interval = setInterval(() => {
      currentT += (targetMetrics.transmissionVal - currentT) * 0.25;
      if (Math.abs(targetMetrics.transmissionVal - currentT) < 0.1) {
        currentT = targetMetrics.transmissionVal;
        clearInterval(interval);
      }
      setAnimatedT(currentT);
      setAnimatedR(100 - currentT);
    }, 60);

    return () => clearInterval(interval);
  }, [isSimulating, targetMetrics.transmissionVal]);

  // Generate SVG Points for Wave Function Graph |\Psi(x)|^2
  const graphPoints = useMemo(() => {
    const points: string[] = [];
    const width = 260;
    const T = animatedT / 100;

    for (let x = 0; x <= width; x += 3) {
      let y = 40;
      if (x < 100) {
        const incident = Math.sin(x * 0.18);
        const reflected = 0.4 * Math.sin(-x * 0.18);
        y = 40 - 25 * Math.pow(incident + reflected, 2);
      } else if (x >= 100 && x <= 160) {
        const decayFactor = Math.exp(-(x - 100) * 0.05);
        y = 40 - 20 * decayFactor * (0.8 + 0.2 * Math.sin(x * 0.1));
      } else {
        const transmitted = Math.sqrt(T) * Math.sin(x * 0.18);
        y = 40 - 25 * Math.pow(transmitted, 2);
      }
      points.push(`${x},${Math.max(8, Math.min(72, y))}`);
    }
    return points.join(" ");
  }, [animatedT]);

  // QWM Physics Explanation
  const explanationText = useMemo(() => {
    if (targetMetrics.E < targetMetrics.V0) {
      return `Particle Energy (${targetMetrics.E.toFixed(1)} eV) is less than Potential Barrier Height (${targetMetrics.V0.toFixed(1)} eV). In classical mechanics, zero particles cross. In quantum mechanics, the matter wavefunction decays exponentially inside the barrier of width ${targetMetrics.width.toFixed(1)} nm, yielding a non-zero Transmission Probability T = ${targetMetrics.transmissionVal.toFixed(1)}%.`;
    }
    return `Particle Energy (${targetMetrics.E.toFixed(1)} eV) exceeds Potential Barrier Height (${targetMetrics.V0.toFixed(1)} eV). Over-barrier transmission dominates with wave reflection occurring at potential step boundaries.`;
  }, [targetMetrics]);

  return (
    <div className="results-panel-container">
      <div className="results-panel-header">
        <h4>⚡ Quantitative Results</h4>
        <span className={`sim-status-pill ${isSimulating ? "active" : "idle"}`}>
          {isSimulating ? "● CONVERGING..." : "STANDBY"}
        </span>
      </div>

      {/* Physics KPI Metrics Grid */}
      <div className="results-kpi-grid">
        <div className="kpi-card highlight-blue">
          <span className="kpi-label">TRANSMISSION (T)</span>
          <span className="kpi-value">{animatedT.toFixed(1)}%</span>
        </div>
        <div className="kpi-card highlight-slate">
          <span className="kpi-label">REFLECTION (R)</span>
          <span className="kpi-value">{animatedR.toFixed(1)}%</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">PARTICLE ENERGY (E)</span>
          <span className="kpi-value">{targetMetrics.E.toFixed(1)} eV</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">BARRIER WIDTH (L)</span>
          <span className="kpi-value">{targetMetrics.width.toFixed(1)} nm</span>
        </div>
      </div>

      {/* Explain This Result Button */}
      <button className="explain-result-btn" onClick={() => setShowExplanation(!showExplanation)}>
        💡 {showExplanation ? "Hide Physics Explanation" : "Explain This Result"}
      </button>

      {showExplanation && (
        <div className="explanation-card-box">
          <p className="panel-sub-label">QWM PHYSICS BREAKDOWN</p>
          <p className="explanation-text-body">{explanationText}</p>
          <pre className="equations-code">
            {"T ≈ 16(E/V₀)(1 - E/V₀) e^(-2κL)\nκ = √[2m(V₀ - E)] / ℏ"}
          </pre>
        </div>
      )}

      {/* Real-time Wave Function |\Psi(x)|^2 Graph Plot */}
      <div className="wave-graph-container">
        <div className="graph-header-row">
          <span className="panel-sub-label">WAVE FUNCTION PROBABILITY DENSITY |Ψ(x)|²</span>
          <span className="elapsed-badge">{isSimulating ? "4.2 ps" : "Idle"}</span>
        </div>
        <div className="svg-graph-wrapper">
          <svg viewBox="0 0 260 80" className="wave-graph-svg">
            <rect x="100" y="5" width="60" height="70" fill="rgba(234, 88, 12, 0.08)" stroke="rgba(234, 88, 12, 0.3)" strokeDasharray="3 3" />
            <text x="130" y="20" fill="#ea580c" fontSize="9" fontWeight="800" textAnchor="middle">
              V₀ = {targetMetrics.V0.toFixed(1)} eV
            </text>
            <line x1="0" y1="40" x2="260" y2="40" stroke="#cbd5e1" strokeDasharray="2 2" />
            <polyline fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" points={graphPoints} />
          </svg>
        </div>
      </div>
    </div>
  );
};
