import React, { useState, useEffect } from "react";
import type { EquipmentInstance, CanvasConnection } from "../types/playground";

export type HistorySnapshot = {
  id: string;
  timestamp: string;
  label: string;
  paramChange: string;
  transmission: string;
  instances: EquipmentInstance[];
};

type HistoryProps = {
  instances: EquipmentInstance[];
  connections: CanvasConnection[];
  onRestoreState: (restoredInstances: EquipmentInstance[]) => void;
};

export const ExperimentHistoryPanel: React.FC<HistoryProps> = ({ instances, connections: _connections, onRestoreState }) => {
  const [history, setHistory] = useState<HistorySnapshot[]>([]);

  // Automatically log snapshot when key equipment parameters change
  useEffect(() => {
    if (instances.length === 0) return;

    const barrier = instances.find((i) => i.definitionId === "potential-barrier");
    const gun = instances.find((i) => i.definitionId === "electron-gun");

    const E = (gun?.parameters?.energy as number) || 2.5;
    const width = (barrier?.parameters?.width as number) || 2.5;
    const height = (barrier?.parameters?.height as number) || 4.0;

    let T = 100;
    if (barrier) {
      const k = 0.512 * Math.sqrt(Math.max(0.1, height - E));
      T = Math.max(0.1, Math.min(99, 100 * 16 * (E / height) * (1 - E / height) * Math.exp(-2 * k * width)));
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const newSnapshot: HistorySnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: timeStr,
      label: barrier ? `Barrier Width ${width.toFixed(1)} nm` : `Bench Layout (${instances.length} components)`,
      paramChange: `E: ${E.toFixed(1)} eV | V₀: ${height.toFixed(1)} eV`,
      transmission: `${T.toFixed(1)}%`,
      instances: JSON.parse(JSON.stringify(instances)),
    };

    setHistory((prev) => {
      // Don't duplicate last snapshot if parameters are identical
      if (prev.length > 0 && prev[0].label === newSnapshot.label && prev[0].paramChange === newSnapshot.paramChange) {
        return prev;
      }
      return [newSnapshot, ...prev.slice(0, 15)]; // Keep last 15 entries
    });
  }, [instances]);

  return (
    <div className="experiment-history-panel">
      <div className="history-panel-header">
        <h4>📜 Parameter Timeline</h4>
        <span className="history-count-badge">{history.length} Snapshots</span>
      </div>
      <p className="panel-sub-label">REWIND EXPERIMENT STATES</p>

      {history.length === 0 ? (
        <div className="empty-history">
          <p>No parameter edits logged yet. Modify component properties to create history snapshots.</p>
        </div>
      ) : (
        <div className="history-timeline-list">
          {history.map((item) => (
            <div
              key={item.id}
              className="history-card-item"
              onClick={() => onRestoreState(item.instances)}
              title="Click to restore this experiment state"
            >
              <div className="history-time-row">
                <span className="history-time">{item.timestamp}</span>
                <span className="history-t-badge">T = {item.transmission}</span>
              </div>
              <span className="history-label">{item.label}</span>
              <span className="history-params">{item.paramChange}</span>
              <button className="history-restore-btn">↩ Restore</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
