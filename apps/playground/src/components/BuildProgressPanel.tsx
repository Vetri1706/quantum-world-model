import React, { useMemo } from "react";
import type { EquipmentInstance, CanvasConnection } from "../types/playground";

type BuildProgressProps = {
  instances: EquipmentInstance[];
  connections: CanvasConnection[];
};

export const BuildProgressPanel: React.FC<BuildProgressProps> = ({ instances, connections }) => {
  const validation = useMemo(() => {
    const hasSource = instances.some((i) =>
      ["electron-gun", "photon-source", "laser", "wavepacket-generator"].includes(i.definitionId)
    );
    const hasBarrier = instances.some((i) =>
      ["potential-barrier", "potential-well", "double-slit", "beam-splitter", "mirror", "polarizer"].includes(
        i.definitionId
      )
    );
    const hasDetector = instances.some((i) =>
      ["detector", "projection-screen", "counter", "probability-plot"].includes(i.definitionId)
    );
    const hasConnections = connections.length > 0;

    // Granular QWM Domain Checks
    const slitInstance = instances.find((i) => i.definitionId === "double-slit");
    const slitWidth = (slitInstance?.parameters?.slitWidth as number) || 20;
    const isSlitWidthLarge = slitInstance && slitWidth > 50;

    const qwmChecks = [
      {
        id: "src",
        label: "Source connected",
        status: hasSource ? "pass" : "fail",
        desc: hasSource ? "Electron/Photon emitter active" : "Add source from library",
      },
      {
        id: "screen",
        label: "Screen / Detector aligned",
        status: hasDetector ? "pass" : "warn",
        desc: hasDetector ? "Measurement screen positioned" : "Position screen or detector",
      },
      {
        id: "detector",
        label: "Detector reachable",
        status: hasConnections || hasDetector ? "pass" : "warn",
        desc: hasConnections ? "Signal path connected" : "Link component ports",
      },
      {
        id: "slit",
        label: isSlitWidthLarge ? "Slit width unusually large" : "Slit width optimal (d ≈ λ)",
        status: isSlitWidthLarge ? "warn" : "pass",
        desc: isSlitWidthLarge ? "Width > 50 nm reduces interference fringes" : "Optimal for diffraction",
      },
      {
        id: "model",
        label: "QWM Simulation model available",
        status: instances.length > 0 ? "pass" : "fail",
        desc: "Schrödinger & Maxwell PDE solvers ready",
      },
    ];

    let score = 0;
    if (hasSource) score += 30;
    if (hasBarrier) score += 25;
    if (hasDetector) score += 25;
    if (hasConnections) score += 20;

    const passCount = qwmChecks.filter((c) => c.status === "pass").length;
    const confidence = Math.min(98, Math.max(20, Math.round((passCount / qwmChecks.length) * 100)));

    return {
      score,
      confidence,
      isReadyToSimulate: hasSource && (hasBarrier || hasDetector || hasConnections),
      qwmChecks,
    };
  }, [instances, connections]);

  return (
    <div className="experiment-validation-panel">
      <div className="validation-panel-header">
        <h4>Scientific Validation</h4>
        <span className={`ready-badge ${validation.isReadyToSimulate ? "status-ready" : "status-not-ready"}`}>
          {validation.isReadyToSimulate ? "✔ READY TO SIMULATE" : "⚠ NOT READY"}
        </span>
      </div>

      {/* Scientific Confidence Score Bar */}
      <div className="validity-score-block">
        <div className="score-label-row">
          <span className="panel-sub-label">SCIENTIFIC CONFIDENCE</span>
          <span className="score-num">{validation.confidence}%</span>
        </div>
        <div className="progress-meter-container">
          <div className="progress-meter-bar" style={{ width: `${validation.confidence}%` }} />
        </div>
      </div>

      {/* QWM Domain Checks */}
      <div className="validation-section">
        <p className="panel-sub-label">QWM DOMAIN CHECKS</p>
        <div className="validation-checklist">
          {validation.qwmChecks.map((item) => (
            <div key={item.id} className={`val-row status-${item.status}`}>
              <span className="val-icon">
                {item.status === "pass" ? "✔" : item.status === "warn" ? "⚠" : "○"}
              </span>
              <div className="val-info">
                <span className="val-title">{item.label}</span>
                <span className="val-desc">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
