import React, { useMemo } from "react";
import type { EquipmentInstance } from "../types/playground";
import { BlochSphere3D } from "./BlochSphere3D";

type QuantumStateInspectorProps = {
  selectedInstance: EquipmentInstance | null;
};

export const QuantumStateInspector: React.FC<QuantumStateInspectorProps> = ({ selectedInstance }) => {
  const quantumState = useMemo(() => {
    if (!selectedInstance) return null;
    const defId = selectedInstance.definitionId;
    const params = selectedInstance.parameters || {};

    if (defId === "laser" || defId === "photon-source") {
      const polarization = params.polarization ?? 45;
      const phaseRad = (polarization * Math.PI) / 180;
      const phi = (params.phase ?? 0) * (Math.PI / 180);
      return {
        type: "Single Photon",
        stateVectorText: `|Psi> = ${Math.cos(phaseRad).toFixed(2)}|H> + ${Math.sin(phaseRad).toFixed(2)}e^(i${phi.toFixed(2)})|V>`,
        theta: phaseRad,
        phi,
      };
    }

    if (defId === "electron-gun") {
      const energy = params.energyEv ?? params.energy ?? 5.0;
      return {
        type: "Matter Wave",
        stateVectorText: `|Psi> = 1/sqrt(2)|up> + 1/sqrt(2)|down>  E=${energy}eV`,
        theta: Math.PI / 3,
        phi: Math.PI / 4,
      };
    }
    return null;
  }, [selectedInstance]);

  if (!selectedInstance || !quantumState) {
    return (
      <div className="state-inspector-card empty">
        <p className="panel-sub-label">QUANTUM STATE INSPECTOR</p>
        <p className="empty-hint">Select a quantum object on the workbench to inspect its Bloch sphere state vector.</p>
      </div>
    );
  }

  return (
    <div className="state-inspector-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="panel-sub-label">3D BLOCH SPHERE</span>
        <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "3px", background: "rgba(71,131,62,0.15)", color: "var(--accent)" }}>
          ACTIVE
        </span>
      </div>
      <BlochSphere3D theta={quantumState.theta} phi={quantumState.phi} stateVectorText={quantumState.stateVectorText} width={240} height={170} />
    </div>
  );
};
