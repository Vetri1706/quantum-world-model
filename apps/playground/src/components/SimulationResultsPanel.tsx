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
    <div className="space-y-3 text-slate-900 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h4 className="font-extrabold text-xs tracking-wider uppercase flex items-center gap-1.5 text-slate-900">
          <span>⚡ Live Quantitative Results</span>
        </h4>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${isSimulating ? "bg-slate-900 text-white animate-pulse" : "bg-slate-100 text-slate-600"}`}>
          {isSimulating ? "● REALTIME" : "STANDBY"}
        </span>
      </div>

      {/* Physics KPI Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-900 text-white">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider block text-slate-400">TRANSMISSION (T)</span>
          <span className="text-lg font-black font-mono text-white">{animatedT.toFixed(1)}%</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider block text-slate-500">REFLECTION (R)</span>
          <span className="text-lg font-black font-mono text-slate-900">{animatedR.toFixed(1)}%</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider block text-slate-500">PARTICLE ENERGY (E)</span>
          <span className="text-sm font-black font-mono text-slate-800">{targetMetrics.E.toFixed(1)} eV</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider block text-slate-500">BARRIER WIDTH (L)</span>
          <span className="text-sm font-black font-mono text-slate-800">{targetMetrics.width.toFixed(1)} nm</span>
        </div>
      </div>

      {/* Explain This Result Button */}
      <button
        className="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1"
        onClick={() => setShowExplanation(!showExplanation)}
      >
        💡 {showExplanation ? "Hide Explanation" : "Explain Physics Result"}
      </button>

      {showExplanation && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">QWM PHYSICS BREAKDOWN</p>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">{explanationText}</p>
          <pre className="p-2 rounded-lg bg-slate-900 text-white text-[10px] font-mono leading-tight overflow-x-auto">
            {"T ≈ 16(E/V₀)(1 - E/V₀) e^(-2κL)\nκ = √[2m(V₀ - E)] / ℏ"}
          </pre>
        </div>
      )}

      {/* Real-time Wave Function |\Psi(x)|^2 Graph Plot */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 font-mono">
          <span>PROBABILITY DENSITY |Ψ(x)|²</span>
          <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded-md">{isSimulating ? "4.2 ps" : "Idle"}</span>
        </div>
        <div className="w-full bg-white rounded-lg border border-slate-200 p-1">
          <svg viewBox="0 0 260 80" className="w-full h-16">
            <rect x="100" y="5" width="60" height="70" fill="rgba(15, 23, 42, 0.08)" stroke="#0f172a" strokeDasharray="3 3" />
            <text x="130" y="20" fill="#0f172a" fontSize="9" fontWeight="800" textAnchor="middle">
              V₀ = {targetMetrics.V0.toFixed(1)} eV
            </text>
            <line x1="0" y1="40" x2="260" y2="40" stroke="#cbd5e1" strokeDasharray="2 2" />
            <polyline fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" points={graphPoints} />
          </svg>
        </div>
      </div>
    </div>
  );
};
