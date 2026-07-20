import React, { useMemo } from "react";
import type { EquipmentInstance } from "../types/playground";

type TreeWidgetProps = {
  instances: EquipmentInstance[];
};

export const ManyWorldsTreeWidget: React.FC<TreeWidgetProps> = ({ instances }) => {
  const branchTree = useMemo(() => {
    const hasSource = instances.some((i) =>
      ["electron-gun", "photon-source", "laser", "wavepacket-generator"].includes(i.definitionId)
    );
    const splitters = instances.filter((i) =>
      ["beam-splitter", "double-slit", "potential-barrier"].includes(i.definitionId)
    );

    if (!hasSource) {
      return {
        root: "No Active Source",
        branches: [],
      };
    }

    if (splitters.length === 0) {
      return {
        root: "Deterministic Path (Single Branch)",
        branches: [{ id: "world-1", name: "World α (Unbranched)", probability: "100%", status: "Coherent" }],
      };
    }

    return {
      root: `Superposition Branching (${splitters.length} Splitter Node${splitters.length > 1 ? "s" : ""})`,
      branches: [
        { id: "world-a", name: "World A: Transmitted Branch", probability: "50%", status: "Superposition Active" },
        { id: "world-b", name: "World B: Reflected Branch", probability: "50%", status: "Superposition Active" },
      ],
    };
  }, [instances]);

  return (
    <div className="many-worlds-widget">
      <div className="widget-header">
        <span className="panel-sub-label">MANY-WORLDS BRANCH TREE</span>
        <span className="widget-count">{branchTree.branches.length} Branches</span>
      </div>

      <div className="tree-root-label">● {branchTree.root}</div>

      <div className="tree-branches-list">
        {branchTree.branches.map((branch) => (
          <div key={branch.id} className="branch-card">
            <span className="branch-line">├─</span>
            <div className="branch-info">
              <span className="branch-name">{branch.name}</span>
              <span className="branch-prob">{branch.probability} Probability</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
